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
