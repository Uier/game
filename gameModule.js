// function Game(operation_sequance, number_sequance, max_value) {
// 	if (operation_sequance.length !== number_sequance.length)
// 		throw new Error("Length for operation and number not match");

// 	var user_list_ = Array();
// 	for ( let i=0; i<4; ++i )
// 		user_list_.push('Team'+String(i+1));

// 	var current_round_ = -1;
// 	var finished_user_ = number_user;

// 	var cached_user_data_ = Array(number_user);

// 	var GenerateBroadcastData = () => {
// 		var data = {};
// 		data.p = operation_sequance;
// 		data.n = number_sequance;
// 		data.u = cached_user_data_;
// 		data.r = current_round_
// 		return data;
// 	}
// 	var SetNewRoundRandomConfigure = () => {
// 		if (operation_sequance[current_round_] === "?") {
// 			if (RandInt(0, 1) === 0)
// 				operation_sequance = operation_sequance.replaceAt(current_round_, 'i');
// 			else
// 				operation_sequance = operation_sequance.replaceAt(current_round_, 'o');
// 		}
// 		if (operation_sequance[current_round_] === "i"
// 			  && number_sequance[current_round_] <= 0) {
// 			number_sequance[current_round_] = RandInt(1, max_value);
// 		}
// 	}
// 	var CheckAndStartNewRound = () => {
// 		if (finished_user_ !== number_user)
//   			return;
// 		current_round_++;
// 		finished_user_ = 0;
// 		if (current_round_ < operation_sequance.length)
// 			SetNewRoundRandomConfigure()
// 		for (let i = 0; i < number_user; i++)
// 			cached_user_data_[i] = user_list_[i].ExportState(current_round_);
// 		broadcast(GenerateBroadcastData());
// 	}

//  this.DoMove = (user_id, container, round_id) => {
// 	console.log(user_id, container, round_id);
// 	// Assume user_id is valid
// 	if (current_round_ === operation_sequance.length)
// 	    return;
// 	if (round_id !== current_round_)
// 	    return;

// 	var success = false;
// 	if (container === "q") {
// 	    if (operation_sequance[current_round_] === 'i')
// 			success = user_list_[user_id].PushQueue(current_round_, number_sequance[current_round_]);
// 	    else if (operation_sequance[current_round_] === 'o')
// 			success = user_list_[user_id].PopQueue(current_round_);
// 	}
// 	else if (container === "s") {
// 	  if (operation_sequance[current_round_] === 'i')
// 		success = user_list_[user_id].PushStack(current_round_, number_sequance[current_round_]);
// 	  else if (operation_sequance[current_round_] === 'o')
// 		success = user_list_[user_id].PopStack(current_round_);
// 	}

// 	console.log(success);
// 	if (success) {
// 		finished_user_++;
// 		cached_user_data_[user_id].d = container;
// 		broadcast(GenerateBroadcastData());
// 		if (finished_user_ == number_user)
// 			CheckAndStartNewRound();
// 		}
// 	}

// 	CheckAndStartNewRound();
// }


// module.exports = {
//   Game
// }