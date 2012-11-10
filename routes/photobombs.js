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

	Competition.findOne({}).sort('-date').exec(Prelude.curry(function(req,res,err,competition){
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
		console.log(v.photobomb_id);
		return v.photobomb_id;
	    };
	    res.json(Prelude.map(filter,votes));
	}})(res));
};

exports.createUser = function(req,res){

    var tmp = eval('('+req.param('arg')+')');
    
    var user = new User({
	_id : tmp.id,
	name : tmp.name,
	picture : tmp.picture
    });

    user.save(Prelude.curry(function(res,error){
	
	if(error)
	    res.json({error:true});
	else
	    res.json({error:false});
    })(res));
};

exports.vote = function(req,res){

    var tmp = eval('('+req.param('arg')+')');

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

		console.log(pb);
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

//callback(error,photobombs)
exports.expandedPhotobombs = function(callback,query){    

    if(!query)
	query = {};

    Photobomb.find(query,Prelude.curry(function(callback,error,photobombs){
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
		    competition : comp};		
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
		    competition : pb.competition};
	    };
	    
	    var res = Prelude.map(augment,photobombs);
	    
	    callback(undefined,res);
	}
    })(callback,photobombs));
};
