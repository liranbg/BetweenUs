var express = require('express');
var database_interface = require('../cloudant_interaction');
var session_util = require('../utils/session');
var router = express.Router();

/* GET users listing. */
router.get('/get_user', function(req, res, next) {
    //http://localhost:3000/users/get_user?user_email=liranbg@gmail.com -> displays
    var user_email = req.query.user_email;
    database_interface.GetUserByEmail(user_email, function(err, data) {
        if (err) {
            res.status(400).json({success:false, error: err.message});
        }
        else {
            if (data.rows.length == 0) {
                res.status(204).json({success: false, error: "No such email"}); //no content. actually does not return the obj
            }
            else {
                res.status(200).json({success: true, user_data: data});
            }
        }
    });
});


router.get('/user_exists', function(req, res, next) {
    var user_email = req.query.user_email;
    database_interface.IsUserExists(user_email, function(err, data) {
        if (err) {
            res.status(400).json({success:false, error: err.message});
        }
        else {
            var http_code = 200;
            if (!data) {
                http_code = 500;
            }
            res.status(http_code).json({success:true,response: data});
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
                res.status(400).json({success: false, error: err});
            }
            else {
                if (data.rows.length == 0) {
                    //No such user. we can insert it to db
                    database_interface.InsertNewUser(password, email, public_key, function (err, data) {
                        if (err) {
                            res.status(400).json({success: false, error: err});
                        }
                        else {
                            res.status(201).json({success: true, message: data});
                        }
                    });
                }
                else {
                    res.status(400).json({success: false, message: "Email already exists"});
                }
            }
        });
    }

});


router.post('/login', function (req, res) {
    var email = req.body.email;
    var password = req.body.password;

    database_interface.CheckLogin(email, password)
        .then((result) => {
            session_util.InitUserSession(req.session, result.email, result._id);
            res.status(200).json({success: true, message: "Authenticated successfully", data: result});
        })
        .catch((err) => {
            res.status(401).json({success: false, message: "Wrong password"});

        });
});


router.get('/get_public_key', function(req, res) {
    var user_id = req.query.user_id;
    database_interface.GetUsersPublicKeys([user_id], function(err, body) {
        if (err) {
            res.status(404).json({success:false, error: err.message});
        }
        else {
            res.status(200).json({success: true, public_key: body[0].public_key});
        }
    })

});

module.exports = router;
