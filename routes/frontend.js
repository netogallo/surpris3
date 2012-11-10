function callback_photobomb_list(data, res){
	var info_render = {};
	info_render.page = 'top';
	info_render.photobomb = data;

	res.render('photobomb_list', info_render);
}

function callback_challenge(data, challenge_object, res){
	var info_render = {};
	info_render.page = 'challenge';
	info_render.challenge = challenge_object;
	info_render.photobomb = data;

	res.render('challenge_list.ejs')
}

function callback_photobomb_single(data, res){
	var info_render = {};
	info_render.page = '';
	info_render.photobomb = data;

	res.local('layout', false);
	res.render('single_photobomb', info_render);
}

exports.top = function(req,res){
	var page = req.params.page; // passed page number
	var photobomb_array = []; // TODO: LIST OF PHOTOBOMBS AS EXPLAINED IN GOOGLE DOC
	callback_photobomb_list(photobomb_array, res); // CALLBACK FUNCTION
}

exports.challenge = function(req, res){
	var id = req.params.id; // passed challenge id
	var page = req.params.page; // passed page number
	var current_challenge = {}; // TODO: LIST OF PHOTOBOMBS AS EXPLAINED IN GOOGLE DOC
	var photobomb_array = []; // TODO: OBJECT OF CURRENT CHALLENGE
	callback_challenge(photobomb_array, current_challenge, res); // CALLBACK FUNCTION
}

exports.recent = function(req, res){
	var page = req.params.page; // passed page number
	var photobomb_array = []; // TODO: LIST OF PHOTOBOMBS AS EXPLAINED IN GOOGLE DOC
	callback_photobomb_list(photobomb_array, res); // CALLBACK FUNCTION
}

exports.single_photobomb = function(req, res) {
	var id = req.params.id; // passed photobomb id
	var photobomb = {}; // TODO: PHOTOBOMB OBJECT AS SPECIFIED IN GOOGLE DOC OF ID
	callback_photobomb_single(photobomb, res); // CALLBACK FUNCTION
}