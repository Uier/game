var setCookie = function(name) {
	var cookie = 'username=' + name + ';';
	document.cookie = cookie;
}

var getCookie = function(prefix) {
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

var checkCookie = function() {
	var user = getCookie('username');
	console.log(user);
	if ( user == '' ) {
		user = prompt('一小輸入Team1, 以此類推');
		setCookie(user);
	}
	return user;
}

var name = checkCookie();
console.log(name);

document.addEventListener('DOMContentLoaded', function() {
	console.log(name);

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
