if (process.argv.length !== 3) {
  	console.log('Usage: node server.js [game configuration (json format)]')
  	process.exit(1);
}

var express = require('express');
var app = express();
var fs = require('fs');
var path = require('path');
var server = require('http').Server(app);
var io = require('socket.io')(server);
var gameModule = require('./gameModule');

app.use('/public', express.static(__dirname+'/public'));

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

io.on('connection', (socket) => {
	onlineCount++;

	io.emit('online', onlineCount);

	socket.on('disconnect', () => {
		onlineCount = (onlineCount < 0 ? 0 : onlineCount-1);
		io.emit('online', onlineCount);
	});
});

var update;

var gameConfig = fs.readFileSync(process.argv[2], 'ascii');
gameConfig = JSON.parse(gameConfig);
console.log(gameConfig);

var game = new gameModule.Game(update, gameConfig[0], gameConfig[1], gameConfig[2]);
