const express = require('express');
const app = express();

module.exports = proxy => {
  
  app.get('/info', (req, res) => {
    res.json({
      state : proxy.status.state,
      lastPacket : new Date(proxy.status.lastPacket).toISOString(),
      shutdownTime : new Date(proxy.status.shutdownTime).toISOString()
    });
  });

  app.listen(7777, () => {
    console.log('Status server up and running on port 7777');
  });
}

