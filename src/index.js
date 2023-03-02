const express = require('express');
const mongoose = require('mongoose');
const route = require('./routes/route');
const multer = require('multer');
const app = express();
require('dotenv').config()
app.use(express.json());

app.use(multer().any());

mongoose.set('strictQuery', true);
mongoose.connect("mongodb+srv://YuktaSadana:yuiopjkl@cluster0.ikfqj5s.mongodb.net/shoppingCart" ,{
    useNewUrlParser: true
}).then(() => console.log('MongoDB is Connected'))
    .catch((err) => console.log(err))

app.use("/", route);

app.listen( process.env.PORT || 3001, () => {
    console.log('Server running on port', (process.env.PORT || 3001));
})
