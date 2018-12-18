import { Service } from 'typedi';
import * as _ from 'lodash';
import { LoggingService } from '../common/logging';
import { ClusterIpcBusEmitter, ClusterIpcBusEmitterOptions } from '../common/cluster';
import { MasterWorkerCache, MasterWorkerMapEntry } from './master-worker-cache';
import { MasterCommand } from '../message-producer';
import { EventTypes, ExecCmdEventPayload, ExecCmdSuccessEventPayload } from '../events';
import { Util } from '../common/helpers';

@Service()
export class MasterCommandHandler {

  private _currentWorkerIndex: number;
  private static readonly TIMEOUT: number = 20000; // ms

  constructor(
    private _loggingService: LoggingService,
    private _masterWorkerCache: MasterWorkerCache,
    private _ipcBusEventEmitter: ClusterIpcBusEmitter) {
    this._currentWorkerIndex = 0;
    this._loggingService.debug(`${MasterCommandHandler.name} has been build`);
  }

  async execCommandAsync(command: MasterCommand): Promise<void> {
    this._loggingService.trace(`${MasterCommandHandler.name} receives command`, command);
    let mapEntry: MasterWorkerMapEntry = null;

    const cardId = command.payload.cardId;
    mapEntry = await this.getTargetWorkerAsync(cardId);

    // Through the IPC eventBus, asks the worker process the execute the command
    // Listen for SUCCESS ACK - FAILURE will throw exception
    const handlerOptions: ClusterIpcBusEmitterOptions = {
      actionEventName: EventTypes.EXEC_CMD,
      successEvtName: EventTypes.EXEC_CMD_SUCCESS,
      failureEvetName: EventTypes.EXEC_CMD_FAILURE,
      receiveTimeout: MasterCommandHandler.TIMEOUT
    };
    const requestPayload: ExecCmdEventPayload = { ...command.payload };
    const successPayload: ExecCmdSuccessEventPayload =
      await this._ipcBusEventEmitter.sendEventAndWaitAnswerAsync<ExecCmdEventPayload, ExecCmdSuccessEventPayload>
        (requestPayload, mapEntry.wpid, mapEntry.worker, handlerOptions);
  }

  private async getTargetWorkerAsync(cardId: number): Promise<MasterWorkerMapEntry> {

    let workerMapEntry = await this._masterWorkerCache.getEntryByCardIdAsync(cardId);

    if (workerMapEntry) {
      this._loggingService.debug(
        `${MasterCommandHandler.name} [CARD-ID:${cardId}] is ALREADY handled by worker [PID:${workerMapEntry.wpid}]`);
    } else {
      workerMapEntry = await this._masterWorkerCache.getEntryByIndexAsync(this._currentWorkerIndex);
      workerMapEntry.cardIds.push(cardId);
      this._currentWorkerIndex = (this._currentWorkerIndex + 1) % Util.cpusCount;
      this._loggingService.debug(
        `${MasterCommandHandler.name} [CARD-ID:${cardId}] is NOW handled by worker [PID:${workerMapEntry.wpid}]`);
    }

    this._masterWorkerCache.displayCache();
    return workerMapEntry;
  }
}
