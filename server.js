var express = require('express');
var app = express();
var fs = require('fs');
var http = require('http');
var server = http.Server(app);
var io = require('socket.io')(server);

app.get('/', function(req, res) {
	console.log(req.url);
	res.sendFile(path.join(__dirname, './public', 'index.html'));
});

server.listen(8888, () => {
	console.log(server.address().address);
	console.log(server.address().port);
	console.log('Link Start');
});

let onlineCount = 0;

io.on('connection', (socket) => {
	onlineCount++;

	io.emit('online', onlineCount);

	socket.on('disconnect', () => {
		onlineCount = (onlineCount < 0 ? 0 : onlineCount-1);
		io.emit("online", onlineCount);
	});

	// socket.on('send', (msg) => {
	// 	io.emit('msg', msg);
	// });
});

if (process.argv.length !== 3) {
  	console.log('Usage: node server.js [game configuration (json format)]')
  	process.exit(1);
}

var gameConfig = fs.readFileSync(process.argv[2], 'ascii');
gameConfig = JSON.parse(gameConfig);
console.log(gameConfig);
