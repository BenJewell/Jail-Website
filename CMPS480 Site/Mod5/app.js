const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const usersRouter = require('./routes/users');
const teacherRouter = require('./routes/teacher');
const path = require("path");

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/users', usersRouter);
app.use('/teacher', teacherRouter);

app.use(function (err, req, res, next) {
  console.log(err);
  res.status(err.status || 500);
  res.json({error: err});
});

module.exports = app;
