var express = require('express');
var database_interface = require('../cloudant_interaction');
var session_util = require('../utils/session');
var errors_util = require('../utils/errors');
var router = express.Router();


router.get('/get_transaction', function (req, res) {
    // http://localhost:3000/transactions/get_transaction?transaction_id=549b28dde0a96df05e8d1426ad6e6aed
    /* Verify that user is logged in to perform this action. */
    var user_id = session_util.GetUserId(req.session);
    if (user_id == null) {
        errors_util.ReturnNotLoggedInError(res);
    }
    else {
        /* Make sure the transcation_id field is provided in the GET query. */
        if (req.hasOwnProperty('query') && req.query.hasOwnProperty('transaction_id')) {
            var transaction_id = req.query.transaction_id;
            database_interface.GetTransactionAllInfoById(user_id, transaction_id)
                .then((result) => {
                    res.status(200).json({success: true, transaction_data: result});
                })
                .catch((err) => {
                    res.status(401).json({success: false, error: err.message});
                });
        }
        else {
            errors_util.ReturnRequestMissingParamteres(res);
        }
    }
});

router.get('/get_share_stash', function (req, res) {
    //http://localhost:3000/transactions/get_share_stash?transaction_id=549b28dde0a96df05e8d1426ad6e6aed
    var user_id = session_util.GetUserId(req.session);
    if (user_id == null) {
        errors_util.ReturnNotLoggedInError(res);
    }
    else {
        /* Make sure the transcation_id field is provided in the GET query. */
        if (req.hasOwnProperty('query') && req.query.hasOwnProperty('transaction_id')) {
            var transaction_id = req.query.transaction_id;
            database_interface.GetShareStash(user_id, transaction_id, true)
                .then((result) => {
                    res.status(200).json({success: true, transaction_data: result});
                })
                .catch((err) => {
                    console.log(err);
                    res.status(401).json({success: false, error: err});

                });
        }
        else {
            errors_util.ReturnRequestMissingParamteres(res);
        }
    }
});

router.post('/create_transaction', function (req, res) {
    var initiator = session_util.GetUserId(req.session);
    var data = JSON.parse(req.body.json_data);
    var cipher_data = data.cipher_data;
    var stash_list = data.stash_list; //[{user_id:"123123", share:"asdasdasdasd"},{},{},...]
    var group_id = data.group_id;
    var transaction_name = data.transaction_name;
    var share_threshold = data.share_threshold;
    var email_list = [];
    for (var i in stash_list) {
        email_list.push(stash_list[i].user_id);
    }
    console.log("In create transaction function... email list:", email_list);
    database_interface.GetUsersByEmailList(email_list)
    .then((data) => {
        console.log("Get users by email list returned:", data);
        if (data.rows.length != email_list.length) {
            reject("Bad input list, not all emails could be mapped to registered users.")
        }
        else {
            for (var i in data.rows) {
                stash_list[i].user_id = data.rows[i].id;
            }
        }
        console.log("#1 returning", data.rows);
        return data.rows;
    })
    .then((data) => {
        return database_interface.CreateStashList(stash_list, group_id);
    })
    .then((share_stashes) => {
        /* Build the data structure to put inside the 'transaction' object, to hold a list of user_id=>share_stash_id for the
         new transaction.
         */
        var list_of_stash_shares_ids = [];
        for (var j in share_stashes) {
            list_of_stash_shares_ids.push({user_id: share_stashes[j].stash_owner, stash_id: share_stashes[j].id});
        }
        console.log("List of share stash", list_of_stash_shares_ids);
        return database_interface.CreateTransaction(initiator, transaction_name, cipher_data, list_of_stash_shares_ids, group_id, share_threshold);
    })
    .then((data) => {
        database_interface.AddTransactionToGroup(group_id, data);
    })
    .then((data) => res.status(201).json({success:true, data:data}))
    .catch((err) => res.status(404).json({success:false, error:err}));
});

router.get('/request_share', function(req,res) {
    //http://localhost:3000/transactions/request_share?transaction_id=ad32d847cbfab0eedfd959debf6e4bd3&share_owner=5ad824afac098982aeb776d5983d7a7f
    //^^ Alice asks bob
    var user_id = session_util.GetUserId(req.session);
    var transaction_id = req.query.transaction_id;
    var share_owner = req.query.share_owner;
    if ((!transaction_id) || (!share_owner)) {
        res.status(404).json({success:false, error: "Invalid Input"});
        return;
    }
    database_interface.RequestShareFromUser(transaction_id, user_id, share_owner)
    .then((data) => {
        res.status(200).json({success: true, transaction_data: data});
    })
    .catch((err) => {
        res.status(404).json({success:false, error: err});

    });
});

/*** GET Handler for /get_my_share
 *   GET params: transaction_id
 *   Response: {"success":true,"share":{"bits":8,"id":3, "data":"7d94bbaf4e158d5cd907094...e6328fb87691"}}
 */
router.get('/get_my_share', function(req, res) {
    //http://localhost:3000/transactions/get_my_share?transaction_id=31d7e197b72a77f80ed736a77043685b
    var user_id = session_util.GetUserId(req.session);
    /* Make sure user is logged in first. */
    if (user_id == null) {
        errors_util.ReturnNotLoggedInError(res);
        return;
    }
    var transaction_id = req.query.transaction_id;
    if (!transaction_id) {
        res.status(404).json({success:false, error: "Invalid Input"});
        return;
    }
    database_interface.GetTransactionsByListOfIds([transaction_id])
    .then((data) => {
        var req_user_id = user_id;
        var doc = data[0].doc;
        var share_found = false;
        for (var i in doc.stash_list) {
            /* Find the requesting user stash id. */
            if (doc.stash_list[i].user_id == req_user_id) {
                share_found = true;
                /* Get the users share stash. */
                var share_stash_id = doc.stash_list[i].stash_id;
                database_interface.GetShareStashByStashID(share_stash_id)
                .then((share_stash) => {
                    for (var i in share_stash) {
                        if (share_stash[i].user_id == req_user_id) {
                            res.status(200).json({success:true, share: share_stash[i].share});
                            return;
                        }
                    }
                    /* This should never happen, if it does, that meanas that the transaction was corrupted.
                       This will only happen if the requesting user can't find his own share in his own stash.
                     */
                    res.status(404).json({success:false, error: "Can't find user share."});
                    return;
                })
                .catch((err) => {
                    res.status(404).json({success:false, error: err});
                    return;
                });
            }
        }
        /* This should never happen either, if this happened, that means that the user requested a transaction
        he is not a part of - he is not in the stash_list struct.
         */
        if (share_found == false) {
            res.status(404).json({success:false, error: "Can't find user share."});
            return;
        }
    })
    .catch((err) => {
        res.status(404).json({success:false, error: err});
    });
});

/*** GET Handler for /get_cipher_data
 *   GET params: transaction_id
 *   Response:
 *   {"success":true,"cipher":{"type":"String","data":"ghdñÿ°ä¶ÌûÏò'¼<4áwÓ1&a¤\u0011n("}}
 */
router.get('/get_cipher_data', function(req, res) {
    //http://localhost:3000/transactions/get_cipher_data?transaction_id=31d7e197b72a77f80ed736a77043685b
    var user_id = session_util.GetUserId(req.session);
    /* Make sure user is logged in first. */
    if (user_id == null) {
        errors_util.ReturnNotLoggedInError(res);
        return;
    }
    var transaction_id = req.query.transaction_id;
    /* Check that transcation_id exist */
    if (transaction_id == null) {
        errors_util.ReturnRequestMissingParamteres(res);
        return;
    }
    database_interface.GetTransactionsByListOfIds([transaction_id])
    .then((data) => {
        var doc = data[0].doc;
        res.status(200).json({success:true, cipher: doc.cipher_meta_data});
    })
    .catch((err) => {
        res.status(404).json({success:false, error: "Invalid Input"});
    });
});

/*** GET Handler for /get_all_shares
 *   GET params: transaction_id
 *   Response: {"success":true,"shares_list":["","",{"bits":8,"id":3,"data":"7d94bbaf4e158d5cd907...f8e6328fb87691"}]}
 */
router.get('/get_all_shares', function(req, res) {
    //http://localhost:3000/transactions/get_all_shares?transaction_id=31d7e197b72a77f80ed736a77043685b
    var user_id = session_util.GetUserId(req.session);
    /* Make sure user is logged in first. */
    if (user_id == null) {
        errors_util.ReturnNotLoggedInError(res);
        return;
    }
    var transaction_id = req.query.transaction_id;
    /* Check that transcation_id exist */
    if (transaction_id == null) {
        errors_util.ReturnRequestMissingParamteres(res);
        return;
    }
    database_interface.GetTransactionsByListOfIds([transaction_id])
        .then((data) => {
            var transaction_doc = data[0].doc;
            for (var i in transaction_doc.stash_list) {
                var doc = transaction_doc.stash_list[i];
                if (doc.user_id == user_id) {
                    database_interface.GetShareStashByStashID(doc.stash_id)
                    .then((stash) => {
                        var list_of_shares = [];
                        for (var i in stash) {
                            list_of_shares.push(stash[i].share);
                        }
                        res.status(200).json({success:true, shares_list: list_of_shares});
                    });
                }
            }
        })
        .catch((err) => {
            res.status(404).json({success:false, error: err});
        });
});

router.post('/commit_share', function(req,res) {
    var user_id = session_util.GetUserId(req.session);
    var transaction_id = req.body.transaction_id;
    var target_user_id = req.body.target_user_id;
    var encrypted_share = JSON.parse(req.body.encrypted_share);

    if ((!transaction_id) || (!target_user_id) || (!encrypted_share)) {
        res.status(404).json({success:false, error: "Invalid Input"});
        return;
    }

    database_interface.GetTransactionsByIdList([transaction_id], function(err, transactions) {
        if (err) {
            res.status(404).json({success:false, error: "Invalid Input"});
        }
        else {
            var transaction_doc = transactions.rows[0].doc;
            for (var i in transaction_doc.stash_list) {
                var doc = transaction_doc.stash_list[i];
                if (doc.user_id == target_user_id) {
                    database_interface.GetShareStashDocByStashID(doc.stash_id, function(err, stash) {
                        if (err) {
                            res.status(404).json({success:false, error: err.message});
                        }
                        else {
                            database_interface.CommitShareToUser(stash, encrypted_share, user_id, function(err, stash) {
                                    if (err) {
                                        res.status(404).json({success:false, error: "Share committing error"});
                                    }
                                    else {
                                        //TODO update notification to be "committed"
                                        res.status(201).json({success:true, message: "Done"});
                                    }
                                }
                            );
                        }
                    });
                }
            }
        }
    });
});




module.exports = router;