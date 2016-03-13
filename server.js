'use strict';

const dns = require('native-dns');
const config = require('./src/config');
require('dotenv').config();
const ScraperSerivce = require('./src/scraperService');
const DnsProxyService = require('./src/dnsProxyService');

// TODO: make this a config setting
// TODO: replace console statements with log calls
// TODO; figure out the recursion requested error in responses
const targetDomainExpression = /\.local$/i;

const scraperSerivce = new ScraperSerivce(config);
const dnsProxySerivce = new DnsProxyService(config);
const server = dns.createServer();

server.on('request', (request, response) => {
  // to keep things simple, assume one question per request
  const questionName = request.question[0].name;

  console.log(`${new Date()} request for ${questionName} ->`);

  if (!targetDomainExpression.test(questionName)) {
    // make a request to our fallback server
    console.log('Not in target domain.');
    dnsProxySerivce.makeRequest(request)
      .then(proxyAnswer => {
        console.log('Got response from proxy service.');
        response.answer = proxyAnswer.answer;
        response.send();
        console.log('<--request');
      })
      .catch(err => {
        console.error('Proxied Request Error!');
        console.error(err);
      });

    return;
  }

  const editedQuestionName =
    questionName.toLowerCase().replace(/\.local/, '');

  scraperSerivce.getAddress(editedQuestionName)
    .then(matchingClient => {
      if (matchingClient) {
        console.log('matched ', questionName);
        response.answer.push(dns.A({
          name: questionName,
          address: matchingClient.ipv4,
          // TODO: ipv6
          // TODO: don't hardcode
          ttl: 600,
        }));
      } else {
        console.log('didn\'t match ', questionName);
      }
      response.send();
      console.log('<--request');
    })
    .catch(err => {
      console.log('Scraper Error!');
      console.error(err);
    });
});

server.on('listening', () => console.log('server listening:', server.address()));
server.on('close', () => console.log('server closed'));
server.on('socketError', err => {
  console.error('Socket error!');
  console.error(err);
});
server.on('error', err => {
  // TODO: exit the process
  console.error('Unhandled Error!');
  console.error(err);
  console.log(err.stack);
});

// TODO: make this configurable
// TODO: need to run with sudo for such a low port
server.serve(53);
