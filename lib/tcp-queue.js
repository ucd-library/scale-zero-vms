class TCPQueue {

  constructor() {
    this.connected = false;
    this.queue = [];
  }

  async onConnect(socket) {
    this.connected = true;
    this.socket = socket;
    await this.drain();
  }

  send(packet) {
    return new Promise((resolve, reject) => {
      this.socket.write(packet, () => resolve());
    });
  }

  async drain() {
    while( this.queue.length ) {
      await this.send(this.queue.shift());
    }
  }

  addToQueue(packet) {
    if( this.connected ) this.send(packet);
    else this.queue.push(packet);
  }

}

module.exports = TCPQueue;