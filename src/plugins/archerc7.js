'use strict';

let request = require('request');
const md5 = require('md5');
const escapeStringRegexp = require('escape-string-regexp');

module.exports = {
  getClientList(config) {
    // TODO: validate config
    const authKeyPattern = new RegExp(escapeStringRegexp(config.url) +
      '/(\\w*)', 'g');
    const clientListArrayPattern = /DHCPDynList = new Array\(([^\(]*)\)/g;

    function parseClientList(body) {
      // get the contents of the array
      // TODO: error handling
      let result = clientListArrayPattern.exec(body)[1]
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
      .map(client => {
        return {
          host: client[0],
          ipv6: client[1],
          ipv4: client[2],
          lease: client[3]
        };
      });

      return result;
    }

    return new Promise((resolve, reject) => {
      let authCookieValue =
        new Buffer(`${config.username}:${md5(config.password)}`)
        .toString('base64');
      // escape is deprecated, but match router code
      authCookieValue = escape(authCookieValue);

      const authorizationCookie =
        request.cookie(`Authorization=Basic%20${authCookieValue};path=/`);

      const cookieJar = request.jar();
      cookieJar.setCookie(authorizationCookie, config.url);

      request = request.defaults({baseUrl: config.url, jar: cookieJar});
      request('/userRpm/LoginRpm.htm?Save=Save',
        (error, response, body) => {
          if (error) {
            return reject(error);
          }
          // TODO: error handling
          let authKeyMatches = authKeyPattern.exec(body);

          // TODO: handle the case where nothing matches
          if (authKeyMatches && authKeyMatches.length === 2) {
            let authKey = authKeyMatches[1];
            let authenticatedRequest = request.defaults(
              {baseUrl: `${config.url}/${authKey}`});

            authenticatedRequest('/userRpm/AssignedIpAddrListRpm.htm',
              (error, response, body) => {
                // TODO; error handling
                let clients = parseClientList(body);
                //resolve now, now use having the caller wait for us to logout
                resolve(clients);

                request('/userRpm/Logout.htm', (err, response, body) => {
                  if (err) {
                    // TODO: really log ths error
                    console.error(err);
                  }
                  console.log('logout: ', response.statusCode);
                });
              });
          }
        });
    });
  }};
