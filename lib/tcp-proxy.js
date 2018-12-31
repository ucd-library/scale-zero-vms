const net = require('net');
const TCPConnection = require('./tcp-connection');

class TCPProxy {

  constructor(vmProxy, options = {}) {
    this.vmProxy = vmProxy;
    this.host = options.localHost || '0.0.0.0';
    this.port = options.localPort;
    this.remotePort = options.remotePort;

    this.connections = [];

    this.proxyServer = net.createServer(client => this._onClientConnection(client));
    this.proxyServer.listen(this.port, this.host);
    this.proxyServer.once('error', e => {
      console.error('Proxy error', e);
      // TODO: badness
    });
    this.proxyServer.once('listening', () => {
      // TODO: badness
    });
  }

  async _onClientConnection(client) {
    let whitelisted = await this.vmProxy.whitelist(client.address().address);
    if( !whitelisted ) {
      return console.log('Ignoring packet from: '+client.address().address);
    }    

    let connection = new TCPConnection(client, this.vmProxy.remoteHost, this.remotePort, this.vmProxy);
    this.connections.push(connection);
    
    this.vmProxy
      ._turnOnVm()
      .catch(e => {
        console.error('Failed to turn on vm', e);
        process.exit(-1);
      });

    connection.on('packet', () => this.vmProxy.resetShutdownTimer());
    connection.on('close', () => {
      let index = this.connections.indexOf(connection);
      this.connections.splice(index, 1);
    });

    connection.waitFor(this.vmProxy.status.promise);
  }
}

module.exports = TCPProxy;