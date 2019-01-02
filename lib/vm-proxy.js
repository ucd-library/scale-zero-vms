const TCPProxy = require('./tcp-proxy');

// default: 2 hours
const SHUTDOWN_TIME = 1000 * 60 * 60 * 2;

class VmProxy {

  constructor(options)  {
    this.shutdownTime = options.shutdownTime;
    this.impl = options.impl;
    this.portMap = options.portMap;
  
    this.status = {
      _state : 'offline',
      get state() {
        return this._state;
      },
      set state(val) {
        console.log('VM state change: '+val);
        this._state = val;
      },
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
      this.proxies.push(new TCPProxy(this, {
        localPort, remotePort
      }));
    }
  }

  resetShutdownTimer() {
    this.status.lastPacket = Date.now();
    this.status.shutdownTime = Date.now()+this.getShutdownTime();
    if( this.shutdownTimer !== -1 ) clearTimeout(this.shutdownTimer);

    this.shutdownTimer = setTimeout(() => {
      this._turnOffVm();
    }, this.getShutdownTime());
  }

  getShutdownTime() {
    if( this.shutdownTime !== undefined ) {
      return this.shutdownTime;
    }
    return SHUTDOWN_TIME;
  }

  async _turnOnVm() {
    this.resetShutdownTimer();

    if( this.status.state === 'online' ||
        this.status.state === 'booting' ) {
      return;
    }

    if( this.status.promise ) {
      return this.status.promise;
    }

    this.status.state = 'booting';
    this.status.promise = this.impl.startVm(); 

    await this.status.promise;
    this.status.promise = null;

    this.status.state = 'online';
  }

  async _turnOffVm() {
    if( this.status.state === 'offline' || 
        this.status.state === 'shuttingdown' ) {
      return;
    }

    if( this.status.promise ) {
      return this.status.promise;
    }

    this.status.state = 'shuttingdown';
    this.status.promise = this.impl.stopVm();

    await this.status.promise;

    this.status.promise = null;
    this.status.state = 'offline';
  }

}

module.exports = VmProxy;