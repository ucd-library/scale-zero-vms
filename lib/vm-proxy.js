const TCPProxy = require('./tcp-proxy');

// 2 hours
const SHUTDOWN_TIME = 1000 * 60 * 60 * 2;

class VmProxy {

  constructor(options)  {
    this.remoteHost = options.remoteHost;
    this.portMap = options.portMap;
    
    if( options.turnOnVm ) this.turnOnVm = options.turnOnVm;
    if( options.turnOffVm ) this.turnOffVm = options.turnOffVm;
    if( options.whitelist ) this.whitelist = options.whitelist;
  
    this.status = {
      state : 'offline',
      lastPacket : 0,
      shutdownTime : 0,
      // resolves to true when online
      promise : null
    }
    this.proxies = [];
  }

  listen() {
    for( let localPort in this.portMap ) {
      let remotePort = this.portMap[localPort];
      console.log(`Setting up proxy 0.0.0.0:${localPort} -> ${this.remoteHost}:${remotePort}`)
      this.proxies.push(new TCPProxy(this, {
        localPort, remotePort
      }));
    }
  }

  resetShutdownTimer() {
    this.status.lastPacket = Date.now();
    this.status.shutdownTime = Date.now()+SHUTDOWN_TIME;
    if( this.shutdownTimer !== -1 ) clearTimeout(this.shutdownTimer);

    this.shutdownTimer = setTimeout(() => {
      this._turnOffVm();
    }, SHUTDOWN_TIME);
  }

  async _turnOnVm() {
    this.resetShutdownTimer();

    if( this.status.state === 'online' ) {
      return;
    }

    if( this.status.state === 'booting' ) {
      return this.status.promise;
    }

    // if( this.status.state === 'shuttingdown' ) {
    //   await this.status.promise;
    // }

    this.status.state = 'booting';

    this.status.promise = this.turnOnVm();  
    await this.status.promise;
    this.status.state = 'online';
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