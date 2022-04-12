const express = require('express');
const {query, log_action} = require("../util/db");
const router = express.Router();
const auth = require("../middleware/auth");
const validate = require('express-jsonschema').validate;

// more complex and/or long queries
// stored here for readability
const STUDENT_GET_SECTIONS_QUERY = `
    select s.section_id,
           s.*,
           concat(u.first_name, ' ', u.last_name) as instructor_name
    from Sections s,
         Section_Registrations sr,
         Users u
    where sr.student_id = ?
      and u.user_id = s.instructor_id
      and s.section_id = sr.section_id
`;
const STUDENT_GET_GRADES_QUERY = `
    select Courses.course_id,
           Courses.name                                                     as course_name,
           Courses.primary_code,
           Courses.secondary_code,
           (sum(Grades.points_received) / sum(Assignments.points_possible)) as total_grade
    from Assignments,
         Grades,
         Courses
    where student_id = ?
      and Assignments.assignment_id = Grades.assignment_id
      and Courses.course_id = Assignments.course_id
      and Grades.points_received is not null
      and Grades.active = 1
    group by Courses.course_id
`;


// For actions log
router.get('/actions', auth.verifySessionAndRole("admin"), function (req, res, next) {
  query(`select Actions_Log.message, DATE_FORMAT(Actions_Log.action_date, '%m/%d/%y %h:%i %p')
  AS formatted_date FROM Actions_Log
  ORDER BY Actions_Log.action_date DESC;`, [], d => {
    return res.send(d);
  });
});

// GET settings, no auth required (used on login page and everywhere else)
router.get('/settings', function (req, res, next) {
  query("select * from Settings", [], d => {
    return res.send(d);
  });
});

router.put('/settings', auth.verifySessionAndRole("admin"), function (req, res, next) {
  let vals = [];
  for (let setting of req.body.settings) {
    vals.push(setting.key, setting.value);
  }

  query(
      `insert into Settings
       values ${("(?, ?),".repeat(req.body.settings.length)).slice(0, -1)} on duplicate key
      update value =
      VALUES (value)`,
      vals, d => {
        return res.send(d);
      });
});

// get list of all courses
router.get('/courses', auth.verifySessionAndRole("admin"), function (req, res, next) {
  query("select Courses.*, Sections.*, CONCAT(Users.first_name, ' ', Users.last_name) as `instructor` from Courses, Sections, Users where Courses.course_id = Sections.course_id and Users.user_id = Sections.instructor_id", [], d => {
    return res.send({data: d});
  });
});

// get list of all users for admin users table
router.get('/users', auth.verifySessionAndRole("admin"), function (req, res, next) {
  query("select `user_id`, `first_name`, `last_name`, `email_address`, `role` from Users", [], d => {
    let results = [];
    for (let data of d) {
      results.push(Object.values(data));
    }
    return res.send({data: results});
  });
});

// not sure exactly what this one does
router.get('/section/:id', auth.verifySessionAndRole("admin"), function (req, res, next) {
  query("select Sections.*, CONCAT(Users.first_name, ' ', Users.last_name) as `instructor` from Sections, Users where section_id = ? and Users.user_id = Sections.instructor_id", [req.params.id], section => {
    if (!section.length) {
      return res.send({ success: false });
    }
    query("select * from Courses where course_id = ?", [section[0].course_id], course => {
      if (!course.length) {
        return res.send({ success: false });
      }
      return res.send({
        section: section[0],
        course: course[0]
      });
    });
  });
});

// get the students registered for a section
router.get('/section/:id/students', auth.verifySessionAndRole("admin"), function (req, res, next) {
  query("select Section_Registrations.*, Users.first_name, Users.last_name, Users.email_address from Section_Registrations, Users where section_id = ? and Users.user_id = Section_Registrations.student_id", [req.params.id], students => {
    if (!students.length) {
      return res.send({data: []});
    }
    return res.send({ data: students })
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

// For admin adding a student to a section
router.post('/section/:id/students', auth.verifySessionAndRole("admin"), validate({ body: RegisterStudentSchema }), function (req, res, next) {
  query("insert into Section_Registrations values (?, ?)", [
    req.params.id,
    req.body.student_id, // This should be snake case so it matches he delete one below.
  ], (data, error) => {
    if (!data && error.code === "ER_DUP_ENTRY") {
      return res.send({ success: false, message: "Student is already enrolled in course section." })
    }
    query("Select first_name, last_name from Users where user_id = ?", [res.locals.userId], (teacherData, error) => {
      query("Select first_name, last_name from Users where user_id = ?", [req.body.student_id], (studentData, error) => {
        query("Select course_id, section_code from Sections where section_id = ?", [req.params.id], (sectionData, error) => {
          log_action(`${teacherData[0].first_name} ${teacherData[0].last_name} added student ${studentData[0].first_name}
          ${studentData[0].last_name} (${req.body.student_id}) to section ${sectionData[0].course_id} ${sectionData[0].section_code}`)
          return res.send({ success: true });
        })
      })
      //log_action(res.locals.userId, `added student id ${req.body.student_id} to`, req.params.id, "Section_Registrations")
    });
  });
});

// For admin removing a student from a section
router.delete('/section/:id/students/:studentId', auth.verifySessionAndRole("admin"), function (req, res, next) {
  query("delete from Section_Registrations where section_id = ? and student_id = ?", [
    req.params.id,
    req.params.studentId,
  ], _ => {
  });
  query("Select first_name, last_name from Users where user_id = ?", [res.locals.userId], (teacherData, error) => {
    query("Select first_name, last_name from Users where user_id = ?", [req.params.studentId], (studentData, error) => {
      query("Select course_id, section_code from Sections where section_id = ?", [req.params.id], (sectionData, error) => {
        log_action(`${teacherData[0].first_name} ${teacherData[0].last_name} removed student ${studentData[0].first_name}
        ${studentData[0].last_name}(${req.params.studentId}) from section ${sectionData[0].course_id} ${sectionData[0].section_code}`)
        return res.send({ success: true });
      })
    })
    //log_action(res.locals.userId, `added student id ${req.body.student_id} to`, req.params.id, "Section_Registrations")
  });
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
// For an admin modifying course info
router.put('/course/:id', auth.verifySessionAndRole("admin"), validate({ body: CourseUpdateSchema }), function (req, res, next) {
  query("update Courses set name = ?, description = ?, primary_code = ?, secondary_code = ? where course_id = ?", [
    req.body.name,
    req.body.description,
    req.body.primary_code,
    req.body.secondary_code,
    req.params.id,
  ], (data, error) => {
  }); // Not really sure why these brackets need to be here like this
  query("Select first_name, last_name from Users where user_id = ?", [res.locals.userId], (teacherData, error) => {
    log_action(`${teacherData[0].first_name} ${teacherData[0].last_name} updated information for course
      ${req.body.name} (${req.body.primary_code} ${req.body.secondary_code})`)
    return res.send({ success: true });
  })
});
//log_action(res.locals.userId, `added student id ${req.body.student_id} to`, req.params.id, "Section_Registrations")

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

// Updating info on a section
router.put('/section/:id', auth.verifySessionAndRole("admin"), validate({ body: SectionUpdateSchema }), function (req, res, next) {
  query("update Sections set instructor_id = ?, section_code = ? where section_id = ?", [
    req.body.instructor_id,
    req.body.section_code,
    req.params.id,
  ], (data, error) => {
  });
  query("Select first_name, last_name from Users where user_id = ?", [res.locals.userId], (teacherData, error) => {
      query("Select course_id, section_code from Sections where section_id = ?", [req.params.id], (sectionData, error) => {
        log_action(`${teacherData[0].first_name} ${teacherData[0].last_name} updated info for ${req.body.section_code}
        (${req.params.id})`)
        return res.send({ success: true });
      })
    })
  });

router.get('/search/:role', auth.verifySessionAndRole("admin"), function (req, res, next) {
  query("select Users.user_id as `id`, CONCAT(Users.first_name, ' ', Users.last_name) as `text` from Users where role = ? and (concat(`first_name`, ' ', `last_name`) like ? or `email_address` like ? or user_id = ?)", [req.params.role, `%${req.query.q}%`, `%${req.query.q}%`, req.query.q], users => {
    return res.send({ items: users })
  });
});

router.get('/user/:id', auth.verifySessionAndRole("admin"), function (req, res, next) {
  query("select `user_id`, `first_name`, `last_name`, `email_address`, `role` from Users where user_id = ?", [req.params.id], d => {
    if (!d.length) {
      return res.send({ success: false, message: "User not found" });
    }
    let user = d[0];

    // if user is a student, fetch their sections + grades
    if (user.role === "student") {
      query(STUDENT_GET_SECTIONS_QUERY, [req.params.id], sections => {
        query(STUDENT_GET_GRADES_QUERY, [req.params.id], grades => {
          let courses = {};
          sections.map((data) => courses[data.course_id] = data);

          for (let grade of grades)
              // skip if no longer enrolled in this course
            if (courses[grade.course_id] !== undefined)
              courses[grade.course_id] = {...courses[grade.course_id], ...grade};

          return res.send({...user, courses: Object.values(courses)});
        });
      });
    } else
      return res.send(user);
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
    log_action(res.locals.userId, `modified user id ${req.body.userId}`, req.params.id, "Users")
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
    query("insert into Users values (null, ?, ?, null, ?, ?, sha1(?), sha1(concat(now(), user_id, first_name, null)))",
        [
          req.body.first_name,
          req.body.last_name,
          req.body.email_address,
          req.body.role,
          req.body.password
        ],
        (data) => {
          log_action(res.locals.userId, `created user id ${req.body.student_id}`, req.params.user_id, "Section_Registrations")
          return res.send({success: true, id: data.insertId})
        });
  });
});


module.exports = router;
