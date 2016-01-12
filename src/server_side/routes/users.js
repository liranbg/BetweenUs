var express = require('express');
var database_interface = require('../cloudantdb');
var router = express.Router();

/* GET users listing. */
router.get('/get_user', function(req, res, next) {
    //http://localhost:3000/users/get_user?user_email=liranbg@gmail.com -> displays
    var user_email = req.query.user_email;
    database_interface.GetUserByEmail(user_email, function(err, data) {
        if (err) {
            res.status(500);
            res.json({success:false, error: err.message});
        }
        else {
            res.status(200);
            res.json({success: true, user_data: data});
        }
    });
});

router.post('/register_user', function(req, res) {
    // TODO: Check parameters are in compliance with some policy we'll set regarding username, password etc.
    // TODO: Add an email authorization before actually inserting user into the database (Low priority).
    //gets email,password, public_key
    var email = req.body.email;
    var password = req.body.password;
    var public_key = req.body.public_key;
    if ((!email) || (!password) || (!public_key)) {
        res.json({success: false, error: "Input Error"});
    }
    else {
        database_interface.GetUserByEmail(email, function(err, data) {
            if (err) {
                res.json({success: false, error: err});
            }
            else {
                if (data.rows.length == 0) {
                    //No such user. we can insert it to db
                    database_interface.InsertNewUser(password, email, public_key, function (err, data) {
                        if (err) {
                            res.json({success: false, error: err});
                        }
                        else {
                            res.status(201);
                            res.json({success: true, message: data});
                        }
                    });
                }
                else {
                    res.json({success: false, message: "Email already exists" , data: data});
                }
            }
        });
    }

});

router.post('/login', function (req, res) {
    var email = req.body.email;
    var password = req.body.password;
    database_interface.GetUserByEmail(email, function(err, data) {
        if (err) {
            res.json({success: false, error: err});
        }
        else {
            if (data.total_rows == 0) {
                res.json({success: false,  message: "Username does not exists"});
            }
            else {
                var doc = data.rows[0];
                if ((doc.value.email == email) && (doc.value.password == password)) {
                    req.session.user_id = doc.value.email;
                    res.json({success: true, message: "Authenticated successfully", data: doc});
                }
                else {
                    res.json({success: false, message: "Wrong password"});
                }
            }
        }
    });
});

module.exports = router;
