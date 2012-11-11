
/**
 * Module dependencies.
 */

Prelude = require('prelude-ls');

mongo = require('mongoose');
db = mongo.createConnection('localhost','surpris3');
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

photobomb.index({"competition_id":1});

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
var partials = require('express-partials');

app.configure(function(){
  app.set('port', process.env.PORT || 4000);
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
//app.use(partials());

app.get('/', frontend.top);
app.get('/users', user.list);
app.get('/photobomb/:id', frontend.single_photobomb);
app.get('/top', frontend.top);
app.get('/top/:page', frontend.top);
app.get('/recent', frontend.recent);
app.get('/recent/:page', frontend.recent);
app.get('/challenge',frontend.getCurrentChallenge);
app.get('/challenge/:page',frontend.getCurrentChallenge);
app.get('/challenge/:id/:page', frontend.challenge)
app.post('/upload_picture',photobombs.uploadPicture);
app.post('/create_user',photobombs.createUser);
app.post('/place_vote',photobombs.vote);
app.post('/create_competition',photobombs.addCompetition);
app.get('/list',photobombs.photobombs);
app.get('/votes/:user_id',photobombs.getMyVotes);
app.get('/score/:user_id',photobombs.getUserScore);
app.get('/pb_img/:photobomb_id',photobombs.getImage);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
