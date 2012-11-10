
/**
 * Module dependencies.
 */

Prelude = require('prelude-ls');

var mongo = require('mongoose');
db = mongo.createConnection('localhost','supris3');
ObjectId = mongo.Types.ObjectId;

var competition = mongo.Schema({
    name : String,
    description : String,
    date : {type:Date,default:Date.now}
});

var user = mongo.Schema({
    _id : String,
    name : String,
    picture : {data : 
	       {url : String,
		is_silhouette: Boolean
	       }
	      }
});	

var photobomb = mongo.Schema({
    user_id : String,
    competition_id : {type:mongo.Schema.Types.ObjectId,ref:'Competition'},
    name : String,
    votes : [{user_id:String,value:Number}],
    picture : String,
    date : {type:Date,default:Date.now}
});

photobomb.index({"user_id":1,"competition_id":1},{unique:true,sparse:true});

var vote = mongo.Schema({
    user_id : String,
    photobomb_id : {type:mongo.Schema.Types.ObjectId,ref:'Photobomb'},
    date : {type:Date,default:Date.now}
});

vote.index({"user_id":1,"photobomb_id":1},{unique:true});

User = db.model('User',user);
Competition = db.model('Competition',competition);
Photobomb = db.model('Photobomb',photobomb);
Vote = db.model('Vote',vote);



var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , photobombs = require('./routes/photobombs')
  , frontend = require('./routes/frontend')
  , http = require('http')
  , path = require('path');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/users', user.list);
app.get('/photobomb/:id', frontend.singe_photobomb);
app.get('/top/:page', frontend.top);
app.get('/recent/:page', frontend.recent);
app.get('/challenge/:id/:page', frontend.challenge)
app.post('/upload_picture',photobombs.uploadPicture);
app.post('/create_user',photobombs.createUser);
app.post('/place_vote',photobombs.vote);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
