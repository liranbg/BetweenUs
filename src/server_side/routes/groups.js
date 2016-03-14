var express = require('express');
var database_interface = require('../cloudant_interaction');
var session_util = require('../utils/session');
var router = express.Router();

///* POST API Is testable with Windows PowerShell, Example:
// $ $data = @{  creator    = "nadav";
// $             user_list = "nadav@gmail.com, liranbg@gmail.com, yaron@gmail.com";
// $             group_name = "nn111n"; }
// $ curl -Uri http://localhost:3000/create_group  -UseBasicParsing -Method Post -Body $data
// */
//
router.post('/create_group', function (req, res) {
    // TODO: Check authentication and equivalence of requestor of the request to creator of the group
    var creator = session_util.GetUserId(req.session),
        users_email_list = req.body['member_list[]'],
        group_name = req.body.group_name;
    if (!Array.isArray(users_email_list)) {
        users_email_list = [users_email_list];
    }
    users_email_list.push(session_util.GetUserEmail(req.session)); //add the creator
    database_interface.GetUsersByEmailList(users_email_list, function(err, users_doc){
        if (err) {
            res.status(400).json({success: false, error: err.message })
        }
        else {
            if (users_doc.rows.length != users_email_list.length) {
                res.json({success:false, error: "Invalid Input"});
            }
            else {
                var list_of_users_ids = [];
                for (var i =0; i< users_doc.rows.length; ++i) {
                    if (users_doc.rows[i].id != creator)
                        list_of_users_ids.push(users_doc.rows[i].id);
                }
                database_interface.CreateGroup(creator, list_of_users_ids, group_name, function(err, group_data) {
                    if (err) {
                        res.status(400).json({success: false, error: err.message })
                    }
                    else {
                        database_interface.AddUsersToGroup(users_doc, group_data, function(err, user_data) {
                            if (err) {
                                res.status(400).json({success: false, error: err.message })
                            }
                            else {
                                res.status(201).json({success: true, message: group_data })
                            }
                        });
                    }
                });
            }
        }
    });
    // TODO: For each user in the user list / creator, update document to include new group.
});


router.get('/get_groups', function (req, res) {
    var user_id = session_util.GetUserId(req.session);
    if (!user_id) {
        res.json({success:false})
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
            .then((result) => { res.status(200).json({success: true, data: result}); })
            .catch((err) => { res.status(401).json({success: false, error: err.message}); });
    }
});


router.get('/get_members_public_keys/:group_id', function (req, res) {
    var group_id = req.params.group_id;
    /* TODO Check for authenticated session */
    /* Find group id associated with transaction */
    database_interface.GetGroupDataByGroupId(group_id, function(err, group_data){
        if (err) {
            res.status(500).json({success: false, message: err.message});
        }
        else {
            //TODO send user all public keys associated with group id
            //make another db call and send the data as [{user_id:"123", public_key: "dsfsd"},...]
            var users_id_list = [];
            for (var i = 0; i< group_data.member_list.length; ++i) {
                users_id_list.push(group_data.member_list[i].user_id);
            }
            users_id_list.push(group_data.creator.user_id);
            database_interface.GetUsersPublicKeys(users_id_list, function(err, user_data) {
                if (err) {
                    res.status(500).json({success: false, message: err.message});
                }
                else {
                    res.status(200).json({success: true, key_info:user_data });
                }
            });
        }
    });
});


module.exports = router;
