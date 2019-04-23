var app = require('express')();
var http = require('http');

var server = http.createServer(app);

app.get('/', function(req, res) {
	console.log(req.url);
	res.sendFile('/home/uier/game/index.html');
})

server.listen(8888);