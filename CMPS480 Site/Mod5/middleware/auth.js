const {query} = require("../util/db");

exports.verifySessionAndRole = function (role) {
  return function (req, res, next) {
    query("select `ID` from `USERS` where `sessionKey` = ? AND `User Role` = ?", [req.headers["x-session-key"], role], data => {
      if (!data || !data.length)
        return res.status(401).send({success: false, error: "Not authorized"});
      res.locals.userId = data[0].ID;
      return next();
    });
  }
};
