var express = require('express');
var app = express();
var fs = require('fs');
var http = require('http');
var path = require('path');
var server = http.Server(app);
var io = require('socket.io')(server);

app.use("/public", express.static(__dirname+'/public'));

app.get('/', function(req, res) {
	console.log(req.url);
	res.sendFile(path.join(__dirname, '/public', 'index.html'));
});

server.listen(8888, () => {
	console.log(server.address().address);
	console.log(server.address().port);
	console.log('Link Start');
});

let onlineCount = 0;

io.on('connect', (socket) => {
	onlineCount++;

	io.emit('online', onlineCount);

	socket.on('disconnect', () => {
		onlineCount = (onlineCount < 0 ? 0 : onlineCount-1);
		io.emit('online', onlineCount);
	});
});

if (process.argv.length !== 3) {
  	console.log('Usage: node server.js [game configuration (json format)]')
  	process.exit(1);
}

var gameConfig = fs.readFileSync(process.argv[2], 'ascii');
gameConfig = JSON.parse(gameConfig);
console.log(gameConfig);
