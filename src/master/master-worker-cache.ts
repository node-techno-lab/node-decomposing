import { Service } from 'typedi';
import { Worker } from 'cluster';
import { LoggingService } from '../common/logging';
import moment from 'moment';

export interface MasterWorkerMapEntry {
  wpid: number;       // Cluster worker Process ID
  worker: Worker;     // Ref to the cluster Worker process
  startTime: string;
  cardIds: number[];  // Cluster worker process start time
}

@Service()
export class MasterWorkerCache {

  private _workersMap: Map<number, MasterWorkerMapEntry>;

  constructor(private _loggingService: LoggingService) {
    this._workersMap = new Map<number, MasterWorkerMapEntry>();
    this._loggingService.debug(`${MasterWorkerCache.name} has been build`);
  }

  async registerWorkerAsync(clusterWorker: Worker): Promise<void> {
    const wpid = clusterWorker.process.pid;

    this._loggingService.trace(
      `${MasterWorkerCache.name} registering worker [PID:${wpid}]...`);

    if (this._workersMap.has(wpid)) {
      throw new Error(`Workers cache entry [PID:${wpid}] found with the same key !`);
    }

    const workerMapEntry: MasterWorkerMapEntry = {
      wpid: wpid,
      worker: clusterWorker,
      startTime: moment().format(),
      cardIds: new Array<number>()
    };

    this._workersMap.set(wpid, workerMapEntry);

    this._loggingService.debug(
      `${MasterWorkerCache.name} successfully registered worker [PID:${wpid}]-${this.cacheItemsCountMessage}`);
  }

  async unregisterWorkerAsync(clusterWorker: Worker): Promise<void> {
    const wpid = clusterWorker.process.pid;

    this._loggingService.trace(`${MasterWorkerCache.name} unregistering worker [PID:${wpid}]...`);

    const workerMapEntry = await this.getEntryByPIDAsync(wpid);
    this._workersMap.delete(workerMapEntry.wpid);

    this._loggingService.debug(
      `${MasterWorkerCache.name} successfully unregistered worker [PID:${wpid}]-${this.cacheItemsCountMessage}`);
  }

  async getEntryByPIDAsync(wpid: number): Promise<MasterWorkerMapEntry> {
    if (!this._workersMap.has(wpid)) {
      const message = `Workers Cache key [${wpid}] is not found.`;
      this._loggingService.error(message);
      throw new Error(message);
    }
    const workerMapEntry = this._workersMap.get(wpid);
    return workerMapEntry;
  }

  async getEntryByIndexAsync(index: number): Promise<MasterWorkerMapEntry> {
    if ((index < 0) || (index > this._workersMap.size)) {
      const message = `Workers Cache index [${index}] is out of bound.`;
      this._loggingService.error(message);
      throw new Error(message);
    }
    const workerMapEntry = this._workersMap.get(Array.from(this._workersMap.keys())[index]);
    return workerMapEntry;
  }

  async getEntryByCardIdAsync(cardId: number): Promise<MasterWorkerMapEntry> {
    return new Promise((resolve, reject) => {
      try {
        for (const workerMapEntry of this._workersMap.values()) {
          if (workerMapEntry.cardIds.indexOf(cardId) > -1) {
            resolve(workerMapEntry);
          }
        }
        resolve(null);
      } catch (err) {
        reject(err);
      }
    });
  }

  displayCache(): void {

    const cacheItems = new Array<any>();
    for (const workerMapEntry of this._workersMap.values()) {
      const { worker, ...noWorker } = workerMapEntry;
      cacheItems.push(noWorker);
    }

    this._loggingService.info(`${MasterWorkerCache.name} content`, cacheItems);
  }

  private get cacheItemsCountMessage(): string {
    return `Workers cache contains now ${this._workersMap.size} worker(s)`;
  }
}
