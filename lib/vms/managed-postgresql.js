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
      await this.reloadVmInfo();
    }

    for(let subnet of this.subnets ) {
      if( address.isInSubnet(subnet) ) {
        console.log(`Allowing connection from ${address.address}, matched: ${subnet.address}`);
        return true;
      }
    }

    console.log(`Denying connection from ${address.address}`);
    return false;
  }

  async reloadVmInfo() {
    console.log('Reloading vm ip and whitelist subnets...');
    let info = await this._describe();
    let tmp = [];
    this.subnets = (info.settings.ipConfiguration.authorizedNetworks || []).map(network => {
      tmp.push(network.value);
      return new Address4(network.value);
    });

    (this.options.additionalWhitelist || []).forEach(address => {
      tmp.push(address);
      this.subnets.push(new Address4(address));
    });

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
    console.log(`VM subnet whitelist: `, tmp.join(', '));
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