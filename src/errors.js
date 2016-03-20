'use strict';

class LoginError extends Error {
}

class ConfigurationError extends Error {
  constructor(message, field) {
    super(message);
    this.field = field;
  }
}

module.exports = {
  LoginError,
  ConfigurationError,
};
