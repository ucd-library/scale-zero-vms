const VM = require('./vm');
const exec = require('../exec');

class ManagedPostgresql extends VM {

  constructor(options) {
    super();

    this.name = options.name;
    this.ports = [this.SERVICES.POSTGRESQL];
  }

  startVm() {
    return exec(this._getCmd());
  }

  stopVm() {
    return exec(this._getCmd(true));
  }

  _getCmd(stop=false) {
    let activation = stop ? 'NEVER' : 'ALWAYS';
    return `gcloud sql instances patch ${this.name} --activation-policy ${activation}`;
  }

}

module.exports = ManagedPostgresql;