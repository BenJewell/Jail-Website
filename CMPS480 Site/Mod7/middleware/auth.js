const {query} = require("../util/db");

exports.verifySessionAndRole = function (role) {
  return function (req, res, next) {
    query("select `user_id` from `Users` where `session_key` = ? AND `role` = ?", [req.headers["x-session-key"], role], data => {
      if (!data || !data.length)
        return res.status(401).send({success: false, error: "Not authorized"});
      res.locals.userId = data[0].user_id;
      return next();
    });
  }
};
