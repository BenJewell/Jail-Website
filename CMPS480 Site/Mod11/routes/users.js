const express = require('express');
const {query, log_action} = require("../util/db");
const router = express.Router();
const validate = require('express-jsonschema').validate;
const auth = require("../middleware/auth");

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
      log_action(res.locals.userId, `failed to login to the system ${req.body.student_id}`, req.params.id, "Users")
      return res.send({success: false});
    }
    query("update `Users` set `session_key` = ? where `user_id` = ?", [data[0].key, data[0].id], () => {
    });
    log_action(res.locals.userId, `logged into the system succesfully ${req.body.student_id}`, req.params.id, "Users")
    return res.send({success: true, ...data[0]});
  });
});

const SettingsSchema = {
  type: 'object',
  properties: {
    email_address: {
      type: 'string',
      required: true,
      format: 'email',
    },
    phone_number: {
      type: 'string',
      required: true,
    },
    old_password: {
      type: 'string',
      required: false
    },
    new_password: {
      type: 'string',
      required: false
    }
  }
};

router.get('/settings', auth.verifySession(), function (req, res, next) {
  query("select email_address, phone_number from Users where user_id = ?", [res.locals.userId], d => {
    return res.send(d[0]);
  });
});

router.put('/settings', validate({body: SettingsSchema}), auth.verifySession(), function (req, res, next) {

  query("update Users set email_address = ?, phone_number = ? where user_id = ?", [req.body.email_address, req.body.phone_number, res.locals.userId], _ => {
    if (req.body.new_password !== "") {
      // update password by checking user_id + old password in query
      query("update Users set password = sha1(?) where user_id = ? and password = sha1(?)", [
        req.body.new_password,
        res.locals.userId,
        req.body.old_password,
      ], _ => {
        return res.send({success: true})
      })
    } else {
      return res.send({success: true})
    }
  });
});


module.exports = router;
