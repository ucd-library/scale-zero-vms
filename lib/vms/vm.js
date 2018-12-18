
class Vm {

  constructor(options) {
    this.SERVICES = {
      SSH : 22,
      HTTP : 80,
      HTTPS : 443,
      POSTGRESQL : 5432
    }

    this.name;
    this.serviceAccount;
    this.projectId;
  }

}

module.exports = Vm;