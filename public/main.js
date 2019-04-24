var name = prompt('TeamName');

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
