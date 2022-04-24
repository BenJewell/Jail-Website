const express = require('express');
const { query, log_action } = require("../util/db");
const router = express.Router();
const auth = require("../middleware/auth");
const validate = require('express-jsonschema').validate;


//Side Nav
router.get('/courses', auth.verifySessionAndRole("student"), function (req, res, next) {
  query("SELECT * FROM Sections, Courses WHERE section_id IN (SELECT section_id FROM Section_Registrations WHERE student_id = ?) AND Courses.course_id = Sections.course_id ORDER BY Courses.name;", [res.locals.userId], d => {
    return res.send(d);
  });
});

//Gradebook Queries
router.get('/grades/:id', auth.verifySessionAndRole("student"), function (req, res, next) {
  query(`SELECT Grades.grades_id,
                Assignments.assignment_category,
                Assignments.name,
                Grades.points_received,
                Assignments.points_possible,
                DATE_FORMAT(Assignments.due_date, '%m/%d/%y %h:%i %p') AS due_date,
                Grades.missing,
                Grades.instructor_notes,
                Grades.flagged_for_audit
         FROM Assignments,
              Grades
         WHERE Assignments.assignment_id = Grades.assignment_id
           AND Assignments.section_id = ?
           AND Grades.student_id = ?
         ORDER BY assignment_category, due_date DESC, name;`, [req.params.id, res.locals.userId], table => {
    query("SELECT (SUM(Grades.points_received)/SUM(Assignments.points_possible)) AS total_grade FROM Assignments, Grades WHERE Assignments.assignment_id = Grades.assignment_id AND Assignments.section_id = ? AND Grades.student_id = ? AND Grades.points_received IS NOT NULL", [req.params.id, res.locals.userId], totalGrade => {
      query("SELECT Courses.name FROM Courses WHERE course_id = ?", [req.params.id, res.locals.userId], name => {
        query("SELECT Users.first_name, Users.last_name, Users.email_address, Users.phone_number FROM Sections, Users WHERE course_id = ? AND Sections.instructor_id = Users.user_id;", [req.params.id], teacher => {
          query("SELECT attendance_id, DATE_FORMAT(date, '%m/%d/%y') as date FROM Attendance_Meetings WHERE section_id = ? ORDER BY date;", [req.params.id], meetings => {
            query("SELECT Attendance_Records.attendance_id FROM Attendance_Records, Attendance_Meetings WHERE Attendance_Records.attendance_id = Attendance_Meetings.attendance_id AND section_id = ? AND user_id = ?;", [req.params.id, res.locals.userId], records => {
              return res.send({ ...totalGrade[0], table: table, name: name[0], teacher: teacher, meetings: meetings, records: records });
            });
          });
        });
      });
    });
  });
});
//Overview Table
router.get('/dashboard/overview', auth.verifySessionAndRole("student"), function (req, res, next) {
  query(`SELECT Courses.course_id, Courses.name AS course_name, (SUM(Grades.points_received)/SUM(Assignments.points_possible)) AS total_grade 
            FROM Assignments, Grades, Sections, Courses 
            WHERE student_id = ? AND Assignments.assignment_id = Grades.assignment_id AND Sections.section_id = Assignments.section_id 
            AND Sections.course_id = Courses.course_id AND Grades.points_received IS NOT NULL 
            GROUP BY course_id 
            ORDER BY course_name;`, [res.locals.userId], d => {
    return res.send(d);
  });
});
//Recent Table
router.get('/dashboard/recent', auth.verifySessionAndRole("student"), function (req, res, next) {
  query(`SELECT Courses.course_id, Courses.name AS course_name, Assignments.name AS assignment_name, Grades.points_received, Assignments.points_possible 
            FROM Assignments, Grades, Sections, Courses 
            WHERE student_id = ? AND Assignments.assignment_id = Grades.assignment_id AND Sections.section_id = Assignments.section_id 
            AND Courses.course_id = Sections.course_id AND Grades.date_graded > (now() - interval 1 week) 
            ORDER BY Grades.date_graded DESC;`, [res.locals.userId], d => {
    return res.send(d);
  });
});
//Missing Table
router.get('/dashboard/missing', auth.verifySessionAndRole("student"), function (req, res, next) {
  query(`SELECT Courses.course_id, Courses.name AS course_name, Assignments.name AS assignment_name, DATE_FORMAT(Assignments.due_date, '%m/%d/%y %h:%i %p') AS due_date 
            FROM Assignments, Grades, Sections, Courses 
            WHERE student_id = ? AND Assignments.assignment_id = Grades.assignment_id AND Sections.section_id = Assignments.section_id 
            AND Courses.course_id = Sections.course_id AND Grades.missing = 1 
            ORDER BY Assignments.due_date DESC;`, [res.locals.userId], d => {
    return res.send(d);
  });
});
//Upcoming Table
router.get('/dashboard/upcoming', auth.verifySessionAndRole("student"), function (req, res, next) {
  query(`SELECT Courses.course_id, Courses.name AS course_name, Assignments.name AS assignment_name, DATE_FORMAT(Assignments.due_date, '%m/%d/%y %h:%i %p') AS due_date 
            FROM Assignments, Grades, Sections, Courses 
            WHERE student_id = ? AND Assignments.assignment_id = Grades.assignment_id AND Sections.section_id = Assignments.section_id 
            AND Courses.course_id = Sections.course_id AND Grades.active = 1 AND Assignments.due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY) 
            ORDER BY Assignments.due_date DESC;
  `, [res.locals.userId], d => {
    return res.send(d);
  });
});
//Assignment Calendar
router.get('/calendar', auth.verifySessionAndRole("student"), function (req, res, next) {
  query(`SELECT Courses.course_id, Courses.name AS course_name, Assignments.name AS assignment_name, DATE_FORMAT(Assignments.due_date, '%m/%d/%y') as due_date, DATE_FORMAT(Assignments.due_date, '%h:%i %p') as due_time 
          FROM Assignments, Sections, Courses, Section_Registrations
          WHERE student_id = ?
          AND Sections.section_id = Assignments.section_id = Section_Registrations.section_id
          AND Courses.course_id = Sections.course_id 
          AND Assignments.due_date > now() 
          ORDER BY Assignments.due_date, Assignments.name;
  `, [res.locals.userId], table => {
    return res.send(table);
  });
});

const AuditSchema = {
  type: 'object',
  properties: {
    grades_id: {
      type: 'integer',
      required: true,
    },
    subject: {
      type: 'string',
      required: true,
    },
    message: {
      type: 'string',
      required: true,
    }
  }
};

router.post('/audit', validate({ body: AuditSchema }), auth.verifySessionAndRole("student"), function (req, res, next) {
  query("UPDATE Grades SET flagged_for_audit = 1 WHERE grades_id = ? AND student_id = ?;",
    [
      req.body.grades_id,
      res.locals.userId
    ],
    (data) => {
      query("insert into Messages (sender_id, recipient_id, date, updated_at, subject, message, sender_is_read) values (?, (SELECT Sections.instructor_id FROM Grades, Assignments, Sections WHERE grades_id = ? AND Grades.assignment_id = Assignments.assignment_id AND Assignments.section_id = Sections.section_id), NOW(), NOW(), ?, ?, 0)", [
        res.locals.userId, req.body.grades_id, req.body.subject, req.body.message
      ], data => {
        query("Select first_name, last_name from Users where user_id = ?", [res.locals.userId], (userData, error) => {
          query("Select assignment_id from Grades where grades_id = ?", [req.body.grades_id], (gradesData, error) => {
            query("Select name, section_id from Assignments where assignment_id = ?", [gradesData[0].assignment_id], (assignmentData, error) => {
              query("Select section_code, course_id from Sections where section_id = ?", [assignmentData[0].section_id], (sectionData, error) => {
                query("Select name, primary_code, secondary_code from Courses where course_id = ?", [sectionData[0].course_id], (courseData, error) => {
                  log_action(`Student ${userData[0].first_name} ${userData[0].last_name} submitted an audit request for ${assignmentData[0].name}
                  in section ${sectionData[0].section_code} of course ${courseData[0].name}`)
                  return res.send({ success: true, id: data.insertId })
                });
              });
            });
          });
        });
      });
    });
});

const MessageSchema = {
  type: 'object',
  properties: {
    section_id: {
      type: 'integer',
      required: true,
    },
    subject: {
      type: 'string',
      required: true,
    },
    message: {
      type: 'string',
      required: true,
    }
  }
};

router.post('/message', validate({ body: MessageSchema }), auth.verifySessionAndRole("student"), function (req, res, next) {
  query("insert into Messages (sender_id, recipient_id, date, updated_at, subject, message, sender_is_read) values (?, (SELECT instructor_id FROM Sections WHERE section_id = ?), NOW(), NOW(), ?, ?, 1)", [
    res.locals.userId, req.body.section_id, req.body.subject, req.body.message
  ], message => {
    return res.send({ success: true, id: message.insertId });
  });
});


module.exports = router;
