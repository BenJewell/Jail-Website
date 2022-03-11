const express = require('express');
const {query} = require("../util/db");
const router = express.Router();
const auth = require("../middleware/auth");
const validate = require('express-jsonschema').validate;

router.get('/courses', auth.verifySessionAndRole("admin"), function (req, res, next) {
  query("select * from Courses, Sections where Courses.course_id = Sections.course_id", [], d => {
    let results = [];
    for (let data of d) {
      results.push(Object.values(data));
    }
    return res.send({data: results});
  });
});

router.get('/users', auth.verifySessionAndRole("admin"), function (req, res, next) {
  query("select `user_id`, `first_name`, `last_name`, `email_address`, `role` from Users", [], d => {
    let results = [];
    for (let data of d) {
      results.push(Object.values(data));
    }
    return res.send({data: results});
  });
});

router.get('/user/:id', auth.verifySessionAndRole("admin"), function (req, res, next) {
  query("select `user_id`, `first_name`, `last_name`, `email_address`, `role` from Users where user_id = ?", [req.params.id], d => {
    return res.send(d[0]);
  });
});

const UserSchema = {
  type: 'object',
  properties: {
    email_address: {
      type: 'string',
      required: true,
      format: 'email',
    },
    first_name: {
      type: 'string',
      required: true
    },
    last_name: {
      type: 'string',
      required: true
    },
    role: {
      type: 'string',
      required: true
    }
  }
};
router.post('/user/:id', auth.verifySessionAndRole("admin"), validate({body: UserSchema}), function (req, res, next) {
  query("update Users set first_name = ?, last_name = ?, role = ?, email_address = ? where user_id = ?", [
		req.body.first_name,
		req.body.last_name,
		req.body.role,
		req.body.email_address,
		req.params.id,
	], d => {
    return res.send({success: true});
  });
});

module.exports = router;
