var express = require('express');
var database_interface = require('../cloudantdb');
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
        database_interface.GetAllMyGroups(user_id, function(err, data) {
            if (err) {
                res.json({success: false, error: err.message});
            }
            else {
                res.json({success: true, groups: data.rows});
            }

        });
    }
});

router.get('/get_group_info', function (req, res) {
    var user_id = session_util.GetUserId(req.session);
    if (!user_id) {
        res.json({success:false})
    }

    else {
        var group_id = req.query.group_id;
        database_interface.GetGroupDataByGroupId(group_id, function(err, data) {
            if (err) {
                res.json({success: false, error: err.message});
            }
            else {
                res.json({success: true, data: data});
            }

        });
    }
});



router.get('/get_members_public_keys/:transaction_id', function (req, res) {
    var transaction_id = req.params.transaction_id;
    /* TODO Check for authenticated session */
    /* Find group id associated with transaction */
    database_interface.GetGroupIdByTransactionId(transaction_id, function(data, error) {
        //we have group_id in data
        if (error) {
            res.json({success: false, message: error.message});
        }
        else {
            //TODO send user all public keys associated with group id
            //make another db call and send the data as [{user_id:"123", public_key: "dsfsd"},...]
            res.json({success: true, data:data });
        }
    });
});

module.exports = router;
