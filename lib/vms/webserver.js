const VM = require('./vm');
const exec = require('../exec');

class WebServer extends VM {

  constructor(options) {
    super(options);
    this.ports = [
      this.SERVICES.SSH,
      this.SERVICES.HTTPS,
      this.SERVICES.HTTP
    ];
  }

  startVm() {
    return exec(this._getCmd());
  }

  stopVm() {
    return exec(this._getCmd(true));
  }

  whitelist(address) {
    return true;
  }

  _getCmd(stop=false) {
    let activation = stop ? 'stop' : 'start';
    return `gcloud compute instances ${activation} ${this.name} --zone ${this.zone}`;
  }

}

module.exports = WebServer;