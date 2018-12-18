import { Service } from 'typedi';
import { Cluster, Worker } from 'cluster';
import { LoggingService } from '../common/logging';
import { IpcEventBus } from '../common/ipc-bus';
import { MasterWorkerCache } from './master-worker-cache';
import { Util } from '../common/helpers';

const cluster: Cluster = require('cluster');

@Service()
export class MasterServer {

  constructor(
    private _loggingService: LoggingService,
    private _eventBus: IpcEventBus,
    private _workerCache: MasterWorkerCache) {
    this._loggingService.trace(`${MasterServer.name} has been build`);
  }

  async startAsync(): Promise<any> {
    this._loggingService.trace(`${MasterServer.name} is starting...`);
    await this.createAndStartNodeClusterAsync();
    this._loggingService.debug(`${MasterServer.name} successfully started`);
  }

  async createAndStartNodeClusterAsync(): Promise<void> {
    this._loggingService.trace(`${MasterServer.name} creating and starting Node Custer...`);
    this._eventBus.start();
    await this.createAndRegisterAllClusterWorkersAsync();
    this.subscribeToClusterWorkerExit();
    this._loggingService.debug(`${MasterServer.name} successfully created and started Node Cluster`);
  }

  private async createAndRegisterAllClusterWorkersAsync() {
    const cpusCount = Util.cpusCount;
    this._loggingService.debug(`${MasterServer.name} creating cluster workers for ${cpusCount} CPU's cores...`);
    for (let i = 0; i < cpusCount; i++) {
      const clusterWorker: Worker = cluster.fork();
      await this._workerCache.registerWorkerAsync(clusterWorker);
    }
  }

  private subscribeToClusterWorkerExit() {
    this._loggingService.debug(`${MasterServer.name} subscribing to 'exit' event and wait end of cluster workers...`);
    cluster.on('online', this.onOnlineClusterWorker.bind(this));
    cluster.on('exit', this.onExitClusterWorker.bind(this));
  }

  private onOnlineClusterWorker(clusterWorker: Worker): void {
    this._loggingService.debug(
      `${MasterServer.name} detects worker [PID:${clusterWorker.process.pid}] is online`);
  }

  private async onExitClusterWorker(clusterWorker: Worker, code: number, signal: string): Promise<void> {
    this._loggingService.warn(
      `${MasterServer.name} detects worker [PID:${clusterWorker.process.pid}] has stopped ` +
      `[code:'${code}' signal:'${signal}']`);

    if (code !== 0 && !clusterWorker.exitedAfterDisconnect) {
      this._workerCache.unregisterWorkerAsync(clusterWorker);

      this._loggingService.info(`${MasterServer.name} forking a new worker process...`);
      const newClusterWorker = cluster.fork();
      await this._workerCache.registerWorkerAsync(newClusterWorker);
    }
  }
}
