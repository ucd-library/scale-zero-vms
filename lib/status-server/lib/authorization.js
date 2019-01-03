const exec = require('../../exec');
const {OAuth2Client} = require('google-auth-library');

class Authorization {

  constructor() {
    this.middleware = this.middleware.bind(this);
    this.reload();
  }

  setConfig(config) {
    this.config = config;
    this.client = new OAuth2Client(config.clientId);
  }

  /**
   * @method verifyToken
   * @description verify an id token
   * 
   * @param {String} token
   * 
   * @returns {Promise} resolves to user id string 
   */
  async verifyToken(token) {
    const ticket = await this.client.verifyIdToken({
      idToken: token,
      audience: this.config.clientId
    });
    const payload = ticket.getPayload();
    return payload['sub'];
  }

  async reload() {
    let users = {};
    
    var {stdout} = await exec('gcloud config list --format json');
    let projectId = JSON.parse(stdout).core.project;

    var {stdout} = await exec(`gcloud projects get-iam-policy ${projectId} --format json`);

    let roles = JSON.parse(stdout).bindings;
    for( let role of roles ) {
      for( let member of role.members ) {
        if( !member.match(/^user:/) ) continue;
        member = member.replace(/^user:/, '');

        if( !users[member] ) users[member] = [];
        users[member].push(role.role.replace(/^roles\//, ''));
      }
    }

    this.users = users;
  }

  hasAccess(user) {
    return (this.users[user] !== undefined) ? true : false;
  }

  async middleware(req, res, next) {
    let token = (req.get('authorization') || '').replace(/^Bearer /, '');
    if( !token ) return res.status(401).send('No authorization provided');

    let userId;
    try {
      userId = await this.verifyToken(token);
    } catch(e) {
      return res.status(403).send();
    }

    if( !this.hasAccess(userId) ) {
      return res.status(403).send();
    }

    next();
  }

}

module.exports = new Authorization();