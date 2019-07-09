if ( process.argv.length !== 4 || process.argv[3] > 9 || process.argv[3] < 0 ) {
  	console.log('Usage: node [server] [game configuration (json format)] [the num of PLAYER(0~9)]');
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

// setup
const PLAYER = Number(process.argv[3]);
const GAME_CONFIG = JSON.parse(fs.readFileSync(process.argv[2], 'ascii'));
var onlineCnt = 0, Rnd = 0, cnt = 0;
var value = [];
var playerList = [];
var record = ["", ""];

// instruction list
var insList = GAME_CONFIG[0];
for ( let i=0; i<insList.length; ++i ) {
	if ( insList[i] == '?' )
		record[0] += (randomValue(2) == 1 ? 'i' : 'o');
	else
		record[0] += insList[i];
	
	record[1] += insList[i];
}
console.log(record);

// generate push value
for ( let i=0; i<insList.length; ++i )
	value[i] = randomValue(GAME_CONFIG[1]);

var randToken = function() {
	return Math.random().toString(36).substr(2);
};

// setup players
for ( let i=0; i<PLAYER; ++i ) {
	playerList.push({
		queue: [],
		stack: [],
		vis: false,
		name: '',
		score: 0,
		token: randToken()
	});
}

console.log('**************************************************');
for ( let t of token() ) console.log(`setup - userToken: ${t}`);
console.log('**************************************************');

function getAttr(attr) {
	var ret = [];
	for(let p of playerList) {
		ret.push(attr(p));
	}
	return ret;
}

function userList() {
	return getAttr(p => p.name);
}

function scoreList() {
	return getAttr(p => p.score);
}

function vis() {
	return getAttr(p => p.vis);
}

function token() {
	return getAttr(p => p.token);
}

io.on('connection', (socket) => {
	onlineCnt++;

	io.emit('online', onlineCnt, PLAYER);

	socket.on('disconnect', () => {
		onlineCnt--;
		console.log(`disconnect, now online count: ${onlineCnt}`);
		io.emit('online', (onlineCnt < 0 ? 0 : onlineCnt));
	});

	socket.on('setName', (name) => {
		// name = decodeURIComponent(name);
		if ( findIdByName(name) == -1 && cnt < PLAYER ) {
			// should work and wont confict.
			playerList[cnt].vis = true;
			playerList[cnt].name = name;
			// pass token to client
			io.to(socket.id).emit('sendToken', playerList[cnt].token);
			console.log('\n*************************\n' + 'new user login: ' + name + '\n*************************\n');
			cnt++;
		} else {
			console.log('\nuser relogin: ' + name + '\n' + 'now online: ' + userList() + '\n');
		}
		// console.log('cnt, PLAYER: ' + cnt + ', ' + PLAYER);
		if ( cnt <= PLAYER ) {
			io.to(socket.id).emit('setGame', Rnd, onlineCnt, userList(), record);
			io.to(socket.id).emit('setScoreboard', userList());
			io.to(socket.id).emit('sendName', name);
		}
	});

	socket.on('getName', (token) => {
		for ( let i=0; i<PLAYER; ++i )
			if ( token == playerList[i].token )
				io.to(socket.id).emit('sendName', playerList[i].name);
		io.to(socket.id).emit('setGame', Rnd, onlineCnt, userList(), record);
	});

	socket.on('nextRnd', () => {
		let finCnt = 0;
		for ( let v of vis() )
			if ( v ) finCnt++;

		if ( finCnt == PLAYER ) {
			// highlight bar moving
			io.emit('highlight', Rnd);
			if ( Rnd < insList.length ) {
				io.emit('setIO', Rnd, value[Rnd], record);
				Rnd++;
				for ( let i=0; i<PLAYER; ++i )	playerList[i].vis = false;
				console.log('\n\n==================================================');
				console.log('Round: ' + Rnd);
			} else {
				Rnd = 31;
				io.emit('setEnd');
				console.log('\nEND\n');
			}
		}
	});

	socket.on('refresh', (token) => {
		let id = findIdByToken(token);
		// can not find user by token
		if(id == -1) {
			console.log(`invalid token: ${token}`);
			return;
		}
		let client = io.to(socket.id);
		let ul = userList(), vs = vis();
		console.log('refreshing function call');
		client.emit('setIO', Rnd-1, value[Rnd-1], record);
		client.emit('setScoreboard', ul);
		client.emit('update', playerList[id].queue, playerList[id].stack, vs);
		client.emit('score', scoreList(), vs, ul, true);
	});

	socket.on('click', (token, container) => {
		let id = findIdByToken(token);
		console.log('token: ' + token);
		console.log('click id: ' + id);
		if ( 0 <= id && id < PLAYER ) {
			if ( container == 'q' ) {
				console.log(`activity: ${playerList[id].name} click queue\n`);
				if ( record[0][Rnd-1] == 'i' )	DoMove(socket.id, id, 'i', 'q');
				else if ( playerList[id].queue.length > 0 )	DoMove(socket.id, id, 'o', 'q');
			} else {
				console.log(`activity: ${playerList[id].name} click stack\n`);
				if ( record[0][Rnd-1] == 'i' )	DoMove(socket.id, id, 'i', 's');
				else if ( playerList[id].stack.length > 0 )	DoMove(socket.id, id, 'o', 's');
			}
		}
	});
});

function findIdByName(n) {
	for( let i=0; i<PLAYER; ++i )
		if ( playerList[i].name == n ) return i;
	return -1;
}

function findIdByToken(x) {
	for ( let i=0; i<PLAYER; ++i )
		if ( playerList[i].token == x )	return i;
	return -1;
}

function randomValue(max_value) {
	return 1 + Math.floor(Math.random() * max_value);
}

function DoMove(socketId, id, act, container) {
	if ( 0 <= id && id < PLAYER && !playerList[id].vis ) {
		playerList[id].vis = true;
		console.log('click states: ' + playerList[id].vis);
		if ( act == 'i' ) {
			if ( container == 'q' ) {
				console.log('activity: ' + playerList[id].name + ' push queue\n');
				playerList[id].queue.push(value[Rnd-1]);
			} else {
				console.log('activity: ' + playerList[id].name + ' push stack\n');
				playerList[id].stack.push(value[Rnd-1]);
			}
		} else {
			if ( container == 'q' ) {
				console.log('activity: ' + playerList[id].name + ' pop queue\n');
				playerList[id].queue.shift();
			} else {
				console.log('activity: ' + playerList[id].name + ' pop stack\n');
				playerList[id].stack.pop();
			}
		}
		
		console.dir(playerList[id].queue);
		console.dir(playerList[id].stack);

		// calculate score
		playerList[id].score = 0;
		for ( let i=0; i<playerList[id].queue.length; ++i )
			playerList[id].score += playerList[id].queue[i];
		for ( let i=0; i<playerList[id].stack.length; ++i )
			playerList[id].score += playerList[id].stack[i];

		io.to(socketId).emit('update', playerList[id].queue, playerList[id].stack, userList(), vis());
		let finCnt = 0;
		for ( let v of vis() )
			if ( v )
				finCnt++;
		if ( finCnt == PLAYER )
			io.to(socketId).emit('score', scoreList(), vis(), userList(), false);
	}
}
