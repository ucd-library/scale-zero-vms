
class Vm {

  constructor(options) {
    this.options = options;
    this.name = options.name;
    this.zone = options.zone || 'us-central1-a';

    this.SERVICES = {
      SSH : 22,
      HTTP : 80,
      HTTPS : 443,
      POSTGRESQL : 5432
    }

    this.serviceAccount;
    this.projectId;
  }

}

module.exports = Vm;