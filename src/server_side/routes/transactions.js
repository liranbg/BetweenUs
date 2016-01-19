var express = require('express');
var database_interface = require('../cloudantdb');
var session_util = require('../utils/session');
var router = express.Router();


router.post('/create_stash', function (req, res) {



});


router.post('/create_transaction', function (req, res) {
    var initiator = req.body['initiator_user_id'];
    var chiper_data = req.body.chiper_data;
    var stash_list = JSON.parse(req.body.stash_list); //[{user_id:"123123", share:"asdasdasdasd"},{},{},...]
    var group_id = req.body.group_id;
    var share_threshold = req.body.share_threshold;

    database_interface.CreateTransaction(initiator, chiper_data, stash_list, group_id, share_threshold, function(err,data) {
        if (err) {
            res.json({success:true, error:err.message});
        }
        else {
            res.json({success:true, data:data});
        }
    });



});



module.exports = router;