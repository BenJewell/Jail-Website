const express = require("express");
const path = require("path");
const app = express();
const port = 3000;

app.listen(port, () => {
    console.log(`listening to port`, port);
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "/index.html"));
});