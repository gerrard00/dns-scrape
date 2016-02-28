'use strict';

const dns = require('native-dns');
const scraperSerivce = require('./src/scraperService');
const config = require('./src/config');

// TODO: allow user to configure a pattern for which domains to listen for
// TODO: make this a config setting
// const targetDomainExpression = /\.lindsayland$/i;

// TODO: communication with the router plugins should be in another module

const server = dns.createServer();

server.on('request', (request, response) => {
  console.log(`${new Date()} request->`);
  //     response.send();
  //     return;
  scraperSerivce.getClientList(config)
    .then(clientList => {
      console.log('got client list');
      request.question.forEach(question => {
        let matchingClient = clientList.find(client =>
          client.host.toLowerCase() === question.name.toLowerCase());

        if (matchingClient) {
          response.answer.push(dns.A({
            name: matchingClient.host.toLowerCase(),
            address: matchingClient.ipv4,
            // TODO: don't hardcode
            ttl: 600
          }));
          console.log('<--request');
        }
      });
      response.send();
    })
    .catch(err => console.error(err));
});

server.on('error', err => {
  // TODO: exit the process
  console.log(err);
});

server.serve(53);
