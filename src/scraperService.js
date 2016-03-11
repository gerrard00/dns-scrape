'use strict';

const NodeCache = require('node-cache');
const plugin = require('./plugins/archerc7');

module.exports = ScraperService;

function ScraperService(config) {
  this._config = config;
  //TODO: this should be configurable
  this._cache = new NodeCache({stdTTL: 300, checkperiod: 60});
}

function findMatchingClient(clientList, targetHost) {
  return clientList.find(client =>
    client.host.toLowerCase() === targetHost);
}

ScraperService.prototype.getAddress = function(targetHost) {
  return new Promise((resolve, reject) => {
    let result;
    // TODO: generate a symbol and stick it to the plugin, then use that as the handle to get stuff from cache
    let clientList = this._cache.get('bang');

    if (clientList) {
      console.log('cache available');
      result = findMatchingClient(clientList, targetHost);

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
    });
  });
};
