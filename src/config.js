'use strict';

require('dotenv').config();

module.exports = {
  plugins: [{
    name: 'archerc7',
    config: {
      url: process.env.DNS_SCRAPE_HOST,
      username: process.env.DNS_SCRAPE_USERNAME,
      password: process.env.DNS_SCRAPE_PASSWORD,
    },
  }],
};
