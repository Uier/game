var name, player, init = false;
var socket;

document.addEventListener('DOMContentLoaded', function() {
	socket = io();

	socket.on('connect', () => {
		console.log('connected');
		$('#status').text('Connected');
		checkCookie();
		$('#username').text(name);
	});

	socket.on('online', (onlineCnt, PLAYER) => {
		if ( onlineCnt > PLAYER )
			socket.disconnect();
		$('#online').text((onlineCnt > PLAYER ? PLAYER : onlineCnt));
		player = PLAYER;
	});

	socket.on('disconnect', () => {
			$('#status').text('Disconnected');
	});

	socket.on('setgame', (Rnd, onlineCnt, userList, scoreList, data) => {
		// allocate instructions
		if ( init == false ) {
			// init = true;
			for ( let i=0; i<data[0].length; ++i ) {
				var content = '<div class="set" id="rnd' + (i+1) + '">';
				if ( i > Rnd ) {
					if ( data[1][i] == 'i' )
						content += 'Push</div>';
					else if ( data[1][i] == 'o' )
						content += 'Pop</div>';
					else
						content += '???</div>';
				} else {
					if ( data[0][i] == 'i' )
						content += 'Push</div>';
					else
						content += 'Pop</div>';
				}
				console.log(content);
				$('#operation').append(content);
				$('#rnd' + (i+1)).css('color', 'white');
				$('#rnd' + (i+1)).css('background-color', '#131F37');
			}
			$('#operation').append('<div class="set" id="rnd' + (data[0].length+1) + '">End</div>');
		}
		// refresh highlight
		$('#rnd' + Rnd).css('color', 'black');
		$('#rnd' + Rnd).css('background-color', 'yellow');
		// update users
		for ( let i=0; i<player; ++i )	$('#Team' + i).text(userList[i]);
		// start require
		if ( onlineCnt == player && Rnd == 0 ) {
			socket.emit('nextRnd');
			for ( let i=0; i<player; ++i ) {
				var str = '#Team' + i;
				$(str).css('color', '#fff');
				$(str).css('border-color', '#FFC9D8');
			}
		}
		// refresh
//******** bug to fix, pass userName_hashing value to server and find id.
		if ( Rnd > 0 )	socket.emit('refresh', userList.findIndex(findName));
	});

	socket.on('setscoreboard', (userList, scoreList) => {
		if ( init == false ) {
			init = true;
			for ( let i=0; i<player; ++i ) {
				$('#scoreboard tbody').append(
					'<tr>' +
					'<td style=\"width: 70%\" id=\"Team' + i + '\">' + userList[i] + '</td>' +
					'<td style=\"width: 30%\" id=\"score' + i + '\">' + 0 + '</td>' +
					'</tr>'
				);
			}
		}
	});

	socket.on('highlight', (Rnd) => {
		$('#rnd' + Rnd).css('color', 'white');
		$('#rnd' + Rnd).css('background-color', '#131F37');
		$('#rnd' + (Rnd+1)).css('color', 'black');
		$('#rnd' + (Rnd+1)).css('background-color', 'yellow');
	});

	socket.on('setIO', (Rnd, val, data) => {
		$('#head').text('Please ');
		if ( data[0][Rnd] == 'i' ) {
			if ( data[1][Rnd] == '?' )	$('#rnd' + (Rnd+1)).text('Push');
			$('#instruction').text('push ');
			$('#element').text(val + '.');
		} else {
			if ( data[1][Rnd] == '?' )	$('#rnd' + (Rnd+1)).text('Pop');
			$('#instruction').text('pop.');
			$('#element').text('');
		}
	});

	socket.on('setEnd', () => {
		$('#head').text('End');
		$('#instruction').text('');
		$('#element').text('');
	});

	socket.on('update', function(id, queue, stack, userList, vis) {
		if ( id >= 0 && userList[id] == name ) {
			var queue_content = '[';
			if ( queue.length > 0 )	queue_content += queue[queue.length-1];
			for ( let i=queue.length-2; i>=0; --i ) {
				queue_content += ', ';
				queue_content += queue[i];
			}
			queue_content += ']';
			var stack_content = '[';
			if ( stack.length > 0 )	stack_content += stack[stack.length-1];
			for ( let i=stack.length-2; i>=0; --i ) {
				stack_content += ', ';
				stack_content += stack[i];
			}
			stack_content += ']';
			$('#queue-arr').text(queue_content);
			$('#stack-arr').text(stack_content);
		}
		for ( let i=0; i<player; ++i )
			if ( vis[i] ) {
				var str = '#Team' + i;
				$(str).css('color', '#6eeb83');
				$(str).css('border-color', '#FFC9D8');
			}
	});

	socket.on('score', function(id, scoreList, vis, refresh, userList) {
		var PlayerCnt = 0;
		for ( let i=0; i<player; ++i )	if ( vis[i] )	PlayerCnt++;
		if ( PlayerCnt == player || refresh ) {
			for ( var i=0; i<player; ++i ) {
				$('#Team' + i).text(userList[i]);
				$('#score' + i).text(scoreList[i]);
			}
			if ( !refresh )	socket.emit('nextRnd');
			PlayerCnt = 0;
			for ( let i=0; i<player; ++i ) {
				var str = '#Team' + i;
				$(str).css('color', '#fff');
				$(str).css('border-color', '#FFC9D8');
			}
		}
	});

	socket.on('sendToken', (token) => {
		setCookie(token);
	});

	socket.on('sendName', (user) => {
		name = user;
	});
});

function findName(element) {
	return Number(element == name);
}

function setCookie(token) {
	document.cookie = 'userToken=' + token + ';';
}

function getCookie(prefix) {
	prefix += '=';
	var cookie = document.cookie.split(';');
	for ( let i=0; i<cookie.length; ++i ) {
		var str = cookie[i].trim();
		if ( str.indexOf(prefix) == 0 )
			return str.substring(prefix.length, str.length);
	}
	return '';
}

function checkCookie() {
	var token = getCookie('userToken'), user = '';
	var sessionId = getCookie('');
	if ( token == '' ) {
		do {
			user = prompt('歡迎！異世界的勇者們呀，請輸入你們小隊的隊名！');
		} while ( user == null || user.length < 2 || user.length > 20 );
		socket.emit('setName', user);
	} else {
		socket.emit('getName', token);
	}
}

function click_queue() {
	socket.emit('click', name, 'q');
}

function click_stack() {
	socket.emit('click', name, 's');
}
