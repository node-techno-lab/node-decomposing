import { Service } from 'typedi';
import { IEvent, Event, DefaultEventTypes, IpcEventBus } from '../ipc-bus';
import { ClusterIpcBusEventReceiverOptions } from '.';
import { LoggingService } from '../logging';

@Service()
export class ClusterIpcBusReceiver {

  private _options: ClusterIpcBusEventReceiverOptions;

  constructor(
    private _loggingService: LoggingService,
    private _eventBus: IpcEventBus) {
  }

  async initializeAsync(options: ClusterIpcBusEventReceiverOptions): Promise<void> {
    this._options = options;
  }

  async startAsync(): Promise<void> {
    this.subscribeToEvents(this._options);
  }

  private async subscribeToEvents<TRequestEventPayload, TResponseEventPayload>(
    options: ClusterIpcBusEventReceiverOptions): Promise<void> {
    this._loggingService.trace(`${ClusterIpcBusReceiver.name} subscribing to IPC event bus with master...`);

    let eventSuccess: IEvent = null;
    const eventNames: string[] = options.items.map(i => i.actionEventName);
    this._eventBus
      .ofTypes(...eventNames)
      .subscribe(async (event: IEvent) => {
        this._loggingService.debug(
          `${ClusterIpcBusReceiver.name} received event [${event.type}] ` +
          `on IPC event bus from master`, event);

        // TODO - for performance reason , the array should be replaced by Map 
        for (let index = 0; index < options.items.length; index++) {
          const evt = options.items[index];
          try {
            if (evt.actionEventName === event.type) {
              const eventRequestPayload: TRequestEventPayload = event.payload;
              const successEventPayload: TResponseEventPayload = await evt.onAction(eventRequestPayload);
              eventSuccess = new Event(evt.successEvtName, successEventPayload, process.pid, event.corrId);
              await this.sendEventAsync(eventSuccess);
              break;
            }
          } catch (err) {
            const eventFailure = new Event(evt.failureEvtName, err.message, process.pid, event.corrId);
            await this.sendEventAsync(eventFailure);
          }
        }
        if (!eventSuccess) {
          this.handleUnknownEventAsync(event);
        }
      },
        (err: Error) => this._loggingService.error(`${ClusterIpcBusReceiver.name} unexpected error subscribeToEvents()`, err)
      );
  }

  private handleUnknownEventAsync(event: IEvent): Promise<void> {
    this._loggingService.warn(
      `${ClusterIpcBusReceiver.name} received unknown event [${event.type}] on IPC event bus from master`, event);

    const unknownEvent: IEvent = new Event(DefaultEventTypes.UNNOWN_EVENT_TYPE, null, process.pid, event.corrId);
    return this.sendEventAsync(unknownEvent);
  }

  private sendEventAsync(event: Event): Promise<void> {
    this._loggingService.debug(`${ClusterIpcBusReceiver.name} send event [${event.type}] on IPC event bus to master`, event);
    return this._eventBus.emitAsync(event);
  }
}
