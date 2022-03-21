const express = require('express');
const {query} = require("../util/db");
const router = express.Router();
const validate = require('express-jsonschema').validate;

const LoginSchema = {
  type: 'object',
  properties: {
    email: {
      type: 'string',
      required: true,
      format: 'email',
    },
    password: {
      type: 'string',
      required: true
    }
  }
};

router.post('/login', validate({body: LoginSchema}), function (req, res, next) {
  query("select `user_id` as `id`, `first_name` as `name`, `role`, sha1(concat(now(), `user_id`, `first_name`)) as `key` from `Users` where `email_address` = ? and `password` = SHA1(?)", [
    req.body.email,
    req.body.password
  ], data => {
    if (!data || !data.length) {
      return res.send({success: false});
    }
    query("update `Users` set `session_key` = ? where `user_id` = ?", [data[0].key, data[0].id], () => {
    });
    return res.send({success: true, ...data[0]});
  });
});

const SignUpSchema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      required: true,
    },
    email: {
      type: 'string',
      required: true,
      format: 'email',
    },
    password: {
      type: 'string',
      required: true
    }
  }
};

/*
 /signup
 step 1: check for existing user under that email address
 step 2: insert user into users table
 step 3: select user to get their info and key to log them in on the frontend
 */
router.post('/signup', validate({body: SignUpSchema}), function (req, res, next) {
  // step 1
  query("select id from Users where email_address = ?", [
    req.body.email,
  ], data => {
    if (data.length !== 0) {
      // account with email already exists
      return res.send({success: false, error: "Account already exists"});
    }
    let name = req.body.name.split(" ");
    // step 2
    query("insert into Users values (null, ?, ?, null, ?, 'student', sha1(?), sha1(concat(now(), id, first_name)))",
        [
          name[0],
          name[1],
          req.body.email,
          req.body.password
        ],
        (data) => {
          // step 3
          query("sha1(concat(now(), id, first_name)) as key from Users where id = ?", [
            data.insertId
          ], data => {
            if (!data || !data.length) {
              return res.send({success: false});
            }
            return res.send({success: true, ...data[0]});
          });
        });
  });
});

module.exports = router;
