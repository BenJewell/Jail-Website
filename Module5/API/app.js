const express = require('express');
const app = express();
// require('dotenv/config');

// middleware
app.use('posts', () => {
    console.log("middleware running")
});

// routes
app.get('/', (req,res) => {
    res.send("We are at home!")
});

app.get('/posts', (req,res) => {
    res.send("We are on posts!")
});

// // routes
// app.get('/posts', (req,res) => {
//     res.send("We are on posts!")
// });

// // Connect to DB
// mongoose.connect(
//     process.env.DB_CONNECTION,( => {
//         console.log("Connected!")
//     })
// )
// mongoose.connect('ff') {
//     console.log('Connected to DB')
// }

app.listen(8501);

