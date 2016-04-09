var express = require('express');
var database_interface = require('../cloudant_interaction');
var session_util = require('../utils/session');
var router = express.Router();
/* GET users listing. */
router.get('/get_notifications_for_transaction', function(req, res, next) {
    //http://localhost:3000/notifications/get_notifications_for_transaction?transaction_id=10fd290177596f6512d1392eda4fcb17
    var transaction_id = req.query.transaction_id;
    var user_id = session_util.GetUserId(req.session);
    database_interface.GetUsersByListOfIds([user_id])
    .then((data) => {
        console.log("GetUsersByListOfIds here: ", data);
        var notification_stash_id = data[0].doc.notifications_stash[0];
        return database_interface.GetNotificationStash(notification_stash_id);
    })
    .then((notification_stash) => {
        var list_of_users_ids = [];
        var list_of_responses = [];
        for (var i in notification_stash.notification_list) {
            var notification = notification_stash.notification_list[i];
            if (notification.transaction_id == transaction_id) {
                list_of_users_ids.push(notification.sender);
                list_of_responses.push(notification);
            }
        }
        res.status(200).json({success:true, notifications:list_of_responses});
    })
    .catch((err) => {
        res.status(400).json({success:false, error: err});
    });
});


module.exports = router;