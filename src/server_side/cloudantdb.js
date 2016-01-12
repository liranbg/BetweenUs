var CloudantDBModule = (function() {

    // Load the Cloudant library.
    var Cloudant = require('cloudant');
    var logger = require('winston');
    require('dotenv').load({path: './.env'}); //load all environments from .env file

    var db_module_config = {
        users_db_name: 'users',
        groups_db_name: 'groups',
        transactions_db_name: 'transactions',
        shares_db_name: 'shares_stash',
        cloudant_account : {
            account: process.env.cloudant_username,
            password: process.env.cloudant_password
        }
    };

    var cld_db = Cloudant(db_module_config.cloudant_account);

    var InitDataBases =  function() {
        console.log("Initializing UsersDB");
        InitUsersDB();
        console.log("Initializing GroupsDB");
        InitGroupsDB();
        console.log("Initializing SharesStashDB");
        InitSharesStashDB();
        console.log("Initializing TransactionsDB");
        InitTransactionsDB();
    };

    //Private Method for initializing databases

    function InitUsersDB() {
        cld_db.db.create(db_module_config.users_db_name, function () {
            console.log(db_module_config.users_db_name + " database is set");
        });
    }

    function InitGroupsDB() {
        cld_db.db.create(db_module_config.groups_db_name, function () {
            console.log(db_module_config.groups_db_name + " database is set");
        });
        //initialize index for querying db
        var group_db = cld_db.db.use(db_module_config.groups_db_name);
        group_db.index({name:'name', type:'json', index:{fields:['name','creator']}}, function(er, response) {
            if (er) {
                throw er;
            }
            console.log('Index creation result:' + response.result);
        });
    }

    function InitTransactionsDB() {
        cld_db.db.create(db_module_config.transactions_db_name, function () {
            console.log(db_module_config.transactions_db_name + " database is set");
        });

    }

    function InitSharesStashDB() {
        cld_db.db.create(db_module_config.shares_db_name, function () {
            console.log(db_module_config.users_db_name + " database is set");
        });

    }

    //End Private Method for initializing databases

    var CreateShare = function(user_id, data, callback_func) {
        var shares_db = cld_db.db.use(db_module_config.shares_db_name);
        shares_db.insert(
            { user_id: user_id, data: data },
            function(err, data, header) {
                if (err) {
                    console.log('Error encountered while trying to add share: ', err.message);
                    return err;
                }
                callback_func(data);
            });
    };

    var CreateTransaction = function(creator_userid, encrypted_data, user_stash_list, group_id, callback_func) {
        //TODO: Store shares_stash before creating the transaction and then add it to the new transaction
        //user_stash_list - [{user:"liranbg@gmail.com", share:"asdasdasdasd"},{},{},...]
        var data_to_return;
        var transactions_db = cld_db.db.use(db_module_config.transactions_db_name);
        var shares_stash_db = cld_db.db.use(db_module_config.shares_db_name);
        transactions_db.insert(
            { initiator: creator_userid, encrypted_data: encrypted_data, group_id: group_id, shares: [] }, function(err, transaction_body, header) {
                if (err) {
                    console.log('Error encountered while trying to add transaction: ', err.message);
                    return err;
                }
                var list_of_user_stash_to_insert = [];
                for (var i in user_stash_list) {
                    list_of_user_stash_to_insert.push({ group_id:group_id, stash_owner: user_stash_list[i].user, stashed_shares: [user_stash_list[i]]});
                }
                shares_stash_db.bulk({docs: list_of_user_stash_to_insert}, function(err, stash_share_body) {
                        console.log(stash_share_body);
                        var list_of_stash_shares_ids = [];
                        for (var j = 0; j < stash_share_body.length; ++j) {
                            list_of_stash_shares_ids.push(stash_share_body[j].id);
                        }
                        transactions_db.get(transaction_body.id, function(err, doc_to_update){
                            transaction_body._rev = doc_to_update._rev;
                            doc_to_update.shares = list_of_stash_shares_ids;
                            transactions_db.insert(doc_to_update, transaction_body.id, function(err,body) {
                                callback_func(body);
                            })
                        });
                        //transaction_body.shares = list_of_stash_shares_ids;
                    }
                );
            });
    };

    var AddTransactionToGroup = function(group, transaction, callback_func) {
        var group_db = cld_db.db.use(db_module_config.groups_db_name);
        var updated_list = group.transactions;
        updated_list.push(transaction.id);
        group_db.insert({_id:group.id, _rev: group.rev, transactions:updated_list}, function(err, data) {
            if (err) {
                console.log('Error encountered while trying to add a transaction to a group: ', err.message);
                return err;
            }
            callback_func(data);
        });

    };

    var AddShareToTransaction = function(share, transaction, callback_func) {
        var transactions_db = cld_db.db.use(db_module_config.transactions_db_name);
        var updated_list = transaction.shares;
        updated_list.push(share.id);
        transactions_db.insert({_id:transaction.id, _rev: transaction.rev, shares:updated_list}, function(err, data) {
            if (err) {
                console.log('Error encountered while trying to add a share to a transaction: ', err.message);
                return err;
            }
            callback_func(data);
        });
    };

    var AddGroupToUser = function(user, group, callback_func) {
        var users_db = cld_db.db.use(db_module_config.users_db_name);
        //updating user's group list
        user.in_groups.push(group.id);
        users_db.insert(user, user.email, function(err, data) {
            if (err) {
                console.log('Error encountered while trying to add a group to a user: ', err.message);
                return err;
            }
            callback_func(data);
        });

    };

    var InsertNewUser = function (password, email, public_key, callback_func) {
        // TODO: Add hashing and possibly a salt for the password [Discuss either here or on server prior to the request].
        //TODO: check why we can add duplicated users
        var users_db = cld_db.db.use(db_module_config.users_db_name);
        users_db.insert(
            { password: password, in_groups: [], email: email, public_key: public_key }, // Document
            email,                                                        // Identifier
            function(err, data) {                                 // Callback func
                if (err) {
                    console.log('Error encountered while trying to add user: ', err.message);
                    callback_func(err, data);
                }
                else {
                    console.log('User inserted successfully.');
                    callback_func(null, data);
                }

            });
    };

    var CreateNewGroup = function (creator, user_list, group_name, callback_func) {
        // TODO: Check that group name is complaint to some policy we'll set (max length, forbidden chars etc.) [Discuss either here or on server prior to the request].
        var groups_db = cld_db.db.use(db_module_config.groups_db_name);
        groups_db.insert(
            { creator: creator, members: user_list, name: group_name, transactions:[], cipher_text:123123 },                    // Document
            function(err, data, header) {                                                          // Callback func
                if (err) {
                    console.log('Error encountered while trying to add user: ', err.message);
                }
                else {
                    console.log('Group created successfully.', data);
                }
                callback_func(data);
            });
    };

    var GetGroupByNameAndCreator = function (name, creator, callback_func) {
        var group_db = cld_db.db.use(db_module_config.groups_db_name);
        group_db.find({selector:{name:name, creator:creator}}, function (err, data) {
            if (err)
            {
                console.log("Error occurred while fetching group name: ", err.message);
            }
            callback_func(data);
        });
    };

    var GetUserDetailsByEmail = function(email, callback_func) {
        var users_db = cld_db.db.use(db_module_config.users_db_name);
        users_db.get(email, function (err, data) {
            if (err)
            {
                console.log("Error occurred while fetching user email: ", err.message);
            }
            callback_func(data);
        });
    };

    var GetUserByEmail = function(email, callback_func) {
        var users_db = cld_db.db.use(db_module_config.users_db_name);
        users_db.get(email, function (err, data) {
            if (err)
            {
                console.log("Error while fetching user " + email + ", Reason:" + err.message);
                callback_func(err);
                return;
            }
            callback_func(data);
        });
    };

    var GetGroupIdByTransactionId = function(transaction_id, callback_func) {

    };

    var AddUsersToGroup = function(user_emails_list, group, callback_func) {
        var users_db = cld_db.db.use(db_module_config.users_db_name);
        users_db.fetch({keys:user_emails_list}, function(err, data) {
            if (!err) {
                for (var i = 0; i < data.rows.length; ++i) {
                    var doc = data.rows[i].doc;
                    doc.in_groups.push(group.id);
                }
                users_db.bulk({docs: data.rows}, function(err, data) {
                    if (!err) {
                        callback_func(data);
                    }

                });
            }
        })
    };

    var GetUsersPublicKeys = function(user_ids_list, callback_func) {
        //This function returns a list of objects contains for each email its public key
        var users_db = cld_db.db.use(db_module_config.users_db_name);
        users_db.fetch({keys:user_ids_list}, function(err, data) {
            if (!err) {
                var list_of_public_keys = [];
                for (var i = 0; i < data.rows.length; ++i) {
                    var doc = data.rows[i].doc;
                    list_of_public_keys.push({email:doc.email,public_key:doc.public_key});
                }
                callback_func(list_of_public_keys);
            }
        });
    };

    exports.InitDataBases = InitDataBases;

    exports.InsertNewUser =InsertNewUser;
    exports.CreateNewGroup = CreateNewGroup;
    exports.AddShareToTransaction = AddShareToTransaction;
    exports.AddTransactionToGroup = AddTransactionToGroup;
    exports.AddGroupToUser = AddGroupToUser;
    exports.AddUsersToGroup = AddUsersToGroup;
    exports.GetUserDetailsByEmail = GetUserDetailsByEmail;
    exports.GetUsersPublicKeys = GetUsersPublicKeys;
    exports.GetUserByEmail = GetUserByEmail;
    exports.GetGroupByNameAndCreator = GetGroupByNameAndCreator;
    exports.CreateTransaction = CreateTransaction;
    exports.CreateShare = CreateShare;
    exports.GetGroupIdByTransactionId = GetGroupIdByTransactionId;

} (CloudantDBModule || {}));