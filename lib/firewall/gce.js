const exec = require('../exec');

class GceFirewall {

  constructor(config) {
    this.config = config;
    this.ruleTag = 'proxy-'+config.type+'-'+config.name;
  }

  whitelist() {
    return true;
  }

  async setSubnets(vmInfo) {
    let subnets = [];
    (vmInfo.settings.ipConfiguration.authorizedNetworks || []).forEach(network => {
      subnets.push(network.value);
    });

    (this.config.additionalWhitelist || []).forEach(address => {
      subnets.push(address);
    });

    console.log(`VM subnet whitelist: `, subnets.join(', '));
    await this.update(subnets);
  }

  async update(cidr, port=5432) {
    if( typeof cidr === 'string' ) {
      cidr = [cidr];
    }

    await this.removeCurrent();

    console.log('Setting firewall rules...');
    await exec(`gcloud compute firewall-rules create ${this.ruleTag} --target-tags=${this.ruleTag} --direction=INGRESS --source-ranges=${cidr.join(',')} --allow=tcp:${port}`);
    
    console.log('Tagging vm');
    await exec(`gcloud compute instances add-tags ${this.config.gce.name} --zone=${this.config.gce.zone} --tags=${this.ruleTag}`);

    await this.loadRules();
  } 

  async removeCurrent() {
    await this.loadRules();
    if( !this.rules[this.ruleTag] ) return;

    console.log('Cleaning up old firewall rules...');
    await exec(`gcloud compute firewall-rules delete ${this.ruleTag} -q`);
    delete this.rules[this.ruleTag];
  }

  async loadRules() {
    this.rules = {};
    let rules = await this.jsonExec('gcloud compute firewall-rules list');
    rules.forEach(rule => {
      this.rules[rule.name] = rule;
    });
  }

  async jsonExec(cmd) {
    let {stdout} = await exec(`${cmd} --format json`);
    return JSON.parse(stdout);
  }
}

module.exports = GceFirewall;