import { Service } from 'typedi';
import { Configuration } from './configuration';
import minimist = require('minimist');

@Service()
export class ConfigurationService {

  private _config: Configuration;

  constructor() {
    const args = minimist(process.argv.slice(2));
    const configPath = `./config-${args.env}.json`;
    this._config = require(configPath);
  }

  get config(): Configuration {
    return this._config;
  }
}
