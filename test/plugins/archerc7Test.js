'use strict';

const chai = require('chai');
const nock = require('nock');
const chaiAsPromised = require('chai-as-promised');

chai.should();
chai.use(chaiAsPromised);

let config;
const errors = require('../../src/errors.js');
const sut = require('../../src/plugins/archerc7.js');

describe('archerc7', function archerc7() {
  beforeEach(function beforeEach() {
    nock.cleanAll();
    config = {
      url: 'http://hostname',
      username: 'username',
      password: 'password',
    };
  });

  it('can make requests to router', function canMakeRequestsToRouter() {
    nock(config.url)
      .get('/userRpm/LoginRpm.htm?Save=Save')
      .replyWithFile(200, `${__dirname}/../data/login-success.html`)
      .get('/WSGLKMGBVHXJPZTB/userRpm/AssignedIpAddrListRpm.htm')
      .replyWithFile(200, `${__dirname}/../data/StatusRpm.htm`)
      .get('/userRpm/Logout.htm')
      .reply(200, 'coolio');

    return sut.getClientList(config).should.eventually
      .become([
        {
          host: 'Mockapetris',
          ipv6: '24-77-03-56-6E-94',
          ipv4: '192.168.1.101',
          lease: '01:55:39',
        },
        { host: 'Postel',
          ipv6: '50-E5-49-CE-43-33',
          ipv4: '192.168.1.100',
          lease: 'Permanent',
        },
      ]);
  });

  describe('config', function describeConfig() {
    it('throws if no username is provided',
      function throwsIfNoUsernameIsProvided() {
        delete config.username;
        return sut.getClientList(config)
          .should.be.rejectedWith(errors.ConfigurationError);
      });

    it('throws if no url is provided',
      function throwsIfNoUrlIsProvided() {
        delete config.url;
        return sut.getClientList(config)
          .should.be.rejectedWith(errors.ConfigurationError);
      });
  });

  it('throws if login to the router fails',
    function throwsIfLoginToTheRouterFails() {
      nock(config.url)
        .get('/userRpm/LoginRpm.htm?Save=Save')
        .replyWithFile(200, `${__dirname}/../data/login-failure.html`);

      return sut.getClientList(config)
        .should.be.rejectedWith(errors.LoginError);
    });

  it('throws if the router client list is unparsable',
    function throwsIfTheRouterClientListIsUnparsable() {
      nock(config.url)
        .get('/userRpm/LoginRpm.htm?Save=Save')
        .replyWithFile(200, `${__dirname}/../data/login-success.html`)
        .get('/WSGLKMGBVHXJPZTB/userRpm/AssignedIpAddrListRpm.htm')
        .replyWithFile(200, `${__dirname}/../data/MalformedStatusRpm.htm`)
        .get('/userRpm/Logout.htm')
        .reply(200, 'coolio');

      return sut.getClientList(config)
        .should.be.rejectedWith(/Could not parse dhcp client list/);
    });
});
