export type ActionProcess<TRequestEventPayload, TResponseEventPayload> =
  (requestEventPayload: TRequestEventPayload) => TResponseEventPayload;

export interface ClusterIpcBusEventReceiverOptionItem<TRequestEventPayload, TResponseEventPayload> {
  actionEventName: string;
  successEvtName: string;
  failureEvtName: string;
  onAction: any;
}

export interface ClusterIpcBusEventReceiverOptions {
  items: ClusterIpcBusEventReceiverOptionItem<any, any>[];
}
