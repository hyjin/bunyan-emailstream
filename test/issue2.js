var bunyan = require('bunyan');
var EmailStream = require('../').EmailStream;

var emailstream = new EmailStream(
  { from: 'address', to: 'address' }
  // transportOptions are omitted
);


