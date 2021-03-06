const VMProxy = require('./lib/vm-proxy');
const Pg = require('./lib/vms/managed-postgresql');
const Web = require('./lib/vms/webserver');
const statusServer = require('./lib/status-server');
const path = require('path');

let config = '/etc/scale-zero-proxy/config.json';
if( process.argv.length > 2 ) {
  config = process.argv[2];
  if( !config.match(/^\//) ) {
    config = path.resolve(__dirname, config);
  }
}
console.log(`Using config: ${config}`);
config = require(config);

let impl;
if( config.type === 'postgres' ) {
  impl = new Pg(config);
} else if( config.type === 'webserver' ) {
  impl = new Web(config);
} else {
  throw new Error('Unknown vm type: '+config.type);
}

// all ports will map 1-to-1 on default address.
let portMap = {};
for( let port of impl.ports ) {
  portMap[port] = port;
}

const proxy = new VMProxy({ 
  portMap,
  impl,
  shutdownTime : config.shutdownTime
});
proxy.listen();

statusServer(proxy, config);