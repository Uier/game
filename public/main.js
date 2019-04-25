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

function random_value(max_value) {
	return 1 + Math.floor(Math.random() * max_value);
}

var name = checkCookie();

document.addEventListener('DOMContentLoaded', function() {

	socket.on('setgame', function(operation) {
		var round, prefix, suffix, content;
		console.log(operation.length);
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
	});

	socket.on('startgame', function(operation, max_value) {

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

function click_queue() {
    console.log(name + ' choose queue');
}

function click_stack() {
    console.log(name + ' choose stack');
}