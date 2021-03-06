var name, player, init = false;

document.addEventListener('DOMContentLoaded', function() {
	socket.on('connect', function() {
		console.log('connected');
	    $('#status').text('Connected');
	    name = checkCookie();
	    $('#username').text(name);
	});

	socket.on('online', function(amount, plyr) {
	    $('#online').text((amount > plyr ? plyr : amount));
		player = plyr;
	});

	socket.on('disconnect', function() {
	   	$('#status').text('Disconnected');
	});

	socket.on('setgame', function(Rnd, amount, userList, scoreList, data) {
		// allocate instructions
		if ( init == false ) {
			init = true;
			for ( var i=0; i<data[0].length; ++i ) {
				var content = '<div class="set" id="rnd' + (i+1) + '">';
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
				$('#rnd' + (i+1)).css('color', 'white');
				$('#rnd' + (i+1)).css('background-color', '#131F37');
			}
			$('#operation').append('<div class="set" id="rnd' + (data[0].length+1) + '">End</div>');
		}
		// refresh highlight
		$('#rnd' + Rnd).css('color', 'black');
		$('#rnd' + Rnd).css('background-color', 'yellow');
		// update users
		for ( var i=0; i<player; ++i )	$('#Team' + i).text(userList[i]);
		// scoreboard highlight
		var highlight = '#' + scoreList[userList.findIndex(findName)];
		$(highlight).css('color', 'black');
		$(highlight).css('background-color', 'yellow');
		highlight = '#' + userList[userList.findIndex(findName)];
		$(highlight).css('color', 'black');
		$(highlight).css('background-color', 'yellow');
		// start require
		if ( amount == player && Rnd == 0 ) {
			socket.emit('nextRnd');
			for ( var i=0; i<player; ++i ) {
				var str = '#Team' + i;
				$(str).css('color', '#fff');
				$(str).css('border-color', '#FFC9D8');
			}
			// var waiting_msg = 'waiting for:';
			// for ( var i=0; i<player; ++i )	waiting_msg += '' + userList[i];
			// $('#tail').text(waiting_msg, '連我阿嬤都按得比你快');
		}
		// refresh
		if ( Rnd > 0 )	socket.emit('refresh', userList.findIndex(findName));
	});

	socket.on('highlight', function(Rnd) {
		$('#rnd' + Rnd).css('color', 'white');
		$('#rnd' + Rnd).css('background-color', '#131F37');
		$('#rnd' + (Rnd+1)).css('color', 'black');
		$('#rnd' + (Rnd+1)).css('background-color', 'yellow');
	});

	socket.on('setIO', function(Rnd, val, data) {
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

	socket.on('setEnd', function() {
		$('#head').text('End');
		$('#instruction').text('');
		$('#element').text('');
	});

	socket.on('update', function(id, queue, stack, userList, vis) {
		if ( id >= 0 && userList[id] == name ) {
			var queue_content = '[';
			if ( queue.length > 0 )	queue_content += queue[queue.length-1];
			for ( var i=queue.length-2; i>=0; --i ) {
				queue_content += ', ';
				queue_content += queue[i];
			}
			queue_content += ']';
			var stack_content = '[';
			if ( stack.length > 0 )	stack_content += stack[stack.length-1];
			for ( var i=stack.length-2; i>=0; --i ) {
				stack_content += ', ';
				stack_content += stack[i];
			}
			stack_content += ']';
			$('#queue-arr').text(queue_content);
			$('#stack-arr').text(stack_content);
			// var waiting_msg = 'waiting for:';
			// for ( var i=0; i<player; ++i )	if ( !vis[i] )	waiting_msg += ' ' + userList[i];
			// $('#tail').text(waiting_msg, '連我阿嬤都按得比你快');
		}
		for ( var i=0; i<player; ++i )
			if ( vis[i] ) {
				var str = '#Team' + i;
				$(str).css('color', '#6eeb83');
				$(str).css('border-color', '#FFC9D8');
			}
	});

	socket.on('score', function(id, scoreList, vis, refresh, userList) {
		var PlayerCnt = 0;
		for ( var i=0; i<player; ++i )	if ( vis[i] )	PlayerCnt++;
		if ( PlayerCnt == player || refresh ) {
			for ( var i=0; i<player; ++i )	$('#score' + i).text(scoreList[i]);
			if ( !refresh )	socket.emit('nextRnd');
			PlayerCnt = 0;
			// var waiting_msg = 'waiting for:';
			// for ( var i=0; i<player; ++i )	waiting_msg += ' ' + userList[i];
			// $('#tail').text(waiting_msg, '連我阿嬤都按得比你快');
			for ( var i=0; i<player; ++i ) {
				var str = '#Team' + i;
				$(str).css('color', '#fff');
				$(str).css('border-color', '#FFC9D8');
			}
		}
	});
});

function findName(element) {
	return Number(element == name);
}

function setCookie(name) {
	document.cookie = 'username=' + name + ';';
}

function getCookie(prefix) {
	prefix += '=';
	var cookie = document.cookie.split(';');
	for ( var i=0; i<cookie.length; ++i ) {
		var str = cookie[i].trim();
		if ( str.indexOf(prefix) == 0 )
			return str.substring(prefix.length, str.length);
	}
	return '';
}

function checkCookie() {
	var user = getCookie('username');
	if ( user == '' ) {
		user = prompt('歡迎！異世界的勇者們呀，請輸入你們小隊的隊名！');
		setCookie(user);
	}
	socket.emit('setname', user);
	return user;
}

function click_queue() {
	socket.emit('click', name, 'q');
}

function click_stack() {
	socket.emit('click', name, 's');
}
