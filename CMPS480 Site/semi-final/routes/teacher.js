const express = require('express');
const { query, log_action } = require("../util/db");
const router = express.Router();
const auth = require("../middleware/auth");
const validate = require('express-jsonschema').validate;


router.get('/courses', auth.verifySessionAndRole("teacher"), function (req, res, next) {
  query("select * from Sections, Courses where instructor_id = ? and Courses.course_id = Sections.course_id", [res.locals.userId], d => {
    return res.send(d);
  });
});

router.get('/homepage', auth.verifySessionAndRole("teacher"), function (req, res, next) {
  query(`SELECT Sections.section_id, Courses.name, Courses.primary_code, Courses.secondary_code, Sections.section_code, COUNT(Section_Registrations.student_id) as student_count
	          FROM Sections
            INNER JOIN Courses ON Courses.course_id = Sections.course_id
            INNER JOIN Section_Registrations ON Sections.section_id = Section_Registrations.section_id
            WHERE instructor_id = ?
            GROUP BY section_id
            ORDER BY section_id;`, [res.locals.userId], courses => {
    query(`SELECT Sections.section_id, (COUNT(*) - COUNT(points_received)) as pending
              FROM Sections
              INNER JOIN Assignments ON Sections.section_id = Assignments.section_id
              INNER JOIN Grades ON Assignments.assignment_id = Grades.assignment_id
              WHERE instructor_id = ?
              GROUP BY section_id
              ORDER BY section_id;`, [res.locals.userId], ungraded => {
      return res.send({ courses: courses, ungraded: ungraded });
    });
  });
});

router.get('/course/:id', auth.verifySessionAndRole("teacher"), function (req, res, next) {
  // It seems res.locals.userId is the user ID that is in use, and req.params.id is the course ID we are getting the student list for. Having trouble reverse enginering this part.
  //console.log("user id: " + res.locals.userId);
  //console.log('id: ' + req.params.id);

  if (req.params.id == false || res.locals.userId == false) {
    // Prevents hard crash if user ID or course ID requested do not exist.
    return res.status(500).send("Invalid User or Course ID!") // Can't this this text to appear on the front end, but not a big deal.
  }

  query("select * from Sections, Courses where instructor_id = ? and Sections.course_id = ? and Courses.course_id = Sections.course_id", [res.locals.userId, req.params.id], section => {
    query("select Section_Registrations.*, Users.user_id, Users.first_name, Users.last_name, (SUM(Grades.points_received)/SUM(Assignments.points_possible)) AS total_grade from Section_Registrations, Users, Assignments, Grades where Assignments.section_id = ? and Section_Registrations.student_id = Grades.student_id and Users.user_id = Section_Registrations.student_id and Assignments.assignment_id = Grades.assignment_id and Grades.points_received IS NOT NULL GROUP BY Grades.student_id ORDER BY Grades.student_id;",
      [section[0]["section_id"]], students => {
        query(`SELECT Grades.student_id, COALESCE(SUM(Grades.flagged_for_audit)) AS total_audits
                  FROM Assignments, Grades 
                  WHERE Assignments.section_id = ?
                  AND Assignments.assignment_id = Grades.assignment_id
                  GROUP BY Grades.student_id
                  ORDER BY Grades.student_id;`, [req.params.id], audits => {
          return res.send({ ...section[0], students: students, audits: audits });
        });
      });
  });
});

router.get('/student/:studentId/:courseId', auth.verifySessionAndRole("teacher"), function (req, res, next) {
  query("select *, DATE_FORMAT(Assignments.due_date, '%m/%d/%y %h:%i %p') AS formatted_due_date from Grades, Assignments where Assignments.section_id = ? and Grades.student_id = ? and Grades.assignment_id = Assignments.assignment_id;", [req.params.courseId, req.params.studentId], grades => {
    query("select Users.user_id, Users.first_name, Users.last_name from Users where Users.user_id = ?", [req.params.studentId], student => {
      return res.send({ ...student[0], grades: grades });
    });
  });
});

router.get('/assignments/:id', auth.verifySessionAndRole("teacher"), function (req, res, next) {
  query(`SELECT Assignments.assignment_category, Assignments.name, Assignments.description, DATE_FORMAT(Assignments.due_date, '%m/%d/%y %h:%i %p') AS formatted_due_date, count(Grades.points_received) as assignments_graded, count(Section_Registrations.student_id) as students_count 
            FROM Grades 
            INNER JOIN Assignments ON Assignments.assignment_id = Grades.assignment_id 
            INNER JOIN Section_Registrations ON Section_Registrations.student_id = Grades.student_id 
            WHERE Assignments.section_id = Section_Registrations.section_id 
            AND Assignments.section_id = ?
            GROUP BY Assignments.assignment_id 
            ORDER BY Assignments.due_date desc;`, [req.params.id], assignments => {
    query("SELECT * FROM Sections, Courses WHERE instructor_id = ? AND Sections.section_id = ? and Courses.course_id = Sections.course_id", [res.locals.userId, req.params.id], course => {
      return res.send({ ...course[0], assignments: assignments });
    });
  });
});

router.get('/grades/single/:ids', auth.verifySessionAndRole("teacher"), function (req, res, next) {
  let idString = String(req.params.ids).substring(11);
  let IDarry = idString.split("-");
  let assignmentId = IDarry[0];
  let studentId = IDarry[1];
  query("SELECT Assignments.assignment_category, Assignments.name, Assignments.description, DATE_FORMAT(Assignments.due_date, '%m/%d/%y %h:%i %p') AS due_date, Grades.points_received, Assignments.points_possible, Grades.missing, Grades.active, Grades.flagged_for_audit, Grades.instructor_notes FROM Assignments JOIN Grades ON Grades.assignment_id = Assignments.assignment_id WHERE Grades.assignment_id = ? AND student_id = ?;", [assignmentId, studentId], b => {
    return res.send({ ...b[0] });
  });
});

const gradeSchema = {
  type: 'object',
  properties: {
    ids: {
      type: 'string',
      required: true
    },
    pointsReceived: {
      type: ['integer', 'null'],
      required: true
    },
    missingCheck: {
      type: 'integer',
      required: true
    },
    activeCheck: {
      type: 'integer',
      required: true
    },
    auditCheck: {
      type: 'integer',
      required: true
    },
    instructorNotes: {
      type: 'string',
      required: true
    },
  }
};

/*Edit student's grade for one assignment
step 1: split ID to get assignment ID and student ID
step 2: update grades table with changes
step 3: Pulls all the info we need for the log entry and then builds it, and return success
*/
router.post('/grades/single-update', auth.verifySessionAndRole("teacher"), validate({ body: gradeSchema }), function (req, res, next) {
  // step 1
  let idString = String(req.body.ids).substring(11);
  let IDarry = idString.split("-");
  let assignmentId = IDarry[0];
  let studentId = IDarry[1];

  // step 2
  query("UPDATE Grades SET points_received = ?, missing = ?, active = ?, flagged_for_audit = ?, instructor_notes = ? WHERE assignment_id = ? AND student_id = ?",
    [
      req.body.pointsReceived,
      req.body.missingCheck,
      req.body.activeCheck,
      req.body.auditCheck,
      req.body.instructorNotes,
      assignmentId,
      studentId
    ],
    (data) => {
      //step 3
      query("Select first_name, last_name from Users where user_id = ?", [res.locals.userId], (teacherData, error) => {
        console.log("trying to get record for", res.locals.userId)
        query("Select first_name, last_name from Users where user_id = ?", [studentId], (studentData, error) => {
          query("Select name, section_id from Assignments where assignment_id = ?", [assignmentId], (assignmentData, error) => {
            query("Select section_code, course_id from Sections where section_id = ?", [assignmentData[0].section_id], (sectionData, error) => {
              query("Select name, primary_code, secondary_code from Courses where course_id = ?", [sectionData[0].course_id], (courseData, error) => {
                log_action(`${teacherData[0].first_name} ${teacherData[0].last_name} entered/updated student (${studentId}) ${studentData[0].first_name} 
              ${studentData[0].last_name}'s grade for assignment ${assignmentData[0].name} (${assignmentId}) in section ${sectionData[0].section_code} 
              of course ${courseData[0].name} (${courseData[0].primary_code} ${courseData[0].secondary_code})`)
                return res.send({ success: true });
              });
            });
          });
        });
      });
    });
});

module.exports = router;
