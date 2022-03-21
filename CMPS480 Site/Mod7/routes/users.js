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


module.exports = router;
