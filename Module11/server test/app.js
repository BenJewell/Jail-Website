const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const mysql = require('mysql');

// parse application/json
app.use(bodyParser.json());

/*
var schedule = require('node-schedule');
var j = schedule.scheduleJob('30 * * * *', function(){
  console.log('The answer to life, the universe, and everything!');
});
*/

/*
  This scheduler is like a cron job that runs based on a date and time
*/
var schedule = require('node-schedule');
var year = 2022;
var month = 04; //0=Jan,1=Feb,2=Mar,3=Apr,4=May etc;
var day = 03; //day
var hour = 18;
var minute = 05;

var date = new Date(year, month, day, hour, minute, 0);

var j = schedule.scheduleJob(date, function(){
  console.log('Sent Notification');
  sendNotification(message);
});

//Function to send the notifications
var sendNotification = function(data) {

  var appid = "200745db-5727-45ca-8610-f4d28a07de33";
  var token = "MTAwYTE0N2MtNzIyYy00YzU4LTk0NDktY2VkYTdjNTVlZWVh";
  var headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Authorization": "Basic " + token

  };

  var options = {
    host: "onesignal.com",
    port: 443,
    path: "/api/v1/notifications",
    method: "POST",
    headers: headers
  };

  var https = require('https');
  var req = https.request(options, function(res) {
    res.on('data', function(data) {
      console.log("Response:");
      console.log(JSON.parse(data));
    });
  });

  req.on('error', function(e) {
    console.log("ERROR:");
    console.log(e);
  });

  req.write(JSON.stringify(data));
  req.end();
};

//Message that is sent to the users
var myappid = "200745db-5727-45ca-8610-f4d28a07de33";
var message = {
  app_id: myappid,
  contents: {"en": "Meow"},
  headings: {"en": "kitty kitty"},
  included_segments: ["All"]
};



//Server listening
app.listen(6002,() =>{
  console.log('Server started...');
});



sendNotification(message);