const express = require('express');
const {query} = require("../util/db");
const router = express.Router();
const auth = require("../middleware/auth");
const validate = require('express-jsonschema').validate;

router.get('/courses', auth.verifySessionAndRole("admin"), function (req, res, next) {
  query("select Courses.*, Sections.*, CONCAT(Users.first_name, ' ', Users.last_name) as `instructor` from Courses, Sections, Users where Courses.course_id = Sections.course_id and Users.user_id = Sections.instructor_id", [], d => {
    return res.send({data: d});
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

router.get('/section/:id', auth.verifySessionAndRole("admin"), function (req, res, next) {
  query("select Sections.*, CONCAT(Users.first_name, ' ', Users.last_name) as `instructor` from Sections, Users where section_id = ? and Users.user_id = Sections.instructor_id", [req.params.id], section => {
    if (!section.length) {
      return res.send({success: false});
    }
    query("select * from Courses where course_id = ?", [section[0].course_id], course => {
      if (!course.length) {
        return res.send({success: false});
      }
      return res.send({
        section: section[0],
        course: course[0]
      });
    });
  });
});

router.get('/section/:id/students', auth.verifySessionAndRole("admin"), function (req, res, next) {
  query("select Section_Registrations.*, Users.first_name, Users.last_name, Users.email_address from Section_Registrations, Users where section_id = ? and Users.user_id = Section_Registrations.student_id", [req.params.id], students => {
    if (!students.length) {
      return res.send({data: []});
    }
    return res.send({data: students})
  });
});


const RegisterStudentSchema = {
  type: 'object',
  properties: {
    student_id: {
      type: 'number',
      required: true,
    }
  }
};
router.post('/section/:id/students', auth.verifySessionAndRole("admin"), validate({body: RegisterStudentSchema}), function (req, res, next) {
  query("insert into Section_Registrations values (?, ?)", [
    req.params.id,
    req.body.student_id,
  ], (data, error) => {
    if (!data && error.code === "ER_DUP_ENTRY") {
      return res.send({success: false, message: "Student is already enrolled in course section."})
    }
    return res.send({success: true});
  });
});

router.delete('/section/:id/students/:studentId', auth.verifySessionAndRole("admin"), function (req, res, next) {
  query("delete from Section_Registrations where section_id = ? and student_id = ?", [
    req.params.id,
    req.params.studentId,
  ], _ => {
  });
  return res.send({success: true});
});


const CourseUpdateSchema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      required: true,
    },
    description: {
      type: 'string',
      required: true,
    },
    primary_code: {
      type: 'string',
      required: true,
    },
    secondary_code: {
      type: 'string',
      required: true,
    }
  }
};
router.put('/course/:id', auth.verifySessionAndRole("admin"), validate({body: CourseUpdateSchema}), function (req, res, next) {
  query("update Courses set name = ?, description = ?, primary_code = ?, secondary_code = ? where course_id = ?", [
    req.body.name,
    req.body.description,
    req.body.primary_code,
    req.body.secondary_code,
    req.params.id,
  ], (data, error) => {
    return res.send({success: true});
  });
});

const SectionUpdateSchema = {
  type: 'object',
  properties: {
    instructor_id: {
      type: 'number',
      required: true,
    },
    section_code: {
      type: 'string',
      required: true,
    },
  }
};
router.put('/section/:id', auth.verifySessionAndRole("admin"), validate({body: SectionUpdateSchema}), function (req, res, next) {
  query("update Sections set instructor_id = ?, section_code = ? where section_id = ?", [
    req.body.instructor_id,
    req.body.section_code,
    req.params.id,
  ], (data, error) => {
    return res.send({success: true});
  });
});

router.get('/search/:role', auth.verifySessionAndRole("admin"), function (req, res, next) {
  query("select Users.user_id as `id`, CONCAT(Users.first_name, ' ', Users.last_name) as `text` from Users where role = ? and (concat(`first_name`, ' ', `last_name`) like ? or `email_address` like ? or user_id = ?)", [req.params.role, `%${req.query.q}%`, `%${req.query.q}%`, req.query.q], users => {
    return res.send({items: users})
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
router.put('/user/:id', auth.verifySessionAndRole("admin"), validate({body: UserSchema}), function (req, res, next) {
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

const SignUpSchema = {
  type: 'object',
  properties: {
    first_name: {
      type: 'string',
      required: true,
    },
    last_name: {
      type: 'string',
      required: true,
    },
    role: {
      type: 'string',
      required: true,
    },
    email_address: {
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
 */
router.post('/users', validate({body: SignUpSchema}), function (req, res, next) {
  // step 1
  query("select user_id from Users where email_address = ?", [
    req.body.email_address,
  ], data => {
    if (data.length !== 0) {
      // account with email already exists
      return res.send({success: false, message: "Account already exists with this email address"});
    }
    // step 2
    query("insert into Users values (null, ?, ?, null, ?, ?, sha1(?), sha1(concat(now(), user_id, first_name)))",
        [
          req.body.first_name,
          req.body.last_name,
          req.body.email_address,
          req.body.role,
          req.body.password
        ],
        (data) => {
          return res.send({success: true, id: data.insertId})
        });
  });
});


module.exports = router;
