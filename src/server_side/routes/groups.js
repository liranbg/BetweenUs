var express = require('express');
var database_interface = require('../cloudant_interaction');
var session_util = require('../utils/session');
var router = express.Router();
var errors_util = require('../utils/errors');
///* POST API Is testable with Windows PowerShell, Example:
// $ $data = @{  creator    = "nadav";
// $             user_list = "nadav@gmail.com, liranbg@gmail.com, yaron@gmail.com";
// $             group_name = "nn111n"; }
// $ curl -Uri http://localhost:3000/create_group  -UseBasicParsing -Method Post -Body $data
// */
//
router.post('/create_group', function (req, res) {
    var user_docs = null;
    var creator = session_util.GetUserId(req.session);
    if (creator == null) {
        errors_util.ReturnNotLoggedInError(res);
    }
    else {
        var users_email_list = req.body['member_list[]'],
            group_name = req.body.group_name;
        if (!Array.isArray(users_email_list)) {
            users_email_list = [users_email_list];
        }
        /* The initial request passes the member list without the creator in it, so add it manually. */
        users_email_list.push(session_util.GetUserEmail(req.session));
        database_interface.GetUsersByEmailList(users_email_list)
        .then((users_doc) => {
            user_docs = users_doc;
            /* Verify we got as many emails as we inputted. */
            if (users_doc.rows.length != users_email_list.length) {
                reject("Couldn't find all users.");
            }
            var list_of_users_ids = [];
            for (var i in users_doc.rows) {
                if (users_doc.rows[i].id != creator)
                    list_of_users_ids.push(users_doc.rows[i].id);
            }
            return database_interface.CreateGroup(creator, list_of_users_ids, group_name);
        })
        .then((group_doc) => {
            return database_interface.AddUsersToGroup(user_docs, group_doc);
        })
        .then((data) => {
            res.status(201).json({success: true, message: data })
        })
        .catch((err) => res.status(400).json({success: false, error: err }));
    }
});


router.get('/get_groups', function (req, res) {
    var user_id = session_util.GetUserId(req.session);
    if (user_id == null) {
        errors_util.ReturnNotLoggedInError(res);
    }
    else {
        database_interface.GetGroupsForUserId(user_id)
            .then((result) => {
                var group_data = [];
                for (var i = 0; i < result.length; ++i) {
                    group_data.push(result[i].value)
                }
                res.status(200).json({success: true, groups: group_data});
            })
            .catch((err) => {
                res.status(401).json({success: false, message: err});
            });
    }
});


router.get('/get_group_info', function (req, res) {
    var user_id = session_util.GetUserId(req.session);
    if (!user_id) {
        res.status(401).json({success:false, message:"You must be logged in"});
    }
    else {
        var group_id = req.query.group_id;
        database_interface.GetGroupDataByGroupId(group_id)
            .then((result) => {
                res.status(200).json({success: true, data: result});
            })
            .catch((err) => {
                res.status(401).json({success: false, error: err.message});
            });
    }
});


router.get('/get_members_public_keys/:group_id', function (req, res) {
    var group_id = req.params.group_id;
    if (session_util.GetUserEmail(req.session) == null) {
        errors_util.ReturnNotLoggedInError(res);
    }
    else {
        /* Find group id associated with transaction */
        database_interface.GetGroupDataByGroupId(group_id)
            .then((data) => {
                var users_id_list = [];
                for (var i = 0; i< data.member_list.length; ++i) {
                    users_id_list.push(data.member_list[i].user_id);
                }
                users_id_list.push(data.creator.user_id);
                return database_interface.GetUsersPublicKeys(users_id_list);
            })
            .then((data) => {
                res.status(200).json({success: true, key_info: data })
            })
            .catch((err) => res.status(400).json({success: false, message: err}));
    }
});


module.exports = router;
