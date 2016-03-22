'use strict';

const NodeCache = require('node-cache');
const plugin = require('./plugins/archerc7');

function ScraperService(config) {
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

    return plugin.getClientList(this._config)
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
