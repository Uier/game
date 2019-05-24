
var userList = ['Team0', 'Team1', 'Team2', 'Team3', 'Team4'];
var scoreList = ['Team0score', 'Team1score', 'Team2score', 'Team3score', 'Team4score'];

function setCookie(name) {
	var cookie = 'username=' + name + ';';
	document.cookie = cookie;
}

function getCookie(prefix) {
	prefix = prefix + '=';
	var cookie = document.cookie.split(';');
	for ( var i=0; i<cookie.length; ++i ) {
		var str = cookie[i].trim();
		if ( str.indexOf(prefix) == 0 ) {
			return str.substring(prefix.length, str.length);
		}
	}
	return '';
}

function checkCookie() {
	var user = getCookie('username');
	console.log(user);
	if ( user == '' ) {
		user = prompt('一小輸入Team1, 以此類推');
		setCookie(user);
	}
	return user;
}

function findName(element) {
	return element == name;
}

var name = checkCookie();
var player, used = [false, false, false, false, false], data = [], res, init = false;

document.addEventListener('DOMContentLoaded', function() {
	socket.on('connect', function() {
		console.log('connected');
	    $('#status').text('Connected');
	    $('#username').text(name);
	});

	socket.on('online', function(amount, operation, origin, vis, plyr) {
	    $('#online').text(amount);
	    data[0] = operation;
	    data[1] = origin;
	    console.log('data: ' + data);
		used = vis;
		player = plyr;
	});

	socket.on('disconnect', function() {
	   	$('#status').text('Disconnected');
	});

	socket.on('setgame', function(Rnd, amount) {
		if ( init == false ) {
			init = true;
			var content;
			for ( var i=0; i<data[0].length; ++i ) {
				content = '<div class="set" id="rnd' + String(i+1) + '">';
				if ( i > Rnd ) {
					if ( data[1][i] == 'i' )	content += 'Push</div>';
					else if ( data[1][i] == 'o' )	content += 'Pop</div>'
					else content += '???</div>';
				} else {
					if ( data[0][i] == 'i' )	content += 'Push</div>';
					else	content += 'Pop</div>';
				}
				console.log(content);
				$('#operation').append(content);
				$('#rnd' + String(i+1)).css('color', 'white');
				$('#rnd' + String(i+1)).css('background-color', '#131F37');
			}
			$('#operation').append('<div class="set" id="rnd' + String(data[0].length+1) + '">End</div>');
		}
		// refresh highlight
		$('#rnd' + String(Rnd)).css('color', 'black');
		$('#rnd' + String(Rnd)).css('background-color', 'yellow');
		// scoreboard highlight
		var highlight = '#' + scoreList[userList.findIndex(findName)];
		$(highlight).css('color', 'black');
		$(highlight).css('background-color', 'yellow');
		highlight = '#' + userList[userList.findIndex(findName)];
		$(highlight).css('color', 'black');
		$(highlight).css('background-color', 'yellow');
		// start require
		if ( amount == player && Rnd == 0 )	socket.emit('nextRnd');
		// refresh
		if ( Rnd > 0 )	socket.emit('refresh', userList.findIndex(findName));
	});

	socket.on('highlight', function(Rnd) {
		$('#rnd' + String(Rnd)).css('color', 'white');
		$('#rnd' + String(Rnd)).css('background-color', '#131F37');
		$('#rnd' + String(Rnd+1)).css('color', 'black');
		$('#rnd' + String(Rnd+1)).css('background-color', 'yellow');
	});

	socket.on('setIO', function(Rnd, val, Q) {
		$('#head').text('Please ');
		if ( Rnd == 0 )	res = data[1][Rnd];
		else res = data[0][Rnd];
		if ( res == 'i' ) {
			if ( Q == '?' )	$('#rnd' + String(Rnd+1)).text('Push');
			$('#instruction').text('push ');
			$('#element').text(val + '.');
		} else {
			if ( Q == '?' )	$('#rnd' + String(Rnd+1)).text('Pop');
			$('#instruction').text('pop.');
			$('#element').text('');
		}
	});

	socket.on('setEND', function() {
		$('#head').text('End');
		$('#instruction').text('');
		$('#element').text('');
	});

	socket.on('confirm', function(id, container) {
		doMove(id, container);
	});

	socket.on('update', function(id, queue, stack, vis) {
		used = vis;
		if ( id >= 0 && userList[id] == name ) {
			var queue_content = '[';
			if ( queue.length > 0 )	queue_content += String(queue[queue.length-1]);
			for ( var i=queue.length-2; i>=0; --i ) {
				queue_content += ', ';
				queue_content += String(queue[i]);
			}
			queue_content += ']';
			var stack_content = '[';
			if ( stack.length > 0 )	stack_content += String(stack[stack.length-1]);
			for ( var i=stack.length-2; i>=0; --i ) {
				stack_content += ', ';
				stack_content += String(stack[i]);
			}
			stack_content += ']';
			$('#queue-arr').text(queue_content);
			$('#stack-arr').text(stack_content);
		}
	});

	socket.on('score', function(score, vis, refresh) {
		var Pcnt = 0;
		for ( var i=0; i<5; ++i )
			if ( vis[i] )
				Pcnt++;
		if ( Pcnt >= player || refresh ) {
			for ( var i=0; i<5; ++i ) {	
				var obj = '#' + scoreList[i];
				$(obj).text(score[i]);
			}
			if ( !refresh )	socket.emit('nextRnd');
			Pcnt = 0;
		}
	});
});

function click_queue() {
	console.log(name + ' click queue');
	var id = userList.findIndex(findName);
	if ( id >= 0 && !used[id] ) {
		if ( res == 'i' ) {
			doMove(id, 'q');
		} else {
			socket.emit('check', id, 'q');
		}
	}
}

function click_stack() {
	console.log(name + ' click stack');
	var id = userList.findIndex(findName);
	if ( id >= 0 && !used[id] ) {
		if ( res == 'i' ) {
			doMove(id, 's');
		} else {
			socket.emit('check', id, 's');
		}
	}
}

function doMove(id, container) {
	if ( res == 'i' ) {
		console.log('domove: ' + id + ' push ' + container);
		socket.emit('push', id, container);
	} else {
		console.log('domove: ' + id + ' pop ' + container);
		socket.emit('pop', id, container);
	}
}
