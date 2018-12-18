import { Service } from 'typedi';
import { LoggingService } from '../common/logging';
import { WorkerCommandHandler } from './worker-command-handler';
import { IpcEventBus } from '../common/ipc-bus';

@Service()
export class WorkerServer {

  constructor(
    private _loggingService: LoggingService,
    private _eventBus: IpcEventBus,
    private _workerCommandHandler: WorkerCommandHandler
  ) {
    this._loggingService.debug(`${WorkerServer.name} has been build`);
  }

  async startAsync(): Promise<WorkerServer> {
    this._loggingService.trace(`${WorkerServer.name} is starting...`);
    this._eventBus.start();
    await this._workerCommandHandler.startAsync();

    this._loggingService.debug(`${WorkerServer.name} successfully started`);
    return await this;
  }
}
