var getCurrentChallenge = function(callback){

    Competition.findOne({}).sort({date:-1}).exec(Prelude.curry(function(callback,error,challenge){

	callback(error,challenge);
    })(callback));
}

function callback_photobomb_list(page,data, page_type, res){
	var info_render = {};
	info_render.page = page_type;
	info_render.photobomb = data;
     info_render.page_count = page;
     info_render.challenge = {name: "Screw Friendship", description: "Photobomb a classical friendship picture."};


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
	info_render.photobomb = data;
	info_render.challenge = challenge_object;
        info_render.page_count = 1;

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
	info_render.challenge = {name: "Screw Friendship", description: "Photobomb a classical friendship picture."};

	var v = 0;
	for(var j=0; j < info_render.photobomb.votes.length; ++j){
		v += info_render.photobomb.votes[j].value;
	}
	info_render.photobomb.number_votes = v;

	res.render('single_photobomb', info_render);
}

exports.top = function(req,res){	
        var page = req.params.page || 1; // passed page number
	var photobomb_array = []; // TODO: LIST OF PHOTOBOMBS AS EXPLAINED IN GOOGLE DOC
        var pb = require('./photobombs');
        pb.getTopPhotobombs(page,function(error,photobomb_array){
	    
	    if(error){
		res.render('404');
	    }else
		callback_photobomb_list(page, photobomb_array, 'top', res); // CALLBACK FUNCTION
	});
}

exports.getCurrentChallenge = function(req,res){

    var page = req.params.page;
    var pb = require('./photobombs');
    
    pb.getCurrentChallenge(function(error,challenge){

	if(error)
	    res.render('404');
	else{

	    pb.getPhotobombChallenges(challenge._id,page,function(error,photobomb_array){

		if(error)
		    res.render('404');
		else
		    callback_challenge(photobomb_array, challenge, res); // CALLBACK FUNCTION
	    });
	}
    });
}

exports.challenge = function(req, res){
	var id = req.params.id; // passed challenge id
        var page = req.params.page || 1 ;
	var current_challenge = {}; // TODO: LIST OF PHOTOBOMBS AS EXPLAINED IN GOOGLE DOC
	var photobomb_array = []; // TODO: OBJECT OF CURRENT CHALLENGE
    
        var pb = require('./photobombs');
        pb.getPhotobombChallenges(id,page,function(error,photobomb_array){

	    if(error)
		res.render('404');
	    else{
		pb.getChallenge(id,function(error,current_challenge){
		    callback_challenge(photobomb_array, current_challenge, res); // CALLBACK FUNCTION
		});
	    }
	});
}

exports.recent = function(req, res){
	var page = req.params.page || 1 ; // passed page number        
	var photobomb_array = []; // TODO: LIST OF PHOTOBOMBS AS EXPLAINED IN GOOGLE DOC
        var pb = require('./photobombs');
        pb.expandedPhotobombs(function(error,photobomb_array){
	    
	    if(error || !photobomb_array)
		res.render('404');
	    else{
		
		callback_photobomb_list(page,photobomb_array ? photobomb_array : [], 'recent',res); // CALLBACK FUNCTION
	    }
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

