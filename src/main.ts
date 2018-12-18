import 'reflect-metadata';
import { Container } from 'typedi';
import { Cluster } from 'cluster';
import { MasterServer } from './master/master-server';
import { WorkerServer } from './worker/worker-server';
import { MessageProducer } from './message-producer';
import { ServerHooks } from './common/helpers/server-hooks';

const cluster: Cluster = require('cluster');

const start = async (): Promise<void> => {
  if (cluster.isMaster) {
    await Container.get(MasterServer).startAsync();
    Container.get(MessageProducer).startAsync();
  } else {
    await Container.get(WorkerServer).startAsync();
  }
};

ServerHooks.registerProcessHooks();
start()
  .catch(err => console.log(err));
