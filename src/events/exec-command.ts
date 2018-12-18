export interface ExecCmdEventPayload {
  cardId: number;
  message: string;
}

export interface ExecCmdSuccessEventPayload {
  ack: string;
}

export interface ExecCmdFailureEventPayload {
  error: Error;
}
