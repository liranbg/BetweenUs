var express = require('express');
var app = express();

app.get('/', function (req, res) {
  res.send('Server initialized');
});

var server = app.listen(3000, function () {
  var host = "localhost";
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
