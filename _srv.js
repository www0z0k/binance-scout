const express = require('express');
const app = express();
// const ws = require('./ws')
app.get('/', function (req, res) {
   res.sendfile(__dirname + '/html/independent.html');
});
app.listen(8000, function () {
   console.log('up and running on 8000!')
})
