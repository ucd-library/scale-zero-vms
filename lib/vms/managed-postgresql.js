const VM = require('./vm');
const exec = require('../exec');
const {Address4} = require('ip-address');

class ManagedPostgresql extends VM {

  constructor(options) {
    super(options);
    this.ports = [this.SERVICES.POSTGRESQL];
    this.subnets = null;
  }

  async whitelist(address) {
    address = new Address4(address);

    if( !this.subnets ) {
      await this.reloadSubnets();
    }

    for(let subnet of this.subnets ) {
      if( address.isInSubnet(subnet) ) return true;
    }

    return false;
  }

  async reloadSubnets() {
    let info = await this._describe();
    this.subnets = (info.settings.ipConfiguration.authorizedNetworks || []).map(network => {
      return new Address4(network.value);
    });

    (this.options.additionalWhitelist || []).forEach(address => {
      this.subnets.push(new Address4(address));
    });
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

  async _describe() {
    let {stdout} = await exec(`gcloud sql instances describe ${this.name} --format json`);
    return JSON.parse(stdout);
  }

}

module.exports = ManagedPostgresql;