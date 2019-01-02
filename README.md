# scale-zero-vms
TCP Proxy to scale VM's and Managed DBs to zero when not in use (ie auto turn on/off).

# Setup

Either place the config file in /etc/scale-zero-proxy/config.json are pass as argument to command line.

## Postgres Config


```json
{
  // Required.
  "type" : "postgres",
  // Required. instance name
  "name" : "datafest",
  // Optional. override default shutdown time of 2 hours
  // time in ms after last pack
  "shutdownTime" : 600000,
  // Optional.  add additional whitelist subnets.  Should only be used for local development
  "additionalWhitelist" : ["127.0.0.1/32"]
}
```
