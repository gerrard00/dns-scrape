'use strict';

const NodeCache = require('node-cache');
const plugin = require('./plugins/archerc7');

const cache = new NodeCache({stdTTL: 300, checkperiod: 60});

module.exports = {
  getClientList(config) {
    // TODO: generate a symbol and stick it to the plugin, then use that as the handle to get stuff from cache 
    let result = cache.get('bang');

    if (result) {
      console.log('cache hit');
      return Promise.resolve(result);
    }

    console.log('cache miss');
    return plugin.getClientList(config)
      .then(clientList => {
        cache.set('bang', clientList);
        // console.dir(clientList);
        return Promise.resolve(clientList);
      });
  }
};
