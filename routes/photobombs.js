var createPhotobomb = Prelude.curry(function(req,res,competition){
    
    var tmp = eval("("+req.param('arg')+")");
    var req = require('../requestWrapper');
    tmp.competition_id = competition;
    
    req.getBinary(tmp.picture_url,Prelude.curry(function(obj,res,e,picData){
	var str = new Buffer(picData,'binary').toString('base64');
	obj.picture = "data:image/jpeg;base64," + str;	
	savePhotobomb(obj,res);

    })(tmp,res));
});

var resultsPerPage = 10;

var savePhotobomb = Prelude.curry(function(obj,res){

    var pb = new Photobomb({
	user_id : obj.user_id,
	picture : obj.picture,
	name : obj.name,
	competition_id : obj.competition_id,
	votes : []
    });

    Photobomb.findOne({user_id:obj.user_id,competition_id:obj.competition_id},Prelude.curry(function(res,pb,error,obj){
	
	if(error){
	    console.log(error);
	    res.json({error:true});
	}if(!obj || !obj.competition_id){
	    
	    pb.save(Prelude.curry(function(res,pb,err){
	
		if(err){
		    console.log(err);
		    res.json({error:true});
		}else
		    res.json({error:false,result:pb});
	    })(res,pb));
	}else{
	    res.json({error:true,already_participated:true})
	}
    })(res,pb));
	
});

exports.uploadPicture = function(req,res){

    var tmp = eval("("+req.param('arg')+")");

    if(tmp.competition){

	Competition.findOne({}).sort({date:-1}).exec(Prelude.curry(function(req,res,err,competition){
	    console.log(competition);
	    if(err || !competition)
		res.json({error:true});
	    else
		createPhotobomb(req,res,competition._id);
	    })(req,res));
    }else
	createPhotobomb(req,res,undefined);
};

exports.getMyVotes = function(req,res){

    Vote.find({user_id:req.params.user_id},Prelude.curry(function(res,error,votes){

	if(error)
	    res.json({error:true});
	else{
	    
	    var filter = function(v){
		return v.photobomb_id;
	    };
	    res.json(Prelude.map(filter,votes));
	}})(res));
};

exports.createUser = function(req,res){

    var tmp = eval('('+req.param('arg')+')');
    
    console.log(tmp);

    var user = new User({
	_id : tmp.id,
	name : tmp.name,
	picture : tmp.picture
    });

    user.save(Prelude.curry(function(res,error){
	
	if(error){
	    console.log(error);
	    res.json({error:true});
	}else
	    res.json({error:false});
    })(res));
};

exports.vote = function(req,res){

    var tmp = eval('('+req.param('arg')+')');

    console.log(tmp);

    if(!(tmp.value == 1 || tmp.value == -1))
	res.json({error:true,invalid_value:true});
    else{
	var vote = new Vote({
	    user_id : tmp.user_id,
	    photobomb_id : tmp.photobomb_id
	});    

	Photobomb.findOne({_id:tmp.photobomb_id},{picture:0},Prelude.curry(function(vote,value,res,err,pb){
	    if(err || !pb){
		console.log(err);
		res.json({error:true});
	    }else{

		pb.votes.push({user_id:vote.user_id,value:value});   
		vote.save(Prelude.curry(function(pb,res,err){
		    
		    if(err)
			res.json({error:true,already_voted:true});
		    else
			pb.save(Prelude.curry(function(res,err){
			    
			    if(err){
				console.log(err);
				res.json({error:true});
			    }else
				res.json({error:false});
			})(res));		
		})(pb,res));
	    }
	})(vote,tmp.value,res));
    }
};

exports.addCompetition = function(req,res){

    var tmp = eval('('+req.param('arg')+')');

    var competition = new Competition({
    	name : tmp.name,
	description : tmp.description
    });

    competition.save(Prelude.curry(function(res,err){

	if(err)
	    res.json({error:true});
	else
	    res.json({error:false});
    })(res));
};


exports.photobombs = function(req,res){

    Photobomb.find({},Prelude.curry(function(res,error,photobombs){

	if(error)
	    res.json({error:true});
	else
	    expandCompetitions(photobombs,Prelude.curry(function(res,error,photobombs){

		expandUsers(photobombs,Prelude.curry(function(res,error,photobombs){

		    res.json(photobombs);
		})(res));
	    })(res));
    })(res));
};

exports.getPhotobombPretty = function(id,callback){

    exports.expandedPhotobombs(callback,{_id:id});
};

var photobombScore =  function(pb){

    var res = 0;
    for(var i=0;i<pb.votes.length;i++)
	res += pb.votes[i].value;
    
    return res;
};

exports.getScores = function(req,res){
    
    exports.getUsersScore(function(error,result){
	res.json(result);
    });
    
}

exports.getCurrentChallenge = function(callback){

    Competition.findOne({}).sort({date:-1}).exec(callback);
}

exports.getChallenge = function(competition_id,callback){

    Competition.findOne({_id:competition_id},function(error,challenge){
	callback(error,challenge);
    });
}

exports.getPhotobombChallenges = function(challenge_id,page,callback){

    Photobomb.find({competition_id:challenge_id},Prelude.curry(function(callback,error,pbs){

	if(!page)
	    page = 1;
	
	if(error)
	    callback(error,undefined)
	else{	    

	    var countVotes = function(pb){

		var total = 0;
		for(var i=0;i<pb.votes.length;i++)
		    total += pb.votes[i].value;

		return {
		    _id : pb._id,
		    user_id : pb.user_id,
		    name : pb.name,
		    competition_id : pb.competition_id,
		    votes : pb.votes,
		    score : total,
		    date : pb.date,
		    user : pb.user,
		    picture : pb.picture,
		    challenge : pb.challenge};		
	    }

	    var ranked = Prelude.map(countVotes,pbs);

	    var cmp = function(pb1,pb2){
		if(pb1.score > pb2.score)
		    return -1;
		else if(pb1.score < pb2.score)
		    return 1;
		else
		    return 0;
	    };

	    ranked.sort(cmp);

	    ranked = Prelude.take(resultsPerPage,Prelude.drop(resultsPerPage*(page-1),ranked));

	    expandCompetitions(ranked,Prelude.curry(function(callback,error,photobombs){

		if(error)
		    callback(error,undefined);
		else{
		    expandUsers(photobombs,Prelude.curry(function(callback,error,photobombs){
			
			if(error)
			    callback(error,undefined);
			else
			    callback(undefined,photobombs);
		    })(callback));
		}
	    })(callback));	    
	}
    })(callback));
};


// var getAllData = function(callback,photobombs){

//     expandCompetitions(photobombs,Prelude.curry(function(callback,error,photobombs){

// 	if(error)
// 	    callback(error,undefined);
// 	else{
// 	    expandUsers(photobombs,Prelude.curry(function(callback,error,photobombs){
		
// 		if(error)
// 		    callback(error,undefined);
// 		else
// 		    callback(undefined,photobombs);
// 	    })(callback));
// 	}
//     })(callback));	    

// }

exports.getUserScore = function(req,res){

    Photobomb.find({user_id:req.params.user_id},Prelude.curry(function(res,error,pbs){
	
	if(error)
	    res.json({error:true});
	else{
	    var value = 0;
	    
	    for(var i=0;i<pbs.length;i++)
		value += photobombScore(pbs[i]);
	    
	    res.json({error:false,score:value});		     
	}
    })(res));
}

exports.getUsersScore = function(callback){

    var obj = {};

    obj.map = function(){

	emit(this.user_id,this.votes);//photobombScore(this))
    };


    obj.reduce = function(k,vals){return vals;};
    
    Photobomb.mapReduce(obj,function(err,res){
	//console.log(res);
	for(var i=0;i<res.length;i++){

	    res[i].score = photobombScore(res[i].value);
	}
	callback(err,res);
    });
    
};

exports.getTopPhotobombs = function(page,callback){

    if(!page)
	page = 1;

    Photobomb.find({},Prelude.curry(function(callback,error,pbs){
	
	if(error)
	    callback(error,undefined)
	else{

	    var countVotes = function(pb){

		var total = 0;
		for(var i=0;i<pb.votes.length;i++)
		    total += pb.votes[i].value;

		return {
		    _id : pb._id,
		    user_id : pb.user_id,
		    name : pb.name,
		    competition_id : pb.competition_id,
		    votes : pb.votes,
		    score : total,
		    date : pb.date,
		    user : pb.user,
		    picture : pb.picture,
		    challenge : pb.challenge};		
	    }

	    var ranked = Prelude.map(countVotes,pbs);

	    var cmp = function(pb1,pb2){
		if(pb1.score > pb2.score)
		    return -1;
		else if(pb1.score < pb2.score)
		    return 1;
		else
		    return 0;
	    };

	    ranked.sort(cmp);

	    ranked = Prelude.take(resultsPerPage,Prelude.drop(resultsPerPage*(page-1),ranked));

	    expandCompetitions(ranked,Prelude.curry(function(callback,error,photobombs){

		if(error)
		    callback(error,undefined);
		else{
		    expandUsers(photobombs,Prelude.curry(function(callback,error,photobombs){
			
			if(error)
			    callback(error,undefined);
			else
			    callback(undefined,photobombs);
		    })(callback));
		}
	    })(callback));	    
	}
    })(callback));
};

//callback(error,photobombs)
exports.expandedPhotobombs = function(callback,args){    

    if(!args)
	args = new Object();

    if(!args.query)
	args.query = {};
    if(!args.page || args.page < 1)
	args.page = 1;

    if(!args.sort)
	args.sort = {date:-1};

    //console.log(args.page);

    Photobomb.find(args.query).skip((args.page-1)*resultsPerPage).limit(resultsPerPage).sort(args.sort).exec(Prelude.curry(function(callback,error,photobombs){
	if(error)
	    callback(error,undefined);
	else if(!photobombs){
	    callback(error,null);
	}else{
	    expandCompetitions(photobombs,Prelude.curry(function(callback,error,photobombs){

		if(error)
		    callback(error,undefined);
		else{
		    expandUsers(photobombs,Prelude.curry(function(callback,error,photobombs){
			
			if(error)
			    callback(error,undefined);
			else
			    callback(undefined,photobombs);
		    })(callback));
		}
	    })(callback));
	}
    })(callback));
}
				    
var expandCompetitions = function(photobombs,callback){

    if(!photobombs || photobombs.length == 0){
	callback(undefined,[]);
	return;
    }

    var reduce = function(y,x){
	return Prelude.append(y,{_id:x.competition_id});
    };

    var comp = Prelude.foldr(reduce,[],photobombs);

    Competition.find({$or:comp},Prelude.curry(function(callback,photobombs,error,competitions){
	if(error)
	    callback(error,undefined);
	else{

	    var augment = function(pb){

		var f = function(x){return x._id.toString() == pb.competition_id;};

		var comp = Prelude.find(f,competitions);

		return {
		    _id : pb._id,
		    user_id : pb.user_id,
		    name : pb.name,
		    competition_id : pb.competition_id,
		    votes : pb.votes,
		    date : pb.date,
		    user : pb.user,
		    picture : pb.picture,
		    challenge : comp};
	    }

	    var res = Prelude.map(augment,photobombs);
	    callback(undefined,res);
	}
    })(callback,photobombs));
}

var expandUsers = function(photobombs,callback){

    if(!photobombs || photobombs.length == 0){
	callback(undefined,[]);
	return;
    }

    var reduce = function(y,x){

	return Prelude.append(y,{_id:x.user_id});
    };

    var users = Prelude.foldr(reduce,[],photobombs);

    User.find({$or:users},Prelude.curry(function(callback,photobombs,error,users){


	if(error)
	    callback(error,undefined);
	else{
	    
	    var augment = function(pb){

		var f = function(x){return x._id == pb.user_id;};
	    
		return {
		    _id : pb._id,
		    user_id : pb.user_id,
		    name : pb.name,
		    competition_id : pb.competition_id,
		    votes : pb.votes,
		    date : pb.date,
		    user : Prelude.find(f,users),
		    picture : pb.picture,
		    challenge : pb.challenge};
	    };
	    
	    var res = Prelude.map(augment,photobombs);
	    
	    callback(undefined,res);
	}
    })(callback,photobombs));
};

exports.getImage = function(req,res){

    Photobomb.findOne({_id:req.params.photobomb_id},function(error,pb){
	
	if(error || !pb || !pb._id)
	    res.render('404');
	else{
	    res.set({'Content-Type': 'image/jpeg'});
	    var fs = require('fs');
	    var fname = "/tmp/"+pb._id+'.jpg';
	    fs.writeFile(fname,new Buffer(pb.picture.substr("data:image/jpeg;base64,".length),'base64'),function(error){

		if(error)
		    res.render('404');

		res.sendfile(fname);
	    });
	}
    });
}
