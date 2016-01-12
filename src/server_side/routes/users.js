var express = require('express');
var database_interface = require('../cloudantdb');
var router = express.Router();

/* GET users listing. */
router.get('/get_user', function(req, res, next) {
        //http://localhost:3000/users/get_user?user_email=liranbg@gmail.com -> displays
    var user_email = req.query.user_email;
    database_interface.GetUserByEmail(user_email, function(data) {
        res.send({"status": "ok", user_data: data});
    });
}).post('/get_user', function(req, res) {
    var public_key = req.body.public_key;
    console.log(public_key);
    res.send({"status": "ok"});
});

router.post('/register_user', function(req, res) {
    // TODO: Check parameters are in compliance with some policy we'll set regarding username, password etc.
    // TODO: Add an email authorization before actually inserting user into the database (Low priority).
    //gets email,password, public_key
    var email = req.body.email;
    var password = req.body.email;
    var public_key = req.body.public_key;
    database_interface.InsertNewUser(password, email, public_key, function(err, data) {
        if (err) {
            res.send({success: false, error: err});
        }
        else {
            res.send({success: true, message: data});
        }
    })
});

module.exports = router;
