import { Service } from 'typedi';
import { Cluster } from 'cluster';
import { LoggingService } from '../common/logging';
import { ClusterIpcBusEventReceiverOptions, ClusterIpcBusReceiver } from '../common/cluster';
import { EventTypes, ExecCmdSuccessEventPayload, ExecCmdEventPayload } from '../events';
const cluster: Cluster = require('cluster');

@Service()
export class WorkerCommandHandler {

  constructor(
    private _loggingService: LoggingService,
    private _clusterIpcBusReceiver: ClusterIpcBusReceiver
  ) {
    this._loggingService.trace(`${WorkerCommandHandler.name} has been build`);
  }

  async startAsync(): Promise<void> {
    await this.initializeAsync();
    return this._clusterIpcBusReceiver.startAsync();
  }

  private initializeAsync(): Promise<void> {
    const options: ClusterIpcBusEventReceiverOptions = {
      items: [
        {
          actionEventName: EventTypes.EXEC_CMD,
          successEvtName: EventTypes.EXEC_CMD_SUCCESS,
          failureEvtName: EventTypes.EXEC_CMD_FAILURE,
          onAction: this.onExecCommandAsync.bind(this)
        }
      ]
    };
    return this._clusterIpcBusReceiver.initializeAsync(options);
  }

  private async onExecCommandAsync(requestEventPayload: ExecCmdEventPayload): Promise<ExecCmdSuccessEventPayload> {

    const cardId = requestEventPayload.cardId;
    this._loggingService.debug(
      `${WorkerCommandHandler.name} executing command for [CARD-ID:${cardId}]...`);

    if (cardId === 4) {
      this._loggingService.info(`${WorkerCommandHandler.name} simulates an unexpected exception for [CARD-ID:${cardId}]!`);
      const strg: string = null;
      const length = strg.length;
    } else if (cardId === 5) {
      this._loggingService.info(`${WorkerCommandHandler.name} simulates a crash for [CARD-ID:${cardId}]`);
      process.exit(cardId);
    }

    // Create a new SUCCESS Event and send it to master through the IPC Event Bus
    const response: ExecCmdSuccessEventPayload = {
      ack: `ACK from Worker INDEX:[${cluster.worker.id}] PID:[${cluster.worker.process.pid}] CARD-ID:[${cardId}]`
    };
    return response;
  }
}
