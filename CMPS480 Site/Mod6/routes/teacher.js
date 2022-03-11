const express = require('express');
const { query } = require("../util/db");
const router = express.Router();
const auth = require("../middleware/auth");
const validate = require('express-jsonschema').validate;


router.get('/courses', auth.verifySessionAndRole("teacher"), function (req, res, next) {
  query("select * from Sections, Courses where instructor_id = ? and Courses.course_id = Sections.course_id", [res.locals.userId], d => {
    return res.send(d);
  });
});

router.get('/course/:id', auth.verifySessionAndRole("teacher"), function (req, res, next) {
  // It seems res.locals.userId is the user ID that is in use, and req.params.id is the course ID we are getting the student list for. Having trouble reverse enginering this part.
  console.log("user id: " + res.locals.userId);
  console.log('id: ' + req.params.id);

  if (req.params.id == false || res.locals.userId == false) {
    // Prevents hard crash if user ID or course ID requested do not exist.
    return res.status(500).send("Invalid User or Course ID!") // Can't this this text to appear on the front end, but not a big deal.
  }

  query("select * from Sections, Courses where instructor_id = ? and Sections.course_id = ? and Courses.course_id = Sections.course_id", [res.locals.userId, req.params.id], section => {
    query("select Section_Registrations.*, Users.user_id, Users.first_name, Users.last_name, (SUM(Grades.points_received)/SUM(Assignments.points_possible)) AS total_grade from Section_Registrations, Users, Assignments, Grades where Assignments.section_id = ? and Section_Registrations.student_id = Grades.student_id and Users.user_id = Section_Registrations.student_id and Assignments.assignment_id = Grades.assignment_id and Grades.points_received IS NOT NULL GROUP BY Grades.student_id;",
      [section[0]["section_id"]], students => {
        return res.send({ ...section[0], students: students });
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
  query(`select 
      Grades.assignment_id, Assignments.name, Assignments.description, DATE_FORMAT(Assignments.due_date, '%m/%d/%y %h:%i %p') as formatted_due_date, count(Grades.points_received) as assignments_graded, count(Section_Registrations.student_id) as students_count
    from
      Grades 
    inner join
      Assignments
    on
      Assignments.assignment_id = Grades.assignment_id
    inner join
      Section_Registrations
    on
      Section_Registrations.student_id = Grades.student_id
    where
      Assignments.section_id = Section_Registrations.section_id
    group by
      Assignments.assignment_id
    order by
      Assignments.due_date desc, assignments_graded;`,
 [req.params.id], assignments => {
    return res.send(assignments);
  });
});

router.get('/grades/single/:ids', auth.verifySessionAndRole("teacher"), function (req, res, next) {
  let idString = String(req.params.ids).substring(11);
  let IDarry = idString.split("-");
  let assignmentId = IDarry[0];
  let studentId = IDarry[1];
  query("SELECT Assignments.name, Assignments.description, DATE_FORMAT(Assignments.due_date, '%m/%d/%Y %H:%i') AS due_date, Grades.points_received, Assignments.points_possible, Grades.missing, Grades.active FROM Assignments JOIN Grades ON Grades.assignment_id = Assignments.assignment_id WHERE Grades.assignment_id = ? AND student_id = ?;", [assignmentId, studentId], b => {
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
    }
  }
};

/*Edit student's grade for one assignment
step 1: split ID to get assignment ID and student ID
step 2: update grades table with changes
step 3: return success
*/
router.post('/grades/single-update', validate({ body: gradeSchema }), function (req, res, next) {
  // step 1
  let idString = String(req.body.ids).substring(11);
  let IDarry = idString.split("-");
  let assignmentId = IDarry[0];
  let studentId = IDarry[1];

  // step 2
  query("UPDATE Grades SET points_received = ?, missing = ?, active = ? WHERE assignment_id = ? AND student_id = ?",
    [
      req.body.pointsReceived,
      req.body.missingCheck,
      req.body.activeCheck,
      assignmentId,
      studentId
    ],
    (data) => {
      //step 3
      return res.send({ success: true });
    });
});

module.exports = router;
