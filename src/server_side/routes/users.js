var express = require('express');
var database_interface = require('../cloudant_interaction');
var session_util = require('../utils/session');
var validation_util = require('../utils/validation')
var router = express.Router();

/*** GET route for '/users/get_user' url.
 *
 *   Return the logged in user data in the following format:
 *   {
 *      "success":true,
 *      "user_data":{
 *          "_id":"cddf14e4e0ce7fd1f3fb2f8d66fef344","_rev":"4-5993c322d793cf37cab3e60a7ea6dc60",
 *          "metadata":{
 *              "scheme":"user",
 *              "scheme_version":"1.0",
 *              "registration_time":"2016-01-24T15:01:48.589Z",
 *              "last_login_time":"" },
 *          "email":"alice",
 *          "password":"1",
 *          "public_key":"alice_pk",
 *          "groups":["e6d4824ba908e09959e5ac63289e800d","7919006d123314bb0a8a345a324f0b09"],
 *          "notifications_stash":["d05ab2d51d8a84864e91c642c1934cd6"]
 *         }
 *     }
 *
 *     Returns a 401 forbidden error on failure (session not initialized or no email in session)
 */
router.get('/get_user', function(req, res, next) {
    var user_email = session_util.GetUserEmail(req.session);
    if (!user_email)
    {
        res.status(401).json({success: false, error: "Must be authenticated to perform this action."});
    }
    else {
        database_interface.GetUserByEmail(user_email)
            .then((data) => {
                res.status(200).json({success: true, user_data: data});
            })
            .catch((err) => {
                /* 401 -> Unauthorized. */
                res.status(401).json({success: false, error: "Bad credentials."});
            });
    }
});

router.get('/user_exists', function(req, res, next) {
    var user_email = session_util.GetUserEmail(req.session);
    if (!user_email)
    {
        res.status(401).json({success: false, error: "Must be authenticated to perform this action."});
    }
    else {
        var user_email = req.query.user_email;
        database_interface.IsUserExists(user_email)
            .then((data) => res.status(200).json({success: true, response: data}))
            .catch((err) => res.status(404).json({success: false, error: err}));
    }
});


router.post('/register_user', function(req, res) {
    // TODO: Check parameters are in compliance with some policy we'll set regarding username, password etc.
    // TODO: Add an email authorization before actually inserting user into the database (Low priority).
    //gets email,password, public_key
    var email = req.body.email;
    var password = req.body.password;
    var public_key = req.body.public_key;
    /* Validate input parameters */
    if (validation_util.ValidatePassword(password) == false) {
        res.status(422).json({success: false, error: "Bad parameters for password."});
    }
    else if (validation_util.ValidateUsername(email) == false) {
        res.status(422).json({success: false, error: "Bad parameters for username."});
    }
    else if (validation_util.ValidatePublicKey(public_key) == false) {
        res.status(422).json({success: false, error: "Bad parameters for public key."});
    }
    else {
        /* Check if user already exist. */
        console.log("Checking if user exists...");
        database_interface.IsUserExists(email)
        .then((data) => {
            console.log("User exists, returning 401...");
            /* If successful, user exist, and that means we can't use that username. */
            res.status(401).json({success: false, error: "Email already exist."});
        })
        .catch((data) => {
            console.log("User doesn't exist, creating new user...");
            /* If we're here, username does not exist. we can proceed to add it.*/
            database_interface.InsertNewUser(password, email, public_key)
            .then((data) => res.status(201).json({success: true, message: data}))
            .catch((err) => res.status(400).json({success: false, error: err}))
        })
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
