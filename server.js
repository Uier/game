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

app.use('/public', express.static(__dirname+'/public'));

app.get('/', function(req, res) {
	// console.log(req.url);
	res.sendFile(path.join(__dirname, '/public', 'index.html'));
});

server.listen(8888, () => {
	// console.log('port: ' + server.address().port);
	console.log('Link Start');
});

let onlineCount = 0;

var gameConfig = fs.readFileSync(process.argv[2], 'ascii');
gameConfig = JSON.parse(gameConfig);
console.log(gameConfig);

var queue = [];
var stack = [];
for ( var i=0; i<5; ++i )	queue[i] = [];
for ( var i=0; i<5; ++i )	stack[i] = [];

io.on('connection', (socket) => {
	onlineCount++;

	io.emit('online', onlineCount);

	io.emit('setgame', gameConfig[0], gameConfig[1]);

	io.emit('startgame');

	socket.on('disconnect', () => {
		onlineCount = (onlineCount < 0 ? 0 : onlineCount-1);
		io.emit('online', onlineCount);
	});

	socket.on('check', (id, container) => {
		console.log('check id: ' + String(id));
		if ( container == 'q' ) {
			console.log(queue[id].length);
			if ( queue[id].length > 0 ) {
				io.emit('confirm', id, container);
			}
		} else {
			if ( stack[id].length > 0 ) {
				io.emit('confirm', id, container);
			}
		}
	});

	socket.on('push', (id, container, element) => {
		console.log('push id: ' + String(id));
		if ( container == 'q' ) {
			queue[id].push(element);
			console.dir(queue[id]);
			console.dir(stack[id]);
		} else {
			stack[id].push(element);
			console.dir(queue[id]);
			console.dir(stack[id]);
		}
	});

	socket.on('pop', (id, container) => {
		console.log('pop id: ' + String(id));
		if ( container == 'q' ) {
			queue[id].shift();
			console.dir(queue[id]);
			console.dir(stack[id]);
		} else {
			stack[id].pop();
			console.dir(queue[id]);
			console.dir(stack[id]);
		}
	});

});
