const {exec} = require('child_process');
module.exports = (cmd) => {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if( error ) reject(error);
      else resolve({stderr, stdout});
    });
  });
}