'use strict';

const archerC7Plugin = require('./src/plugins/archerc7');
const config = require('./src/config');
const dns = require('native-dns');

// TODO: allow user to configure a pattern for which domains to listen for
// TODO: make this a config setting
const targetDomainExpression = /\.lindsayland$/i;

//TODO: communication with the router plugins should be in another module

const server = dns.createServer();

server.on('request', (request, response) => {

  archerC7Plugin.getClientList(config)
    .then(clientList => {
      console.log(clientList);
      request.question.forEach(question => {
        let matchingClient = clientList.find(client =>
          client.host.toLowerCase() === question.name.toLowerCase());

        if(matchingClient) {
          response.answer.push(dns.A({
            name: matchingClient.host,
            address: matchingClient.ipv4,
            ttl: 600
          }));
          response.send();
        }
      });
    })
    .catch(err => console.error(err));
 
});

server.on('error', (err, buff, req, res) => {
  console.log(err.stack);
});

server.serve(5353);
