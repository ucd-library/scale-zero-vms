const TCPQueue = require('./tcp-queue');
const net = require('net');
const EventEmitter = require('events');

class TCPConnection extends EventEmitter {

  constructor(socket, host, port, proxy) {
    super();

    this.tcpQueue = new TCPQueue();
    this.incomingSocket = socket;
    this.host = host;
    this.port = port;

    this.connected = false;

    socket.on('data', packet => {
      this.tcpQueue.addToQueue(packet);
      this.emit('packet');
    });
    socket.on('close', () => this.emit('close'));
  }

  /**
   * @method waitFor
   * @description wait for vm to come online, then attempt connection
   * 
   * @param {Promise} vmPromise 
   */
  async waitFor(vmPromise) {
    await vmPromise;
    this._connect();
  }

  _connect(attempt = 0) {
    if( attempt === 5 ) {
      this.destroy();
      return;
    }

    console.log('Outgoing tcp socket setup', this.host, this.port)
    this.outgoingSocket = net.connect({
      port: this.port,
      host: this.host,
    }, () => {
      console.log('Outgoing tcp socket conneted');
      this.connected = true;
      this.outgoingSocket.pipe(this.incomingSocket);
      this.tcpQueue.onConnect(this.outgoingSocket);
    });

    this.outgoingSocket.on('error', e => {
      console.error(e);
      if( !this.connected ) {
        attempt++;
        setTimeout(() => {
          this._connect(attempt);
        }, attempt*1000);
      }
    });

    this.outgoingSocket.on('close', () => {
      if( !this.connected ) return;
      this.destroy();
    });
  }

  destroy() {
    if( this.incomingSocket.destroyed ) return;
    this.incomingSocket.destroy();
  }

}

module.exports = TCPConnection;