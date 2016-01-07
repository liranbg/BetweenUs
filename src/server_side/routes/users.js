var express = require('express');
var database_interface = require('../cloudantdb');
var router = express.Router();

/* GET users listing. */
router.get('/get_user', function(req, res, next) {
    //http://localhost:3000/users/get_user?user_email=liranbg@gmail.com -> displays
    var user_email = req.query.user_email;
    database_interface.GetUserByEmail(user_email, function(data) {
        res.render('show_user_info', { title: 'BetweenUs', user_data: data });
    });
}).post('/get_user', function(req, res) {
    var public_key = req.body.public_key;
    console.log(public_key);
    res.send({"status": "ok"});
});

module.exports = router;
