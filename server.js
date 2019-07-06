if ( process.argv.length !== 4 || process.argv[3] > 9 || process.argv[3] < 0 ) {
  	console.log('Usage: node [server] [game configuration (json format)] [the num of player(0~9)]');
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

var onlineCount = 0, Rnd = 0, finish = 0, cnt = 0, player = process.argv[3];
var gameConfig = JSON.parse(fs.readFileSync(process.argv[2], 'ascii'));
var value = [], queue = [], stack = [], vis = [], userList = [], scoreList = [], record = ["", ""];
for ( var i=0; i<gameConfig[0].length; ++i ) {
	if ( gameConfig[0][i] == '?' )	record[0] += (random_value(2) == 1 ? 'i' : 'o');
	else	record[0] += gameConfig[0][i];
	record[1] += gameConfig[0][i];
}
for ( var i=0; i<gameConfig[0].length; ++i )	value[i] = random_value(gameConfig[1]);
for ( var i=0; i<player; ++i ) {queue[i] = [];stack[i] = [];vis[i] = false;userList[i] = "";scoreList[i] = 0;}
console.log(record);

io.on('connection', (socket) => {
	onlineCount++;

	io.emit('online', onlineCount, player);

	socket.on('disconnect', () => {
		onlineCount -= 1;
		io.emit('online', (onlineCount < 0 ? 0 : onlineCount));
	});

	socket.on('setname', (name) => {
		if ( find(name) == -1 && cnt < player ) {
			userList[cnt++] = name;
			console.log('\n*************************\n', 'new user login: ' + name, '\n*************************\n');
		} else	console.log('\nuser login: ' + name + '\n' + '\nnow online: ' + userList + '\n');
		if ( cnt <= player ) {
			io.emit('setgame', Rnd, onlineCount, userList, scoreList, record);
			io.emit('setscoreboard', userList, scoreList);
		}
	});

	socket.on('nextRnd', () => {
		if ( ++finish == player ) {
			finish = 0;
			// highlight bar moving
			io.emit('highlight', Rnd);
			if ( Rnd < gameConfig[0].length ) {
				io.emit('setIO', Rnd, value[Rnd], record);
				Rnd++;
				for ( var i=0; i<player; ++i )	vis[i] = false;
				console.log('\n\n==================================================');
				console.log('Round: ' + Rnd);
			} else {
				Rnd = 31;
				io.emit('setEnd');
				console.log('\nEND\n');
			}
		}
	});

	socket.on('refresh', (id) => {
		io.emit('setIO', Rnd-1, value[Rnd-1], record);
		// io.emit('setscoreboard', userList);
		io.emit('update', id, queue[id], stack[id], userList, vis);
		io.emit('score', id, scoreList, vis, true, userList);
	});

	socket.on('click', (name, container) => {
		var id = find(name);
		if ( container == 'q' ) {
			console.log('activity: ' + name + ' click queue\n');
			if ( record[0][Rnd-1] == 'i' )	DoMove(id, 'i', 'q');
			else if ( queue[id].length > 0 )	DoMove(id, 'o', 'q');
		} else {
			console.log('activity: ' + name + ' click stack\n');
			if ( record[0][Rnd-1] == 'i' )	DoMove(id, 'i', 's');
			else if ( stack[id].length > 0 )	DoMove(id, 'o', 's');
		}
	});
});

function find(x) {
	for ( var i=0; i<player; ++i )	if ( userList[i] == x )	return i;
	return -1;
}

function random_value(max_value) {
	return 1 + Math.floor(Math.random() * max_value);
}

function DoMove(id, act, container) {
	if ( id >= 0 && !vis[id] ) {
		vis[id] = true;
		console.log('click states: ' + vis);
		if ( act == 'i' ) {
			if ( container == 'q' ) {
				console.log('activity: ' + userList[id] + ' push queue\n');
				queue[id].push(value[Rnd-1]);
			} else {
				console.log('activity: ' + userList[id] + ' push stack\n');
				stack[id].push(value[Rnd-1]);
			}
		} else {
			if ( container == 'q' ) {
				console.log('activity: ' + userList[id] + ' pop queue\n');
				queue[id].shift();
			} else {
				console.log('activity: ' + userList[id] + ' pop stack\n');
				stack[id].pop();
			}
		}
		console.dir(queue[id]);
		console.dir(stack[id]);
		scoreList[id] = 0;
		for ( var i=0; i<queue[id].length; ++i )	scoreList[id] += queue[id][i];
		for ( var i=0; i<stack[id].length; ++i )	scoreList[id] += stack[id][i];
		io.emit('update', id, queue[id], stack[id], userList, vis);
		console.log('sorting');
		score_sort();
		console.log('complete\n');
		io.emit('score', id, scoreList, vis, false, userList);
		// console.log('userList: ' + userList);
		// console.log('scoreList: ' + scoreList);
	}
}

function score_sort() {
	var arr = [];
	for ( var i=0; i<userList.length; ++i ) {
		arr[i] = new Array(5);
		arr[i][0] = userList[i];
		arr[i][1] = scoreList[i];
		arr[i][2] = vis[i];
		arr[i][3] = queue[i];
		arr[i][4] = stack[i];
	}
	arr.sort(function(x,y) {
		return y[1] - x[1];
	});
	for ( var i=0; i<userList.length; ++i ) {
		userList[i] = arr[i][0];
		scoreList[i] = arr[i][1];
		vis[i] = arr[i][2];
		queue[i] = arr[i][3];
		stack[i] = arr[i][4];
	}
}