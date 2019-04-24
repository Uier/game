var name = prompt('TeamName');

document.addEventListener('DOMContentLoaded', function() {
	socket.on('connect', function() {
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