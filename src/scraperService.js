'use strict';

const NodeCache = require('node-cache');
const plugin = require('./plugins/archerc7');
const errors = require('./errors');

function ScraperService(config) {
  if (!config) {
    throw new errors.ConfigurationError('No config provided.');
  }

  if (!config.plugins) {
    throw new errors.ConfigurationError('Configuration contained no plugins section.');
  }
  // TODO: throw if not valid witha plugins section
  this._config = config;
  // TODO: this should be configurable
  this._cache = new NodeCache({ stdTTL: 3000, checkperiod: 60 });
}

function findMatchingClient(clientList, targetHost) {
  return clientList.find(client =>
    client.host.toLowerCase() === targetHost);
}

ScraperService.prototype.getAddress = function getAddress(targetHost) {
  return new Promise((resolve, reject) => {
    let result;
    // TODO: generate a symbol and stick it to the plugin
    const cachedClientList = this._cache.get('bang');

    if (cachedClientList) {
      console.log('cache available');
      result = findMatchingClient(cachedClientList, targetHost);

      if (result) {
        console.log('cache hit');
        return resolve(result);
      }
    }

    console.log('cache miss');

    // TODO: load any configured plugin
    // TODO: don't hardcode the config for this plugin specifically
    return plugin.getClientList(this._config.plugins[0])
      .then(clientList => {
        console.log('loaded client list');
        this._cache.set('bang', clientList);
        // console.dir(clientList);
        result = findMatchingClient(clientList, targetHost);
        return resolve(result);
      })
      .catch(err => reject(err));
  });
};

module.exports = ScraperService;
