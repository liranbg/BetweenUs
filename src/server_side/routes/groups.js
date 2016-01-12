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
    // TODO: Check all users in user_list exist.
    var creator = req.body.creator,
        user_list = req.body.user_list,
        group_name = req.body.group_name;
    user_list = user_list.split(",");
    var users = [];
    for (var i = 0; i < user_list.length; ++i) {
        users.push(user_list[i].trim());
    }
    console.log(user_list);
    //database_interface.CreateNewGroup(creator, users, group_name, function(group_data, err) {
    //    if (err) {
    //        res.json({success: false, message: "Error occurred while creating a new group." + err.message })
    //    }
    //    database_interface.AddUsersToGroup(users, group_data, function(data, err) {
    //        console.log("Added group",group_data.id,"to user",user_data.email);
    //    });
    //    res.json({success: true, message: "Group created, Group details: " + group_data});
    //});

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
                res.json({success: true, data: data});
            }

        });
    }

    var creator = req.body.creator,
        user_list = req.body.user_list,
        group_name = req.body.group_name;
    res.json({success:true, data: "123"});
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
