if (process.argv.length !== 4) {
  	console.log('Usage: node [server] [game configuration (json format)] [the num of player]');
  	console.log('default: node server.js gamedata[0].json');
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
	console.log('server running at:' + server.address().address + ':' + server.address().port);
	console.log('Link Start');
});

function random_value(max_value) {
	return 1 + Math.floor(Math.random() * max_value);
}

var onlineCount = 0, Rnd = 0, finish = 0;
var gameConfig = JSON.parse(fs.readFileSync(process.argv[2], 'ascii'));
console.log(gameConfig);
var value = [], queue = [], stack = [], vis = [], score_list = [], record = "";
for ( var i=0; i<gameConfig[0].length; ++i ) {
	if ( gameConfig[0][i] == '?' )
		record += (random_value(2) == 1 ? 'i' : 'o');
	else
		record += gameConfig[0][i];
}
console.log(record);
for ( var i=0; i<gameConfig[0].length; ++i )	value[i] = random_value(gameConfig[1]);
for ( var i=0; i<5; ++i )	queue[i] = [];
for ( var i=0; i<5; ++i )	stack[i] = [];
for ( var i=0; i<5; ++i )	vis[i] = false;
for ( var i=0; i<5; ++i )	score_list[i] = 0;

io.on('connection', (socket) => {
	onlineCount++;

	io.emit('online', onlineCount, record, gameConfig[0], vis, process.argv[3]);

	socket.on('disconnect', () => {
		onlineCount = (onlineCount < 0 ? 0 : onlineCount-1);
		io.emit('online', onlineCount);
	});

	io.emit('setgame', Rnd, onlineCount);

	socket.on('nextRnd', () => {
		finish++;
		if ( finish == process.argv[3] ) {
			finish = 0;
			console.log('Round: ' + Rnd);
			// highlight bar moving
			io.emit('highlight', Rnd);
			if ( Rnd < 30 ) {
				io.emit('setIO', Rnd, value[Rnd], gameConfig[0][Rnd]);
				Rnd++;
				for ( var i=0; i<5; ++i )	vis[i] = false;
				io.emit('update', -1, [], [], vis);
			} else	io.emit('setEND');
		}
	});

	socket.on('refresh', (id) => {
		io.emit('setIO', Rnd-1, value[Rnd-1], false);
		io.emit('update', id, queue[id], stack[id], vis);
		io.emit('score', score_list, vis, true);
	});

	socket.on('check', (id, container) => {
		console.log('activity: ' + id + ' checking ' + container);
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

	socket.on('push', (id, container) => {
		console.log('activity: ' + id + ' click ' + container);
		if ( !vis[id] ) {
			vis[id] = 1;
			if ( container == 'q' ) {
				console.log('activity: ' + id + ' push queue');
				queue[id].push(value[Rnd-1]);
				console.dir(queue[id]);
				console.dir(stack[id]);
			} else {
				console.log('activity: ' + id + ' push stack');
				stack[id].push(value[Rnd-1]);
				console.dir(queue[id]);
				console.dir(stack[id]);
			}
			var score = 0;
			for ( var i=0; i<queue[id].length; ++i )	score += queue[id][i];
			for ( var i=0; i<stack[id].length; ++i )	score += stack[id][i];
			score_list[id] = score;
			io.emit('update', id, queue[id], stack[id], vis);
			io.emit('score', score_list, vis, false);
		}
	});

	socket.on('pop', (id, container) => {
		console.log('activity: ' + id + ' click ' + container);
		if ( !vis[id] ) {
			vis[id] = 1;
			if ( container == 'q' ) {
				console.log('activity: ' + id + ' pop queue');
				queue[id].shift();
				console.dir(queue[id]);
				console.dir(stack[id]);
			} else {
				console.log('activity: ' + id + ' pop stack');
				stack[id].pop();
				console.dir(queue[id]);
				console.dir(stack[id]);
			}
			var score = 0;
			for ( var i=0; i<queue[id].length; ++i )	score += queue[id][i];
			for ( var i=0; i<stack[id].length; ++i )	score += stack[id][i];
			score_list[id] = score;
			io.emit('update', id, queue[id], stack[id], vis);
			io.emit('score', score_list, vis, false);
		}
	});
});
