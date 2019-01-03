const express = require('express');
const path = require('path');
const app = express();
const authorization = require('./lib/authorization');

// client login
// get users/roles: gcloud projects get-iam-policy digital-ucdavis-edu --format json
// client login: https://developers.google.com/identity/sign-in/web/sign-in
// server verify token: https://developers.google.com/identity/sign-in/web/backend-auth

// investigate: https://cloud.google.com/iap/
// needs load balancer... cost $$$

module.exports = proxy => {
  app.get('/info', (req, res) => {
    res.json({
      state : proxy.status.state,
      lastPacket : new Date(proxy.status.lastPacket).toISOString(),
      shutdownTime : new Date(proxy.status.shutdownTime).toISOString()
    });
  });

  app.use(express.static(path.join(__dirname, 'app')));

  app.listen(7777, () => {
    console.log('Status server up and running on port 7777');
  });
}

