var express = require('express');
var database_interface = require('../cloudantdb');
var session_util = require('../utils/session');
var router = express.Router();


router.get('/get_transaction', function (req, res) {
    //http://localhost:3000/transactions/get_transaction?transaction_id=1afb05dfa0de96545a1756a2a309d7f5
    var transaction_id = req.query.transaction_id;
    if (!transaction_id) {
        res.status(404).json({success:false, error: "Invalid Input"});
        return;
    }
    database_interface.GetTransactionById(transaction_id, function(err, data) {
        if (err) {
            res.status(404).json({success:false, error: err.message});
        }
        else {
            res.status(200).json({success: true, user_data: data});
        }
    });
});


router.post('/create_transaction', function (req, res) {

    //var initiator = session_util.GetUserId(req.session);
    var initiator = "18070c0660cf6b7f6a75f46860ca9104"; //Nadav's user id
    var data = JSON.parse(req.body.json_data);
    var chiper_data = data.cipher_data;
    var stash_list = data.stash_list; //[{user_id:"123123", share:"asdasdasdasd"},{},{},...]
    var group_id = data.group_id;
    var transaction_name = data.transaction_name;
    var share_threshold = data.share_threshold;

    database_interface.CreateTransaction(initiator, transaction_name, chiper_data, stash_list, group_id, share_threshold, function(err,data) {
        if (err) {
            res.json({success:true, error:err.message});
        }
        else {
            res.json({success:true, data:data});
        }
    });
});



module.exports = router;