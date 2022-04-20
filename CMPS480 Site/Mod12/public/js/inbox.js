// source: http://jsfiddle.net/sUK45/
var stringToColour = function (str) {
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  var colour = '#';
  for (var i = 0; i < 3; i++) {
    var value = (hash >> (i * 8)) & 0xFF;
    colour += ('00' + value.toString(16)).substr(-2);
  }
  return colour;
}

function isDark(bgColor) {
  var color = (bgColor.charAt(0) === '#') ? bgColor.substring(1, 7) : bgColor;
  var r = parseInt(color.substring(0, 2), 16); // hexToR
  var g = parseInt(color.substring(2, 4), 16); // hexToG
  var b = parseInt(color.substring(4, 6), 16); // hexToB
  return (((r * 0.299) + (g * 0.587) + (b * 0.114)) > 186);
}


function formatString(string, replacements) {
  for (let k in replacements) {
    string = string.split(`{${k}}`).join(replacements[k]);
  }
  return string;
}

const MESSAGE_SIDEBAR_TEMPLATE = `
    <div class="flex-shrink-0">
        <div data-initials="{initials}" class="rounded-pill" style="background-color: {badge_color}; color: {text_color};"></div>
    </div>
    <div class="flex-grow-1 ms-3">
        <div class="d-flex justify-content-between">
            <b>{name}</b>
            <span class="small">{date}</span>
        </div>
        <p>{preview}</p>
    </div>
`;
const MESSAGE_REPLY_TEMPLATE = `
<div class="p-3 d-flex border-bottom" id="{elem_id}">

    <div class="flex-shrink-0 mx-2">
        <div data-initials="{initials}" class="rounded-pill" style="background-color: {badge_color}; color: {text_color};"></div>
    </div>

    <div class="flex-grow-1 ms-3">
        <div class="d-flex justify-content-between w-100">
            <b>{name}</b>
            <span class="small">{date}</span>
        </div>

        <p style="white-space: pre ;">{message}</p>
    </div>
</div>`

let SELECTED_MESSAGE_ID = -1;


async function selectMessage(messageId) {

  if (document.getElementById("select-message")) document.getElementById("select-message").remove();
  document.getElementById("message-initial").style.display = "block";

  let elem = document.getElementById(`message-preview-${messageId}`);

  if (SELECTED_MESSAGE_ID !== -1 && SELECTED_MESSAGE_ID !== messageId) {
    let prevElem = document.getElementById(`message-preview-${SELECTED_MESSAGE_ID}`);
    prevElem.className = prevElem.className.split("selected").join();
  }
  elem.className = elem.className.split("unread").join();
  elem.className += " selected";

  SELECTED_MESSAGE_ID = Number(messageId);


  const messages = await apiCall(`inbox/messages/${SELECTED_MESSAGE_ID}`);

  let firstMessage = messages.messages.shift();

  document.getElementById("replies").innerHTML = "";

  document.getElementById("message-subject").innerHTML = `Subject: ${firstMessage.subject}`;
  let date = new Date(firstMessage.date);
  document.getElementById("message-date").innerHTML = `${date.getMonth() + 1}/${date.getDate()}`;
  document.getElementById("message-body").innerHTML = firstMessage.message;
  document.getElementById("message-from").innerHTML = `From: ${messages.users[firstMessage.sender_id]}`;
  document.getElementById("message-reply-count").innerHTML = `Replies (${messages.messages.length})`;


  for (let message of messages.messages) {

    let name = messages.users[Number(message.sender_id)];

    let initials = name.split(' ');
    initials = initials[0][0] + initials[1][0];

    let badgeColor = stringToColour(name);
    let date = new Date(message.date);

    let elemId = `message-reply-${message.message_id}`;

    let template = formatString(MESSAGE_REPLY_TEMPLATE, {
      "initials": initials,
      "badge_color": badgeColor,
      "text_color": isDark(badgeColor) ? "#fff" : "#000",
      "name": name,
      "date": `${date.getMonth() + 1}/${date.getDate()}`,
      "message": message.message,
      "elem_id": elemId
    });
    document.getElementById("replies").innerHTML += template;
  }


}

async function initInbox() {
  let user = getUser();

  const messages = await apiCall("inbox/messages");
  document.getElementById("messages-preview").innerHTML = "";

  document.getElementById("reply-text").addEventListener("keyup", e => {
    let len = document.getElementById("reply-text").value.length;
    document.getElementById("text-count").innerHTML = `${len}/500 characters`;
  });

  document.getElementById("add-reply").addEventListener("click", async e => {

    let reply = document.getElementById("reply-text").value;
    if (reply.length < 3) {
      return false;
    }

    await apiCall(`inbox/messages/${SELECTED_MESSAGE_ID}`, "POST", {
      message: reply
    });

    document.getElementById("reply-text").value = "";

    // reload message
    selectMessage(SELECTED_MESSAGE_ID);

  });

  for (let message of messages.messages) {

    let initials = message.recipient.name.split(' ');
    initials = initials[0][0] + initials[1][0];

    let badgeColor = stringToColour(message.recipient.name);
    let date = new Date(message.date);

    let status = "";
    if (message.is_read === false)
      status = "unread";

    let elemId = `message-preview-${message.message_id}`;

    let template = formatString(MESSAGE_SIDEBAR_TEMPLATE, {
      "initials": initials,
      "badge_color": badgeColor,
      "text_color": isDark(badgeColor) ? "#fff" : "#000",
      "name": message.recipient.name,
      "date": `${date.getMonth() + 1}/${date.getDate()}`,
      "preview": message.subject,
      "status": status,
      "elem_id": elemId
    });

    //<div class="p-2 border-top d-flex align-items-center message {status}" id="{elem_id}">
    let elem = document.createElement("div")
    elem.className =  `p-2 border-top d-flex align-items-center message ${status}`;
    elem.id = elemId;

    elem.innerHTML = template;
    elem.addEventListener("click", e => selectMessage(message.message_id));


    document.getElementById("messages-preview").appendChild(elem);
  }


  $('#add-recipient').select2({
    dropdownParent: $("#composeModal"),
    ajax: {
      delay: 250,
      dataType: 'json',
      url: 'inbox/search',
      beforeSend: function (request) {
        request.setRequestHeader("x-session-key", user.key);
      },
      processResults: function (data) {
        return {
          results: data.items,
        };
      }
    },
    minimumInputLength: 1,
    placeholder: "Search for a name",
  });

  document.getElementById("send-message").addEventListener("click", async _ => {
    let userId = Number($("#add-recipient")[0].value);
    let subject = document.getElementById("compose-subject").value;
    let text = document.getElementById("compose-text").value;

    if (!userId || isNaN(userId)) {
      return alert("Please enter a valid user.");
    }

    if (subject.length < 1 || text.length < 1) {
      return alert("Please enter a valid subject and message.");
    }

    await apiCall(`inbox/messages`, "POST", {
      recipient_id: userId,
      subject: subject,
      message: text,
    });

    document.location.reload();

  });

}

window.addEventListener("load", _ => {
  feather.replace();
  initInbox();
});
