const TCPProxy = require('./tcp-proxy');

// 2 hours
const SHUTDOWN_TIME = 1000 * 60 * 60 * 2;

class VmProxy {

  constructor(options)  {
    this.remoteHost = options.remoteHost;
    this.portMap = options.portMap;
    
    if( options.turnOnVm ) this.turnOnVm = options.turnOnVm;
    if( options.turnOffVm ) this.turnOffVm = options.turnOffVm;
  
    this.status = {
      state : 'offline',
      // resolves to true when online
      promise : null
    }
    this.proxies = [];
  }

  listen() {
    for( let localPort in this.portMap ) {
      let remotePort = this.portMap[localPort];
      this.proxies.push(new TCPProxy(this, {
        localPort, remotePort
      }));
    }
  }

  resetShutdownTimer() {
    if( this.shutdownTimer !== -1 ) clearTimeout(this.shutdownTimer);

    this.shutdownTimerSetAt = Date.now();
    this.shutdownTimer = setTimeout(() => {
      this._turnOffVm();
    }, SHUTDOWN_TIME);
  }

  _turnOnVm() {
    this.resetShutdownTimer();

    if( this.status.state === 'online' ) {
      return Promise.resolve();
    }

    if( this.status.state === 'booting' ) {
      return this.status.promise;
    }

    if( this.status.state === 'shuttingdown' ) {
      await this.status.promise;
    }

    this.status.state = 'booting';
    this.status.promise = new Promise(async (resolve, reject) => {
      try {
        this.turnOnVm();  
        this.status.state = 'online';
        resolve();
      } catch(e) {
        reject(e);
      }
    });

    return this.status.promise;
  }

  _turnOffVm() {
    this.status.state = 'shuttingdown';
    this.status.promise = this.turnOffVm();
  }

  turnOnVm() {
    // implement me
  }

  // should return a promise
  turnOffVm() {
    // implement me
  }

}

module.exports = VmProxy;