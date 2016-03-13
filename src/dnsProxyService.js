'use strict';

const dns = require('native-dns');

function DnsProxyService(config) {
  this._config = config;
}

DnsProxyService.prototype.makeRequest = function makeRequest(originalRequest) {
  // note: don't need to cache, native-dns auto does it
  console.log('Preparing to make request to proxied DNS server');
  return new Promise((resolve, reject) => {
    const newRequest = dns.Request({
      question: originalRequest.question[0],
      // TODO: read this from config
      server: { address: '8.8.8.8', port: 53, type: 'udp' },
      timeout: 1000,
    });

    newRequest.on('timeout', () =>
      reject(new Error('Proxied request timed out.')));

    newRequest.on('message', (err, answer) => {
      if (err) {
        return reject(err);
      }
      return resolve(answer);
    });
    newRequest.send();
  });
};

module.exports = DnsProxyService;
