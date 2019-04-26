var userList = ['特世大魔王', 'Team1', 'Team2', 'Team3', 'Team4'];

function setCookie(name) {
	// userList.push(name);
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

function random_value(max_value) {
	return 1 + Math.floor(Math.random() * max_value);
}

var name = checkCookie();
var cur_rnd = 0, player = 1, finish = 0, used = [false, false, false, false, false];
var setting = true, data, maximum;

document.addEventListener('DOMContentLoaded', function() {
	socket.on('setgame', function(operation, max_value) {
		if ( setting == true ) {
			setting = false;
			data = operation;
			maximum = max_value;
		}
		var round, prefix, suffix, content;
		for ( var i=0; i<operation.length; ++i ) {
			prefix = '<div class="set" id="rnd' + String(i+1) + '">';
			suffix = '</div>';
			if ( operation[i] == 'i' ) {
				content = prefix + 'Push' + suffix;
			} else if ( operation[i] == 'o' ) {
				content = prefix + 'Pop' + suffix;
			} else {
				content = prefix + '???' + suffix;
			}
			console.log(content);
			$('#operation').append(content);
		}
		$('#operation').append('<div class="set" id="end">End</div>');
	});

	socket.on('startgame', function() {
		finish = 1;
		startRnd();
	});

	socket.on('confirm', function(id, container) {
		doMove(id, container);
	});

	socket.on('connect', function() {
		console.log('connected');
	    $('#status').text('Connected');
	    $('#username').text(name);
	});

	socket.on('disconnect', function() {
	   	$('#status').text('Disconnected');
	});

	socket.on('online', function(amount) {
	    $('#online').text(amount);
	});

});

var cur_value;

function startRnd() {
	if ( finish == player ) {
		console.log('rnd'+String(cur_rnd));
		$('#rnd' + String(cur_rnd)).css('color', 'white');
		$('#rnd' + String(cur_rnd)).css('background-color', '#131F37');
		$('#rnd' + String(cur_rnd+1)).css('color', 'black');
		$('#rnd' + String(cur_rnd+1)).css('background-color', 'yellow');
		if ( data[cur_rnd] == '?' ) {
			if ( random_value(2) == 1 ) {
				data[cur_rnd] = 'i';
				$('#rnd' + String(cur_rnd+1)).text('Push');
				$('#instruction').text('push ');
				cur_value = random_value(maximum);
				$('#element').text(String(cur_value) + '.');
			} else {
				data[cur_rnd] = 'o';
				$('#rnd' + String(cur_rnd+1)).text('Pop');
				$('#instruction').text('pop.');
				$('#element').text('');
			}
		} else if ( data[cur_rnd] == 'i' ) {
			cur_value = random_value(maximum);
			$('#instruction').text('push ');
			$('#element').text(String(cur_value) + '.');
		} else {
			$('#instruction').text('pop.');
			$('#element').text('');
		}
		finish = 0;
		cur_rnd++;
		for ( var i=0; i<5; ++i )	used[i] = false;
	}
}

function findName(element) {
	return element == name;
}

function click_queue() {
	console.log(name + ' choose queue');
	var id = userList.findIndex(findName);
	console.log('click id: '+String(id));
	if ( id >= 0 && !used[id] ) {
		console.log('debug: ' + data[cur_rnd-1]);
		if ( data[cur_rnd-1] == 'i' ) {
			doMove(id, 'q');
		} else {
			socket.emit('check', id, 'q');
		}
	}
}

function click_stack() {
	console.log(name + ' choose stack');
	var id = userList.findIndex(findName);
	console.log('click id: '+String(id));
	if ( id >= 0 && !used[id] ) {
		if ( data[cur_rnd-1] == 'i' ) {
			doMove(id, 's');
		} else {
			socket.emit('check', id, 's');
		}
	}
}

function doMove(id, container) {
	used[id] = true;
	finish++;
	if ( data[cur_rnd-1] == 'i' ) {
		socket.emit('push', id, container, cur_value);
	} else {
		socket.emit('pop', id, container);
	}
	startRnd();
}
