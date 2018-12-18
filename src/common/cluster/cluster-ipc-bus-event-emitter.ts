import { Service } from 'typedi';
import { Event, IpcEventBus, IEvent } from '../ipc-bus';
import { filter, timeout, take } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { ClusterIpcBusEmitterOptions } from '.';
import { Worker } from 'cluster';
import { GuidHelper } from '../helpers';
import { LoggingService } from '../logging';

@Service()
export class ClusterIpcBusEmitter {
  constructor(
    private _loggingService: LoggingService,
    private _eventBus: IpcEventBus) {
  }

  async sendEventAndWaitAnswerAsync<TRequestPayload, TResponsePayload>(
    requestPayload: TRequestPayload,
    workerPid: number,
    worker: Worker,
    options: ClusterIpcBusEmitterOptions): Promise<TResponsePayload> {
    const corrId = GuidHelper.generateUuid();
    const wait$: Observable<Event> = this.subscribeToEventAsync(corrId, workerPid, options);

    const requestEvent = new Event(options.actionEventName, requestPayload, workerPid, corrId);
    this._eventBus.emitAsync(requestEvent, worker);

    const responseEvent: Event = await wait$.toPromise();

    switch (responseEvent.type) {
      case options.successEvtName: {
        this._loggingService.debug(
          `event [${responseEvent.type}] received ` +
          `from worker [PID:${responseEvent.workerPid}] on IPC event bus`,
          responseEvent);
        return responseEvent.payload as TResponsePayload;
      }
      case options.failureEvetName: {
        const failureMessage =
          `event [${responseEvent.type}] received ` +
          `from worker [PID:${responseEvent.workerPid}] on IPC event bus`;
        this._loggingService.error(failureMessage, responseEvent);
        throw new Error(`${failureMessage} [${responseEvent.payload}]`);
      }
      default: {
        const unknownMessage =
          `Worker [PID:${workerPid}] received ` +
          `an unknown event [${responseEvent.type}]  on IPC event bus`;
        this._loggingService.error(unknownMessage, responseEvent);
        throw new Error(unknownMessage);
      }
    }
  }

  private subscribeToEventAsync(corrId: string, workerPid: number, options: ClusterIpcBusEmitterOptions): Observable<Event> {
    return this._eventBus
      .ofTypes(options.successEvtName, options.failureEvetName)
      .pipe(
        filter((evt: IEvent) => evt.corrId === corrId),
        filter((evt: IEvent) => evt.workerPid === workerPid),
        timeout(options.receiveTimeout),
        take(1)  // to automatically remove subscription
      );

  }
}
