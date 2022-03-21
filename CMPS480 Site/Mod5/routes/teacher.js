const express = require('express');
const {query} = require("../util/db");
const router = express.Router();
const validate = require('express-jsonschema').validate;
const auth = require("../middleware/auth");

router.get('/courses', auth.verifySessionAndRole("teacher"), function (req, res, next) {
  query("select * from Sections, Courses where instructor_id = ? and Courses.`Course ID` = Sections.`Course ID`", [res.locals.userId], d => {
    return res.send(d);
  });
});

router.get('/course/:id', auth.verifySessionAndRole("teacher"), function (req, res, next) {
  query("select * from Sections, Courses where instructor_id = ? and Sections.`Course ID` = ? and Courses.`Course ID` = Sections.`Course ID`", [res.locals.userId, req.params.id], section => {
    query("select `Section Registrations`.*, `USERS`.ID, USERS.NAME, USERS.LASTNAME from `Section Registrations`, USERS where `Section ID` = ? and USERS.`ID` = `Section Registrations`.`ID`", [section[0]["Section ID"]], d => {
      return res.send({...section[0], students: d});
    });
  });
});

router.get('/student/:studentId/:courseId', auth.verifySessionAndRole("teacher"), function (req, res, next) {
  query("select * from Grades, Assignments where Assignments.`Section ID` = 1 and Grades.`Assignment ID` = `Assignments`.`Assignment ID`;", [req.params.studentId, req.params.courseId], grades => {
    query("select USERS.ID, USERS.NAME, USERS.LASTNAME from USERS where USERS.ID = ?", [req.params.studentId], student => {
      return res.send({grades: grades, student: student[0]});
    });
  });
});

module.exports = router;
