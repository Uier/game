if ( process.argv.length !== 4 || process.argv[3] > 5 || process.argv[3] < 0 ) {
  	console.log('Usage: node [server] [game configuration (json format)] [the num of player(0~5)]');
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
	res.sendFile(path.join(__dirname, '/public', 'index.html'));
});

server.listen(8888, () => {
	console.log('server running at:' + server.address().address + ':' + server.address().port);
	console.log('Link Start');
});

var onlineCount = 0, Rnd = 0, finish = 0, cnt = 0;
var gameConfig = JSON.parse(fs.readFileSync(process.argv[2], 'ascii'));
var value = [], queue = [], stack = [], vis = [], userList = [], scoreList = [], record = ["", ""];
for ( var i=0; i<gameConfig[0].length; ++i ) {
	if ( gameConfig[0][i] == '?' )	record[0] += (random_value(2) == 1 ? 'i' : 'o');
	else	record[0] += gameConfig[0][i];
	record[1] += gameConfig[0][i];
}
for ( var i=0; i<gameConfig[0].length; ++i )	value[i] = random_value(gameConfig[1]);
for ( var i=0; i<5; ++i ) {queue[i] = [];stack[i] = [];vis[i] = false;userList[i] = "loading...";scoreList[i] = 0;}
console.log(record);

io.on('connection', (socket) => {
	onlineCount++;

	io.emit('online', onlineCount, record, process.argv[3]);

	socket.on('disconnect', () => {
		onlineCount = (onlineCount < 0 ? 0 : onlineCount-1);
		io.emit('online', onlineCount);
	});

	socket.on('setname', (name) => {
		if ( find(name) == -1 ) {
			userList[cnt++] = name;
			console.log('****new user login: ' + name);
		}
		console.log('now online: ' + userList);
		io.emit('setgame', Rnd, onlineCount, userList, scoreList, record);
	});

	socket.on('nextRnd', () => {
		if ( ++finish == process.argv[3] ) {
			finish = 0;
			console.log('============================');
			console.log('Round: ' + Rnd);
			// highlight bar moving
			io.emit('highlight', Rnd);
			if ( Rnd < 30 ) {
				io.emit('setIO', Rnd, value[Rnd], record);
				Rnd++;
				for ( var i=0; i<5; ++i )	vis[i] = false;
				io.emit('update', -1, [], [], userList);
			} else	io.emit('setEnd');
		}
	});

	socket.on('refresh', (id) => {
		io.emit('setIO', Rnd-1, value[Rnd-1], record);
		io.emit('update', id, queue[id], stack[id], userList);
		io.emit('score', id, scoreList, vis, true);
	});

	socket.on('click', (name, container) => {
		var id = find(name);
		if ( container == 'q' ) {
			console.log('activity: ' + name + ' click queue');
			if ( record[0][Rnd-1] == 'i' )	DoMove(id, 'i', 'q');
			else if ( queue[id].length > 0 )	DoMove(id, 'o', 'q');
		} else {
			console.log('activity: ' + name + ' click stack');
			if ( record[0][Rnd-1] == 'i' )	DoMove(id, 'i', 's');
			else if ( stack[id].length > 0 )	DoMove(id, 'o', 's');
		}
	});
});

function find(x) {
	for ( var i=0; i<5; ++i )	if ( userList[i] == x )	return i;
	return -1;
}

function random_value(max_value) {
	return 1 + Math.floor(Math.random() * max_value);
}

function DoMove(id, act, container) {
	if ( id >= 0 && !vis[id] ) {
		vis[id] = 1;
		console.dir(vis);
		if ( act == 'i' ) {
			if ( container == 'q' ) {
				console.log('activity: ' + userList[id] + ' push queue');
				queue[id].push(value[Rnd-1]);
			} else {
				console.log('activity: ' + userList[id] + ' push stack');
				stack[id].push(value[Rnd-1]);
			}
		} else {
			if ( container == 'q' ) {
				console.log('activity: ' + userList[id] + ' pop queue');
				queue[id].shift();
			} else {
				console.log('activity: ' + userList[id] + ' pop stack');
				stack[id].shift();
			}
		}
		console.dir(queue[id]);
		console.dir(stack[id]);
		scoreList[id] = 0;
		for ( var i=0; i<queue[id].length; ++i )	scoreList[id] += queue[id][i];
		for ( var i=0; i<stack[id].length; ++i )	scoreList[id] += stack[id][i];
		io.emit('update', id, queue[id], stack[id], userList);
		io.emit('score', id, scoreList, vis, false);
	}
}