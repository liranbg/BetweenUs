var express = require('express');
var database_interface = require('../cloudant_interaction');
var session_util = require('../utils/session');
var router = express.Router();
/* GET users listing. */
router.get('/get_notifications_for_transaction', function(req, res, next) {
    //http://localhost:3000/notifications/get_notifications_for_transaction?transaction_id=ad32d847cbfab0eedfd959debf6e4bd3
    var transaction_id = req.query.transaction_id;
    var user_id = session_util.GetUserId(req.session);

    database_interface.GetUsersByIdsList([user_id], function(err, user_data) {
        database_interface.GetNotificationStash(user_data.rows[0].doc.notifications_stash[0], function(err, notification_data) {
            var list_of_users_ids = [];
            var list_of_responses = [];
            for (var i in notification_data.notification_list) {
                var notification = notification_data.notification_list[i];
                notification.group_id = undefined; //erasing group id from request
                if (notification.transaction_id == transaction_id) {
                    list_of_users_ids.push(notification.sender);
                    list_of_responses.push(notification);
                }
            }
            database_interface.GetUsersByIdsList(list_of_users_ids, function(err, users_data) {
                if (err) {
                    console.log("GetUsersByIdsList error", err.message);
                }
                for (var j in users_data.rows) {
                    list_of_responses[j].sender = {
                        user_id: users_data.rows[j].doc._id,
                        user_email: users_data.rows[j].doc.email
                    }
                }
                res.status(200).json({success:true, notifications:list_of_responses});
            });


        });
    });
});


module.exports = router;