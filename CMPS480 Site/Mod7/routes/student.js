const express = require('express');
const {query} = require("../util/db");
const router = express.Router();
const auth = require("../middleware/auth");

//Side Nav
router.get('/courses', auth.verifySessionAndRole("student"), function (req, res, next) {
  query("SELECT section_id FROM Section_Registrations WHERE student_id = ?", [res.locals.userId], d => {
    let results = [];
    for (let data of d) {
      results.push(Object.values(data));
    }
    query("SELECT * FROM Sections, Courses WHERE section_id IN ? AND Courses.course_id = Sections.course_id ORDER BY Courses.name", [results], d => {
      return res.send(d);
    });
  });
});

//Course Grades Table
router.get('/grades/:id', auth.verifySessionAndRole("student"), function (req, res, next) {
  query("SELECT Assignments.name, Grades.points_received, Assignments.points_possible, DATE_FORMAT(Assignments.due_date, '%m/%d/%y %h:%i %p') AS due_date, Grades.missing FROM Assignments, Grades WHERE Assignments.assignment_id = Grades.assignment_id AND Assignments.section_id = ? AND Grades.student_id = ? ORDER BY due_date DESC, name;", [req.params.id, res.locals.userId], table => {
    query("SELECT (SUM(Grades.points_received)/SUM(Assignments.points_possible)) AS total_grade FROM Assignments, Grades WHERE Assignments.assignment_id = Grades.assignment_id AND Assignments.section_id = ? AND Grades.student_id = ? AND Grades.points_received IS NOT NULL", [req.params.id, res.locals.userId], totalGrade => {
      return res.send({...totalGrade[0], table: table});
    });
  });
});
//Total

//Overview Table
router.get('/dashboard/overview', auth.verifySessionAndRole("student"), function (req, res, next) {
  query("SELECT Courses.course_id, Courses.name AS course_name, (SUM(Grades.points_received)/SUM(Assignments.points_possible)) AS total_grade FROM Assignments, Grades, Courses WHERE student_id = ? AND Assignments.assignment_id = Grades.assignment_id AND Courses.course_id = Assignments.course_id AND Grades.points_received IS NOT NULL ORDER BY course_name;", [res.locals.userId], d => {
    return res.send(d);
  });
});
//Recent Table
router.get('/dashboard/recent', auth.verifySessionAndRole("student"), function (req, res, next) {
  query("SELECT Courses.course_id, Courses.name AS course_name, Assignments.name AS assignment_name, Grades.points_received, Assignments.points_possible, Assignments.due_date FROM Assignments, Grades, Courses WHERE student_id = ? AND Assignments.assignment_id = Grades.assignment_id AND Courses.course_id = Assignments.course_id ORDER BY Assignments.due_date DESC LIMIT 5;", [res.locals.userId], d => {
    return res.send(d);
  });
});
//Missing Table
router.get('/dashboard/missing', auth.verifySessionAndRole("student"), function (req, res, next) {
  query("SELECT Courses.course_id, Courses.name AS course_name, Assignments.name AS assignment_name FROM Assignments, Grades, Courses WHERE student_id = ? AND Assignments.assignment_id = Grades.assignment_id AND Courses.course_id = Assignments.course_id AND Grades.missing = 1 ORDER BY Assignments.due_date DESC;", [res.locals.userId], d => {
    return res.send(d);
  });
});

module.exports = router;