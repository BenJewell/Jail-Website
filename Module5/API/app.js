const express = require('express');
const app = express();
const mongoose = require('mongoose');
require('dotenv/config');

// middleware
// app.use('/posts', () => {
//     console.log("This is our security middleware running")
// });

// routes
app.get('/', (req, res) => {
    res.send("We are at home!")
});

app.get('/posts', (req, res) => {
    res.send("We are on posts!")
});

// Connect to database

// mongoose.connect('mongosh "mongodb+srv://classtest.a2awj.mongodb.net/myFirstDatabase" --username Ben',
//     () => {
//         console.log("Connected to DB");
//     });

mongoose.connect(process.env.DB_CONNECTION, () => {
    console.log('Connected to DB')
});

app.listen(8501);

