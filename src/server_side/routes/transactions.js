var express = require('express');
var database_interface = require('../cloudant_interaction');
var session_util = require('../utils/session');
var router = express.Router();


router.get('/get_transaction', function (req, res) {
    //http://localhost:3000/transactions/get_transaction?transaction_id=1afb05dfa0de96545a1756a2a309d7f5
    var user_id = session_util.GetUserId(req.session);
    var transaction_id = req.query.transaction_id;
    if (!transaction_id) {
        res.status(404).json({success:false, error: "Invalid Input"});
        return;
    }
    database_interface.GetTransactionAllInfoById(user_id, transaction_id)
        .then((result) => {
            res.status(200).json({success: true, transaction_data: result});
        })
        .catch((err) => {
            res.status(401).json({success: false, error: err.message});
        });
});

router.get('/get_share_stash', function (req, res) {
    //http://localhost:3000/transactions/get_share_stash?transaction_id=549b28dde0a96df05e8d1426ad6e6aed
    var user_id = session_util.GetUserId(req.session);
    var transaction_id = req.query.transaction_id;
    if (!transaction_id) {
        res.status(404).json({success:false, error: "Invalid Input"});
        return;
    }
    database_interface.GetShareStash(user_id, transaction_id, true)
        .then((result) => {
            res.status(200).json({success: true, transaction_data: result});
        })
        .catch((err) => {
            console.log(err.message);
            res.status(401).json({success: false, error: err.message});

        });
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

    database_interface.GetUsersByEmailList(email_list, function(err, data) {
        //TODO in client side, if we send a list of user name we can avoid using this function
        if (err) {
            res.status(400).json({success:false, error:err.message});
            return;
        }
        else if (data.rows.length != email_list.length) {
            //Did not fetch all users
            res.status(400).json({success:false, error:"Input error in email list"});
            return;
        }
        for (var i in data.rows) {
            //Replace user email in user id
            stash_list[i].user_id = data.rows[i].id;
        }
        database_interface.CreateStashList(stash_list, group_id, function(err, stash_share_body) {
            if (err) {
                res.status(400).json({success:false, error:"Input error in email list"});
            }
            else {
                var list_of_stash_shares_ids = [];
                for (var j = 0; j < stash_share_body.length; ++j) {
                    list_of_stash_shares_ids.push({user_id: stash_share_body[j].stash_owner, stash_id: stash_share_body[j].id});
                }
                database_interface.CreateTransaction(initiator, transaction_name, cipher_data, list_of_stash_shares_ids, group_id, share_threshold, function(err,transaction_body) {
                    if (err) {
                        res.status(400).json({success:false, error:err.message});
                        return;
                    }
                    else {
                        database_interface.AddTransactionToGroup(group_id, transaction_body, function (err, data) {
                            if (err) {
                                //TODO Need to make check the transaction added to the group. if no we must revert all
                                res.status(400).json({success:false, error:err.message});
                            }
                            else {
                                res.status(201).json({success:true, data:data});
                            }
                        });
                    }
                });
            }
        });
    });
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
    database_interface.RequestShareFromUser(transaction_id, user_id, share_owner, function(err, data) {
        if (err) {
            res.status(404).json({success:false, error: err.message});
        }
        else {
            res.status(200).json({success: true, transaction_data: data});
        }
    });

});

router.get('/get_my_share', function(req, res) {
    //http://localhost:3000/transactions/get_my_share?transaction_id=ad32d847cbfab0eedfd959debf6e4bd3
    var user_id = session_util.GetUserId(req.session);
    var transaction_id = req.query.transaction_id;
    if (!transaction_id) {
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
                if (doc.user_id == user_id) {
                    database_interface.GetShareStashByStashID(doc.stash_id, function(err, stash) {
                        if (err) {
                            res.status(404).json({success:false, error: "Invalid Stash Id"});
                        }
                        else {
                            for (var i in stash) {
                                if (stash[i].user_id == user_id) {
                                    res.status(200).json({success:true, share: stash[i].share});
                                }
                            }
                        }
                    });
                }
            }
        }
    });



});

router.get('/get_cipher_data', function(req, res) {
    //http://localhost:3000/transactions/get_cipher_data?transaction_id=24461a3e2b275e168c7f7f428a0ff0d6
    var user_id = session_util.GetUserId(req.session);
    var transaction_id = req.query.transaction_id;
    database_interface.GetTransactionsByIdList([transaction_id], function(err, transactions) {
        if (err) {
            res.status(404).json({success:false, error: "Invalid Input"});
        }
        else {
            var transaction_doc = transactions.rows[0].doc;
            res.status(200).json({success:true, cipher: transaction_doc.cipher_meta_data});
        }
    });
});

router.get('/get_all_shares', function(req, res) {
    //http://localhost:3000/transactions/get_all_shares?transaction_id=ad32d847cbfab0eedfd959debf6e4bd3
    var user_id = session_util.GetUserId(req.session);
    var transaction_id = req.query.transaction_id;
    if (!transaction_id) {
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
                if (doc.user_id == user_id) {
                    database_interface.GetShareStashByStashID(doc.stash_id, function(err, stash) {
                        if (err) {
                            res.status(404).json({success:false, error: "Invalid Stash Id"});
                        }
                        else {
                            var list_of_shares = [];
                            for (var i in stash) {
                                list_of_shares.push(stash[i].share);
                            }
                            res.status(200).json({success:true, shares_list: list_of_shares});
                        }
                    });
                }
            }
        }
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