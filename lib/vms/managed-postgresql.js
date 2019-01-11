const VM = require('./vm');
const exec = require('../exec');
const {Address4} = require('ip-address');
const LocalFirewall = require('../firewall/local');
const GceFirewall = require('../firewall/gce');

class ManagedPostgresql extends VM {

  constructor(config) {
    super(config);
    this.ports = [this.SERVICES.POSTGRESQL];
    this.subnets = null;

    if( config.gce ) this.firewall = new GceFirewall(config);
    else this.firewall = new LocalFirewall(config);
  }

  whitelist(address) {
    return this.firewall.whitelist(address);
  }

  async reloadVmInfo() {
    console.log('Reloading vm ip and whitelist subnets...');
    let info = await this._describe();

    await this.firewall.setSubnets(info);

    for( let address of info.ipAddresses ) {
      if( address.type === 'PRIMARY' ) {
        this.ipAddress = address.ipAddress;
        break;
      }
    }

    if( !this.ipAddress ) {
      throw new Error('Unable to locate vm ip');
    }

    console.log(`VM ip: ${this.ipAddress}`);
  }

  async startVm() {
    // try twice, often the first times out
    try {
      return await exec(this._getCmd());
    } catch(e) {
      let cmd = e.message.match(/`gcloud beta sql operations wait --project .* [a-z0-9-]+`/);
      if( cmd ) {
        cmd = cmd[0].replace(/`/g,'').split(' ').pop();
        cmd = `gcloud beta sql operations wait ${cmd}`;
        console.log('Long running start op, still waiting...');
        return await exec(cmd);
      } else {
        console.error(e);
      }
    }
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