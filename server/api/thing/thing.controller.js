  /**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/things              ->  index
 * POST    /api/things              ->  create
 * GET     /api/things/:id          ->  show
 * PUT     /api/things/:id          ->  update
 * DELETE  /api/things/:id          ->  destroy
 */

'use strict';

import _ from 'lodash';
import Thing from './thing.model';
import Msg from '../message/message.model';
import Twit from 'twit';
import config from '../../config/environment';


var stream;
var tracks = [];
var trackdict = {};
/* var T = new Twit({
  consumer_key: '',
  consumer_secret: '',
  access_token: '',
  access_token_secret: '',
}); */
var exec = require('child_process').exec;
var path = require('path');
var fs = require('fs');




function respondWithResult(res, statusCode) {
  statusCode = statusCode || 200;
  return function(entity) {
    if (entity) {
      res.status(statusCode).json(entity);
    }
  };
}

function saveUpdates(updates) {
  return function(entity) {
    var updated = _.merge(entity, updates);
    return updated.save()
      .then(updated => {
        return updated;
      });
  };
}

function removeEntity(res) {
  return function(entity) {
    if (entity) {
      return entity.remove()
        .then(() => {
          res.status(204).end();
        });
    }
  };
}

function handleEntityNotFound(res) {
  return function(entity) {
    if (!entity) {
      res.status(404).end();
      return null;
    }
    return entity;
  };
}

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function(err) {
    res.status(statusCode).send(err);
  };
}

/* function reformat(tweet){
  var type_str = "";
  var tweet_reply_id="";
  var tweet_reply_user="";
  if (!(tweet.retweeted_status||tweet.in_reply_to_screen_name || tweet.in_reply_to_status_id || tweet.in_reply_to_user_id )) {
    type_str = "original";
  } else if (tweet.retweeted_status){
    type_str = "retweet";
    //console.log(tweet.retweeted_status.id_str, tweet.retweeted_status.user.id_str);
    tweet_reply_id=tweet.retweeted_status.id_str;
    tweet_reply_user=tweet.retweeted_status.user.id_str;
  } else{
    type_str = "reply";
    tweet_reply_id=tweet.in_reply_to_status_id;
    tweet_reply_user=tweet.in_reply_to_user_id;
  }
  var tempkeywords = [];
  var tempchannels = [];

  for (var index in trackdict){
    if (tweet.text.search(index)>=0){
      if (tempchannels.indexOf(index)<0){
        tempkeywords.push(index);
        tempchannels.push(trackdict[index].toString());
      }
    }
  }
  return {
    user_id : tweet.user.id_str,
    tweet_id: tweet.id_str,
    text : tweet.text,
    channels : tempchannels,
    keywords : tempkeywords,
    type: type_str,
    in_reply_to_tweet_id: tweet_reply_id,
    in_reply_to_user_id: tweet_reply_user,
    created_at: tweet.created_at,
    lang: tweet.lang,
    quoted_status_id: tweet.quoted_status_id_str,
    timeCollected: Date.now()
  };
}

function updateStream(req){


  var arr = req.body.keywords.toString().split(',');
  for (var keyword in arr) {
    tracks.push(arr[keyword]);
    //console.log(arr[keyword], req.body.name);

    trackdict[arr[keyword]] = req.body.name;
  }
  //console.log(JSON.stringify(tracks));
  stream = T.stream('statuses/filter', {track: tracks.toString()});


  stream.on('tweet', function(tweet) {
    var t = reformat(tweet);
    //console.log(t);
    Msg.create(t);
  });

  stream.on('limit', function(limitMsg){
    console.log(limitMsg, Date.now());
    stream.stop();

    //console.log();
    setTimeout(function(){
      stream.start();
    }, Date.now()-limitMsg.timestamp_ms);
  });

  stream.on('disconnect', function(){
    stream.stop();
    stream.start();
  });

  stream.on('error', function(error) {
    console.log(error);
    stream.stop();
    stream.start();
  });

}
*/
//Get a list of tweets based on the given search terms
function genMsgJson(terms ) {
  //Generate json
  Msg.find({"channels":[req.body.name]}, function (err, docs) {
    var inputjson = {
      "name": req.body.name,
      "keywords": req.body.keywords,
      "tweets": docs
    };
  });
}

// Gets a list of Things
export function index(req, res) {
  return Thing.find().exec()
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Gets a single Thing from the DB
export function show(req, res) {
  return Thing.findById(req.params.id).exec()
    .then(handleEntityNotFound(res))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

function retryForever(fn) {
  return fn().catch(function(err) {
    return retryForever(fn);
  });
}

// Creates a new Thing in the DB
export function create(req, res) {


  if(req.body.status ==="Active"){
    exec('python twitterstream.py ' + (new Date(req.body.end_at)).getTime() +
      " " + req.body.name + " " + req.body.keywords.join(" "),
      function(err, stdout, stderr) {
	       console.log('python stream', err, stdout, stderr)
      })

    var intTime;
    if (req.body.IntervalType==="Hrs"){
      intTime = 1000 * 3600 * req.body.intervalTime;
    }
    else if (req.body.IntervalType==="Min") {
      intTime = 1000 * 60 * req.body.intervalTime;
    }
    else if (req.body.IntervalType==="Sec") {
      intTime = 1000 * req.body.intervalTime;
    }


    //rcbmv6 calls on an interval for updates
    var interval = setInterval(function(){
      var time = Date.now();
      var curlevel = 1;

      //Generate json input for python matrix generator
      Msg.find({"channels":[req.body.name], created_at:  {'$gte': (new Date(req.body.created_at)).toISOString(), '$lt': (new Date(Date.now()).toISOString())}}, function (err, docs) {
        if (docs.length>2){
          var inputjson = {
            "name": req.body.name,
            "keywords": req.body.keywords,
            "tweets": docs
          };




          var inputFileName = req.body.name + Date.now().toString() + 'input.json';
          var outputFileName = req.body.name + Date.now().toString() + 'output.json';
          var level2input = req.body.name + Date.now().toString() + 'level2input.json';
          var command  = 'python3 dym_matrix_generator.py ' + inputFileName + ' ' + outputFileName;
          fs.writeFile(inputFileName, JSON.stringify(inputjson), function(){
            exec(command, function(error, stdout, stderr){ //run the python matrix generator
	      console.log(err, stdout, stderr)
              var outputExecFileName = req.body.name + Date.now().toString() + 'outputRCBM.json';
              exec('./rcbmv6 ' + outputFileName + ' ' + outputExecFileName + ' ' + level2input, function(error, stdout, stderr){ //+ ' ' +level2input
                if (error !== null) {
                  console.log('exec error: ', error);
                }
                console.log('loading JSON');
                fs.readFile(outputExecFileName, 'utf-8', function(err, data){
                  if (err){
                    console.log(err);
                  }
                  var stats = JSON.parse(data);
                  //console.log(JSON.stringify(stats));
                  console.log('stats logged at ' + Date.now().toString());
                  //var tempThing = Thing.find({created_at: req.body._id});
                  Thing.findOneAndUpdate({created_at: req.body.created_at}, {$push: {stats: {created_at: Date.now(), level: curlevel, data: stats}}}, {upsert: true},function(err){});

                  fs.unlink(inputFileName,function(err){console.log(err);});
                  fs.unlink(outputFileName, function(err){console.log(err);});
                  //fs.unlink(outputExecFileName, function(err){console.log(err);});


                   if (req.body.levels >1 ){
                        var nextInput = req.body.name + Date.now().toString() + 'level3input.json';
                        curlevel = 2;
                        var outputExecFileName = req.body.name + Date.now().toString() + 'level' + req.body.levels + 'outputRCBM.json';
                         exec('./rcbmv6 ' + level2input + ' ' + outputExecFileName +  ' ' + nextInput, function(error, stdout, stderr){ //run the RCBM
                           if (error !== null) {
                             console.log('exec error: ', error);
                           }
                           console.log('loading JSON');
                           fs.readFile(outputExecFileName, 'utf-8', function(err, data){
                             if (err){
                               console.log(err);
                             }
                             var stats = JSON.parse(data);
                             console.log(JSON.stringify(stats));
                             //var tempThing = Thing.find({_id: req.body._id});
                             Thing.findOneAndUpdate({created_at: req.body.created_at}, {$push: {stats: {created_at: Date.now(), level: curlevel, data: stats}}}, {upsert: true},function(err){});

                             fs.unlink(nextInput, function(err){console.log(err);});
                             fs.unlink(level2input, function(err){console.log(err);});
                             fs.unlink(outputExecFileName, function(err){console.log(err);});
                          });
                        });
                   }
                 });
              });
            });
          });
        }
      });
    }, intTime);

    //TIMEOUT
    setTimeout(function(){ //Timeout function to set thing inactive
      Thing.update({created_at: req.body.created_at}, {$set: {status: "Inactive"}}, {upsert: true},function(err){});
      console.log('Ending stat processing for ' + req.body.created_at);
      if (stream) {
        stream.stop();
      }
      var arr = req.body.keywords.toString().split();
      for (var id in arr){
        //console.log(arr[id], tracks[tracks.indexOf(arr[id])]);
        trackdict[arr[id]] = null;
        tracks.splice(tracks.indexOf(arr[id]),1);
        console.log(trackdict);
      }
      clearInterval(interval);

    }, (new Date(req.body.end_at)).getTime()-Date.now() ) ;
    //stream = T.stream('statuses/filter', {track: tracks.toString()});
    //return the new thing response
    return Thing.create(req.body)
      .then(respondWithResult(res, 201))
      .catch(handleError(res));
  } else if (req.body.status==="Historical") {
      var intTime;


        if (req.body.IntervalType=="Hrs"){
          intTime = 1000 * 3600 * req.body.intervalTime;
        }
        else if (req.body.IntervalType=="Min") {
          intTime = 1000 * 60 * req.body.intervalTime;
        }
        else if (req.body.IntervalType=="Sec") {
          intTime = 1000 * req.body.intervalTime;
        }


        for (var i= (new Date(req.body.created_at)).getTime(); i < (new Date(req.body.end_at)).getTime(); i= i + intTime){
          //Generate json
          Msg.find({"keywords":req.body.keywords, created_at:  {'$gte': (new Date(i)).toISOString(), '$lt': (new Date(i+intTime)).toISOString()}}, function (err, docs) {
            console.log(docs.length);
            if (docs.length>2){
              var inputjson = {
                "name": req.body.name,
                "keywords": req.body.keywords,
                "tweets": docs
              };
              var inputFileName = req.body.name + i.toString() + 'input.json';
              var outputFileName = req.body.name + i.toString() + 'output.json';
              var command  = 'python3 dym_matrix_generator.py ' + inputFileName + ' ' + outputFileName;
              var level2input = req.body.name + Date.now().toString() + 'level2input.json';


              fs.writeFile(inputFileName, JSON.stringify(inputjson), function(){
                exec(command, function(error, stdout, stderr){ //run the python matrix generator
                  var outputExecFileName = req.body.name + i.toString() + 'outputRCBM.json';
                  exec('./rcbmv6 ' + outputFileName + ' ' + outputExecFileName + ' ' + level2input, function(error, stdout, stderr){ //run the RCBM
                    if (error !== null) {
                      console.log('exec error: ', error);
                    }
                    console.log('loading JSON');
                    fs.readFile(outputExecFileName, 'utf-8', function(err, data){
                      if (err){
                        console.log(err);
                      }
                      var stats = JSON.parse(data);
                      //console.log(req.body);
                      Thing.findOneAndUpdate({created_at: req.body.created_at}, {$push: {stats: {created_at: i, level: 1, data: stats}}}, {upsert: true},function(err){});

                      //fs.unlink(inputFileName,function(err){console.log(err);});
                      //fs.unlink(outputFileName, function(err){console.log(err);});
                      //fs.unlink(outputExecFileName, function(err){console.log(err);});


                      if (req.body.levels >1 ){
                           var nextInput = req.body.name + Date.now().toString() + 'level3input.json';

                           var outputExecFileName = req.body.name + Date.now().toString() + 'level' + req.body.levels + 'outputRCBM.json';
                            exec('./rcbmv6 ' + level2input + ' ' + outputExecFileName +  ' ' + nextInput, function(error, stdout, stderr){ //run the RCBM
                              if (error !== null) {
                                console.log('exec error: ', error);
                              }
                              console.log('loading JSON');
                              fs.readFile(outputExecFileName, 'utf-8', function(err, data){
                                if (err){
                                  console.log(err);
                                }
                                var stats = JSON.parse(data);
                                console.log(JSON.stringify(stats));
                                return Thing.findOneAndUpdate({created_at: req.body.created_at}, {$push: {stats: {created_at: Date.now(), level: 2, data: stats}}}, {upsert: true},function(err){if (err){console.log(err);}});
                             });
                           });
                      }
                    });
                  });
                });
              });
            }
           });
      }
  }

}


function loadJSON(filename, callback) {

  fs.readFile(filename, callback);
}

//Emits a message for the new tweet
export function respond(socket){

  //socket.emit('tweet')
}

// Updates an existing Thing in the DB
export function update(req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  return Thing.findById(req.params.id).exec()
    .then(handleEntityNotFound(res))
    .then(saveUpdates(req.body))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Deletes a Thing from the DB
export function destroy(req, res) {
  return Thing.findById(req.params.id).exec()
  .then(handleEntityNotFound(res))
  .then(function (res) {

    if (stream) {
      stream.stop();
    }
    var arr = res.keywords.toString().split();
    for (var id in arr){
      //console.log(arr[id], tracks[tracks.indexOf(arr[id])]);
      trackdict[arr[id]] = null;
      tracks.splice(tracks.indexOf(arr[id]),1);
      //console.log(trackdict);
    }
    stream = T.stream('statuses/filter', {track: tracks.toString()});

    return res;
  }).then(removeEntity(res))
  .then(respondWithResult(res))
  .catch(handleError(res));
}
