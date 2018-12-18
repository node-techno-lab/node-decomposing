import { interval } from 'rxjs';
import { take } from 'rxjs/operators';
import { Service } from 'typedi';
import { MasterCommandHandler } from './master/master-command-handler';
import { LoggingService } from './common/logging';

export interface MasterCommand {
  name: string;
  payload: {
    cardId: number;
    message: string;
  };
}

@Service()
export class MessageProducer {

  private static INTERVAL_LMS = 10000;
  private static MAX_CARD_ID = 5;
  private static MAX_MSG = 100;

  constructor(
    private _loggingService: LoggingService,
    private _masterCommandHandler: MasterCommandHandler) {
  }

  get generateCartId(): number {
    return Math.floor(Math.random() * MessageProducer.MAX_CARD_ID) + 1;
  }

  startAsync(): void {
    this._loggingService.trace(`${MessageProducer.name} start producing messages...`);

    interval(MessageProducer.INTERVAL_LMS)
      .pipe(take(MessageProducer.MAX_MSG))
      .subscribe((idx: number) => {
        const cardId = this.generateCartId;
        const command: MasterCommand = {
          name: 'exec-cmd',
          payload: {
            cardId: cardId,
            message: `msg-${cardId}`
          }
        };
        this._loggingService.debug(`${MessageProducer.name} produces command ${idx + 1}/${MessageProducer.MAX_MSG}...`);
        this._masterCommandHandler.execCommandAsync(command);
      },
        (err) => this._loggingService.error(`${MessageProducer.name}Error`, err),
        () => this._loggingService.trace(`${MessageProducer.name} stop producing message...`)
      );
  }
}
