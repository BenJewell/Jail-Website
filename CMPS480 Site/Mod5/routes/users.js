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
  query("select `ID` as `id`, `NAME` as `name`, `User Role` as `role`, sha1(concat(now(), `ID`, `NAME`)) as `key` from `USERS` where `Email Address` = ? and `password` = SHA1(?)", [
    req.body.email,
    req.body.password
  ], data => {
    if (!data || !data.length) {
      return res.send({success: false});
    }
    query("update `USERS` set `sessionKey` = ? where `ID` = ?", [data[0].key, data[0].id], () => {
    });
    return res.send({success: true, ...data[0]});
  });
});

module.exports = router;
