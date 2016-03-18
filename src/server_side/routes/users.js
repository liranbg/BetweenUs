var express = require('express');
var database_interface = require('../cloudant_interaction');
var session_util = require('../utils/session');
var validation_util = require('../utils/validation')
var router = express.Router();
var errors_util = require('../utils/errors');

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
        errors_util.ReturnNotLoggedInError(res);
    }
    else {
        database_interface.GetUserByEmail(user_email)
            .then((data) => {
                res.status(200).json({success: true, user_data: data});
            })
            .catch((err) => {
                res.status(401).json({success: false, error: err});
            });
    }
});

router.get('/user_exists', function(req, res, next) {
    var user_email = session_util.GetUserEmail(req.session);
    if (!user_email)
    {
        errors_util.ReturnNotLoggedInError(res);
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
        database_interface.IsUserExists(email)
        .then((data) => {
            /* If successful, user exist, and that means we can't use that username. */
            res.status(401).json({success: false, error: "Email already exist."});
        })
        .catch((data) => {
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
            res.status(401).json({success: false, message: "Bad credentials."});
        });
});


/*** GET route handler for /users/get_public_key
 *
 *  This function will return a json that looks like that:
 *  {"success":true,"public_key":"alice_pk"}
 *
 *  User must be authenticated otherwise it will return:
 *  {"success":false,"error":"Must be authenticated to perform this action."}
 *
 *  user_id must be provided in the GET query other it will return:
 *  {"success":false,"error":"Missing parameter: user_id."}
 *
 */
router.get('/get_public_key', function(req, res) {
    var requesting_user_id = session_util.GetUserId(req.session);
    /* Verify that user is logged in, AKA there is a stored session. */
    if (requesting_user_id == null)
    {
        errors_util.ReturnNotLoggedInError(res);
    }
    else
    {
        /* Verify that the user has provided an 'user_id' in the GET query. */
        if (req.hasOwnProperty('query') && req.query.hasOwnProperty('user_id')) {
            var user_id = req.query.user_id;
            database_interface.GetUsersPublicKeys([user_id])
                .then((data) => {
                    res.status(200).json({success: true, public_key: data[0]});
                })
                .catch((err) => {
                    res.status(404).json({success: false, error: err.message});
                });
        }
        else
        {
            errors_util.ReturnRequestMissingParamteres(res);

        }
    }
});

module.exports = router;
