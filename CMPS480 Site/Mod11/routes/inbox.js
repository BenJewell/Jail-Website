const express = require('express');
const {query} = require("../util/db");
const router = express.Router();
const auth = require("../middleware/auth");
const {validate} = require("express-jsonschema");

// retrieve parent messages, not replies
router.get('/messages', auth.verifySession(), function (req, res, next) {
  query("select `message_id`, `sender_id`, `recipient_id`, `subject`, `updated_at` as date, `sender_is_read`, `recipient_is_read` from Messages where (sender_id = ? or recipient_id = ?) and parent_message_id is null order by updated_at desc", [res.locals.userId, res.locals.userId], results => {

    if (results.length === 0)
      return res.send({messages: []});

    let users = new Set();
    for (let message of results) {
      users.add(message.sender_id);
      users.add(message.recipient_id);
    }

    query("select user_id, concat(first_name, ' ', last_name) as name from Users where user_id in (?)", [Array.from(users)], userResults => {
      users = {};
      for (let user of userResults) {
        users[user.user_id] = user;
      }
      for (let mid in results) {
        results[mid].recipient = users[results[mid].recipient_id];
        results[mid].sender = users[results[mid].sender_id];

        let recipient, is_read;
        // set the recipient to the opposite user so when displaying messages it
        // displays the other user in the convo.
        // set is_read to the is_read column for whichever userId is our local requesting userId,
        // so the inbox can display if we've've read the message or not
        if (results[mid].sender_id === res.locals.userId) {
          recipient = users[results[mid].recipient_id];
          is_read = results[mid].sender_is_read === 1;
        } else {
          recipient = users[results[mid].sender_id];
          is_read = results[mid].recipient_is_read === 1;
        }

        results[mid] = {
          message_id: results[mid].message_id,
          recipient: recipient,
          subject: results[mid].subject,
          is_read: is_read,
          date: results[mid].date,
        };
      }
      res.send({messages: results});
    });
  });
});

// get all messages from conversation (aka thread)
router.get('/messages/:id', auth.verifySession(), function (req, res, next) {
  // check if 1) conversation exists, and 2) user is part of conversation
  query("select 1 from Messages where (sender_id = ? or recipient_id = ?) and message_id = ?", [res.locals.userId, res.locals.userId, req.params.id], message => {
    if (message.length === 0)
      return res.status(404).send({success: false, error: "Conversation not found"})
    query("select `subject`, `message_id`, `sender_id`, `recipient_id`, `message`, `date` from Messages where `message_id` = ? OR `parent_message_id` = ?", [req.params.id, req.params.id], messages => {

      let firstMessage = messages[0];
      let users = [firstMessage.sender_id, firstMessage.recipient_id];

      query("select user_id, concat(first_name, ' ', last_name) as name from Users where user_id in (?)", [users], users => {
        let userResp = {};
        for (let user of users) {
          userResp[Number(user.user_id)] = user.name;
        }
        res.send({messages, users: userResp});

        let fieldName = "recipient_is_read";
        if (messages[0].sender_id === res.locals.userId) {
          fieldName = "sender_is_read";
        }

        query("update Messages set ?? = 1 where message_id = ?", [fieldName, req.params.id], _ => {
        });

      });
    })
  });
});

const ReplySchema = {
  type: 'object',
  properties: {
    message: {
      type: 'string',
      required: true,
    },
  }
};

// add reply to post
// check if theyre in convo, then insert reply, then reset parent message is_read and updated_at
router.post('/messages/:id', validate({body: ReplySchema}), auth.verifySession(), function (req, res, next) {
  // check if 1) conversation exists, and 2) user is part of conversation
  query("select sender_id, recipient_id from Messages where (sender_id = ? or recipient_id = ?) and message_id = ?", [res.locals.userId, res.locals.userId, req.params.id], message => {
    if (message.length === 0)
      return res.status(404).send({success: false, error: "Conversation not found"})
    query("insert into Messages (parent_message_id, sender_id, message, date) values (?, ?, ?, NOW())", [
      req.params.id, res.locals.userId, req.body.message
    ], _ => {
      let fieldName = "sender_is_read";
      if (message[0].sender_id === res.locals.userId) {
        fieldName = "recipient_is_read";
      }
      query("update Messages set ?? = 0, updated_at = NOW() where message_id = ?", [
        fieldName, req.params.id
      ], _ => {
        return res.send({success: true});
      });
    })
  });
});


const ComposeSchema = {
  type: 'object',
  properties: {
    message: {
      type: 'string',
      required: true,
    },
    subject: {
      type: 'string',
      required: true,
    },
    recipient_id: {
      type: 'number',
      required: true,
    },
  }
};


router.post('/messages', validate({body: ComposeSchema}), auth.verifySession(), function (req, res, next) {
  query("insert into Messages (sender_id, recipient_id, date, updated_at, subject, message, sender_is_read) values (?, ?, NOW(), NOW(), ?, ?, 1)", [
    res.locals.userId, req.body.recipient_id, req.body.subject, req.body.message
  ], message => {
    return res.send({success: true, id: message.insertId});
  });
});


router.get('/search', auth.verifySession(), function (req, res, next) {
  query("select Users.user_id as `id`, CONCAT(Users.first_name, ' ', Users.last_name) as `text` from Users where (concat(`first_name`, ' ', `last_name`) like ? or `email_address` like ? or user_id = ?)", [`%${req.query.q}%`, `%${req.query.q}%`, req.query.q], users => {
    return res.send({items: users})
  });
});

router.get('/unread', auth.verifySession(), function (req, res, next) {
  query(`SELECT COUNT(sender_is_read) as unread FROM Messages WHERE sender_id = ? AND sender_is_read = 0 AND parent_message_id IS NULL`, [res.locals.userId], sender => {
    query(`SELECT COUNT(recipient_is_read) as unread FROM Messages WHERE recipient_id = ? AND recipient_is_read = 0 AND parent_message_id IS NULL;`, [res.locals.userId], receiver => {
      return res.send({sender: sender, receiver: receiver});
    });
  });
});

module.exports = router;
