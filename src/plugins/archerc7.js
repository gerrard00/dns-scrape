'use strict';

let request = require('request');
const md5 = require('md5');
const escapeStringRegexp = require('escape-string-regexp');
const errors = require('../errors.js');

// TODO: handle outdated cache (i.e. a new host is added after the plugin caches the list
module.exports = {
  getClientList(totalConfig) {
    // TODO: move the regex patterns out of this function
    // TODO: hacky, find a better way to pass the config context

    // TODO: error handling for cases when no archerc7 config is available
    const config = totalConfig.archerc7;
    if (!config.username) {
      return Promise.reject(
        new errors.ConfigurationError('Username is required.',
          'username'));
    }

    if (!config.url) {
      return Promise.reject(
        new errors.ConfigurationError('Url is required.',
          'url'));
    }

    const authKeyPattern =
      new RegExp(`${escapeStringRegexp(config.url)}/(\\w*)/userRpm/Index.htm`, 'g');
    const clientListArrayPattern = /DHCPDynList = new Array\(([^\(]*)\)/g;


    function parseClientList(body) {
      // get the contents of the array
      // TODO: error handling
      const execResult = clientListArrayPattern.exec(body);

      if (!execResult) {
        throw new Error('Could not parse dhcp client list');
      }

      return execResult[1]
        .replace(/\n/g, ' ')
        .replace(/"/g, '')
        .split(',')
        .filter(entry => entry !== '')
        .reduce((prev, current) => {
          if (prev[0].length === 4) {
            prev.unshift([]);
          }
          prev[0].push(current.trim());
          return prev;
        }, [[]])
        .filter(client => client.length === 4)
        .map(client => ({
          host: client[0],
          ipv6: client[1],
          ipv4: client[2],
          lease: client[3],
        }));
    }

    return new Promise((resolve, reject) => {
      let authCookieValue =
        new Buffer(`${config.username}:${md5(config.password)}`)
        .toString('base64');
        // escape is deprecated, but match router code
      authCookieValue = escape(authCookieValue);

      const authorizationCookie =
        request.cookie(`Authorization=Basic%20${authCookieValue};path=/`);

      // TODO: remove this
      const cookieJar = request.jar();
      cookieJar.setCookie(authorizationCookie, config.url);

      request = request.defaults({ baseUrl: config.url, jar: cookieJar });
      request('/userRpm/LoginRpm.htm?Save=Save',
        (error, response, body) => {
          if (error) {
            return reject(error);
          }
          // TODO: error handling
          const authKeyMatches = authKeyPattern.exec(body);

          if (!authKeyMatches || authKeyMatches.length !== 2) {
            return reject(
              new errors.LoginError(`Login failed: No auth keys found, examine body: ${body}`));
          }

          const authKey = authKeyMatches[1];
          const authenticatedRequest = request.defaults(
            { baseUrl: `${config.url}/${authKey}` });

          authenticatedRequest('/userRpm/AssignedIpAddrListRpm.htm',
            (addressListError, addressListResponse, addressListBody) => {
              // TODO: addressListError handling
              if (addressListError) {
                return reject(addressListError);
              }

              let clients;
              let clientParseError;

              try {
                clients = parseClientList(addressListBody);
              } catch (err) {
                clientParseError = err;
              }

              request('/userRpm/Logout.htm', (logoutError, logoutResponse) => {
                if (logoutError) {
                   // TODO: really log ths addressListError
                  console.error(logoutError);
                  return;
                }
                console.log('logout: ', logoutResponse.statusCode);
              });

              // resolve/reject now, no use having the caller wait for us to logout
              return (clientParseError) ?
                reject(clientParseError) :
                resolve(clients);
            });
        });
    });
  },
};
