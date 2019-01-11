const {Address4} = require('ip-address');

class LocalFirewall {

  constructor(config) {
    this.config = config;
    this.subnets = null;
  }

  setSubnets(vmInfo) {
    this.subnets = (vmInfo.settings.ipConfiguration.authorizedNetworks || []).map(network => {
      tmp.push(network.value);
      return new Address4(network.value);
    });

    (this.config.additionalWhitelist || []).forEach(address => {
      tmp.push(address);
      this.subnets.push(new Address4(address));
    });

    console.log(`VM subnet whitelist: `, tmp.join(', '));
  }

  async whitelist(address) {
    address = new Address4(address);

    for(let subnet of this.subnets ) {
      if( address.isInSubnet(subnet) ) {
        console.log(`Allowing connection from ${address.address}, matched: ${subnet.address}`);
        return true;
      }
    }

    console.log(`Denying connection from ${address.address}`);
    return false;
  }

}

module.exports = LocalFirewall;