const VMProxy = require('./lib/vm-proxy');

const proxy = new VMProxy({ 
  portMap: {
    9999 : 5432
  },
  remoteHost : '0.0.0.0',
  turnOnVm : () => {
    console.log('Enabling vm...');
    
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        console.log('Vm online');
        resolve();
      }, 2000);
    });
  }
});
proxy.listen();

