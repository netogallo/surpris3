function callback_photobomb_list(page,data, page_type, res){
	var info_render = {};
	info_render.page = page_type;
	info_render.photobomb = data;
        info_render.page_count = page;

        for(var i=0; i < info_render.photobomb.length; ++i){
		var v = 0;
		for(var j=0; j < info_render.photobomb[i].votes.length; ++j){
			v += info_render.photobomb[i].votes[j].value;
		}
		info_render.photobomb[i].number_votes = v;
	}

        res.render('photobomb_list', info_render);
}

function callback_challenge(data, challenge_object, res){
	var info_render = {};
	info_render.page = 'challenge';
	info_render.challenge = challenge_object;
	info_render.photobomb = data;

	for(var i=0; i < info_render.photobomb.length; ++i){
		var v = 0;
		for(var j=0; j < info_render.photobomb[i].votes.length; ++j){
			v += info_render.photobomb[i].votes[j].value;
		}
		info_render.photobomb[i].number_votes = v;
	}

	res.render('challenge_list.ejs', info_render)
}

function callback_photobomb_single(data, res){
	var info_render = {};
	info_render.page = '';
	info_render.photobomb = data;
	info_render.layout = false;

	var v = 0;
	for(var j=0; j < info_render.photobomb.votes.length; ++j){
		v += info_render.photobomb.votes[j].value;
	}
	info_render.photobomb.number_votes = v;

	res.render('single_photobomb', info_render);
}

exports.top = function(req,res){
	var page = req.params.page; // passed page number
	var photobomb_array = []; // TODO: LIST OF PHOTOBOMBS AS EXPLAINED IN GOOGLE DOC
	callback_photobomb_list(page, photobomb_array, 'top', res); // CALLBACK FUNCTION
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
        var pb = require('./photobombs');
        pb.expandedPhotobombs(function(error,photobomb_array){
	    
	    if(error || !photobomb_array)
		res.render('404');
	    else
		callback_photobomb_list(page,photobomb_array ? photobomb_array : [], 'recent',res); // CALLBACK FUNCTION
	},{page:page});
}

exports.single_photobomb = function(req, res) {
	var id = req.params.id; // passed photobomb id
	var photobomb = {}; // TODO: PHOTOBOMB OBJECT AS SPECIFIED IN GOOGLE DOC OF ID
        var pb = require('./photobombs');
        pb.getPhotobombPretty(id,(function(error,photobomb){
	    if(error || photobomb.length == 0){
		res.status(404);
		res.render('404');
	    }else
		callback_photobomb_single(photobomb[0], res); // CALLBACK FUNCTION
	}));
}


