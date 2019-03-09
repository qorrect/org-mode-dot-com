/* eslint-disable no-empty */
const Client = require('node-statsd-client').Client;
const statsConfig = require('config').get('statsd');
let clientFacade = null;
const logger = require('../utils/logUtil');

class ClientFacade {
  constructor() {
    this.appLabel = 'sfg_form_app';
    /**
     * @type {Client}
     */
    this.timers = {};
    this.client = new Client(statsConfig.get('host'), statsConfig.get('port'));
    if (statsConfig.get('fakeRequests')) {
      logger.warn('StatsD turned off');
    }
  }


  start_timer(label) {
    this.timers[label] = Date.now();
  }

  stop_timer(label) {
    const start_time = this.timers[label];
    delete this.timers[label];
    if (statsConfig.get('fakeRequests')) {

    }
    else this.client.timing(this.appLabel + '.' + label, (Date.now() - start_time) / 1000);
  }

  count(label, i) {
    if (statsConfig.get('fakeRequests')) {

    }
    else {
      this.client.count(this.appLabel + '.' + label, i);
    }
  }

  increment(label) {
    if (statsConfig.get('fakeRequests')) {

    }
    else {
      this.client.increment(this.appLabel + '.' + label);
    }
  }

  gauge(label, val) {
    if (statsConfig.get('fakeRequests')) {

    }
    else {
      this.client.gauge(this.appLabel + '.' + label, val);
    }
  }

  decrement(label) {
    if (statsConfig.get('fakeRequests')) {

    }
    else {
      this.client.decrement(this.appLabel + '.' + label);
    }
  }
}


if (!clientFacade) {
  clientFacade = new ClientFacade();
}
module.exports = clientFacade;

