'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const proxyquire = require('proxyquire');

chai.should();
chai.use(chaiAsPromised);

const errors = require('../src/errors.js');
const ScraperService = require('../src/scraperService.js');

describe('scraperService', function archerc7() {
  let config;

  beforeEach(function beforeEach() {
    config = {
      plugins: [],
    };
  });

  it('can retrieve addresses from plugins', function () {
    true.should.be.false;
  });

  it('throws if no config is provided',
    function throwsIfConfigHasNoPluginsSection() {
      config = null;
      (() => new ScraperService(config))
        .should.throw(/No config provided./);
    });

  it('throws if config has no plugins section',
    function throwsIfConfigHasNoPluginsSection() {
      delete config.plugins;
      (() => new ScraperService(config))
        .should.throw(/Configuration contained no plugins section./);
    });
});
