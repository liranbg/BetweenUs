var CloudantDBModule = (function() {

    var views = {
        user_db: {
            "views": {
                "get_user_doc_by_email": {
                    "map": function (doc) {
                        if (doc.email) {
                            emit(doc.email, doc)
                        }
                    }
                }
            }
        }
    };
    // Load the Cloudant library.
    var Cloudant = require('cloudant');
    var logger = require('winston');
    require('dotenv').load({path: './.env'}); //load all environments from .env file

    var db_module_config = {
        users_db: {
            name: 'users',
            api: {
                user_data_by_email: {
                    name: "get_user_doc_by_email",
                    design_name: "api"
                }
            }
        },
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
        logger.info("Initializing UsersDB");
        InitUsersDB();
        logger.info("Initializing GroupsDB");
        InitGroupsDB();
        logger.info("Initializing SharesStashDB");
        InitSharesStashDB();
        logger.info("Initializing TransactionsDB");
        InitTransactionsDB();
    };

    //Private Method for initializing databases

    function InitUsersDB() {
        cld_db.db.create(db_module_config.users_db.name, function () {
            logger.info(db_module_config.users_db.name + " database is set");
            var users_db = cld_db.db.use(db_module_config.users_db.name);
            users_db.insert(views.user_db, '_design/api',function(err, data) {
                if (err) {
                    logger.error("InitUsersDB: %s", err);
                }
                else {
                    logger.info("InitUsersDB: %s" + data);
                }

            });
        });
    }

    function InitGroupsDB() {
        cld_db.db.create(db_module_config.groups_db_name, function () {
            logger.info(db_module_config.groups_db_name + " database is set");
        });
    }

    function InitTransactionsDB() {
        cld_db.db.create(db_module_config.transactions_db_name, function () {
            logger.info(db_module_config.transactions_db_name + " database is set");
        });

    }

    function InitSharesStashDB() {
        cld_db.db.create(db_module_config.shares_db_name, function () {
            logger.info(db_module_config.shares_db_name + " database is set");
        });

    }

    //End Private Method for initializing databases

    var CreateShare = function(user_id, data, callback_func) {
        var shares_db = cld_db.db.use(db_module_config.shares_db_name);
        shares_db.insert(
            { user_id: user_id, data: data },
            function(err, data) {
                if (err) {
                    logger.error("CreateShare: %s", err.message);
                }
                callback_func(err, data);
            });
    };

    var CreateTransaction = function(creator_userid, encrypted_data, user_stash_list, group_id, callback_func) {
        //TODO: Store shares_stash before creating the transaction and then add it to the new transaction
        //user_stash_list - [{user:"liranbg@gmail.com", share:"asdasdasdasd"},{},{},...]
        var transactions_db = cld_db.db.use(db_module_config.transactions_db_name);
        var shares_stash_db = cld_db.db.use(db_module_config.shares_db_name);
        transactions_db.insert(
            { initiator: creator_userid, encrypted_data: encrypted_data, group_id: group_id, shares: [] }, function(err, transaction_body) {
                if (err) {
                    logger.error("CreateTransaction: Insert - %s", err.message);
                    callback_func(err, transaction_body);
                }
                else {
                    var list_of_user_stash_to_insert = [];
                    for (var i in user_stash_list) {
                        list_of_user_stash_to_insert.push({ group_id:group_id, stash_owner: user_stash_list[i].user, stashed_shares: [user_stash_list[i]]});
                    }
                    shares_stash_db.bulk({docs: list_of_user_stash_to_insert}, function(err, stash_share_body) {
                            if (err) {
                                logger.error("CreateTransaction: Bulk - %s", err.message);
                                callback_func(err, stash_share_body);
                            }
                            else {
                                var list_of_stash_shares_ids = [];
                                for (var j = 0; j < stash_share_body.length; ++j) {
                                    list_of_stash_shares_ids.push(stash_share_body[j].id);
                                }
                                transactions_db.get(transaction_body.id, function(err, doc_to_update){
                                    transaction_body._rev = doc_to_update._rev;
                                    doc_to_update.shares = list_of_stash_shares_ids;
                                    transactions_db.insert(doc_to_update, transaction_body.id, function(err,body) {
                                        if (err) {
                                            logger.error("CreateTransaction: Update - %s", err.message);
                                        }
                                        callback_func(err, body);
                                    })
                                });
                            }
                        }
                    );
                }

            });
    };

    var AddTransactionToGroup = function(group, transaction, callback_func) {
        var group_db = cld_db.db.use(db_module_config.groups_db_name);
        var updated_list = group.transactions;
        updated_list.push(transaction.id);
        group_db.insert({_id:group.id, _rev: group.rev, transactions:updated_list}, function(err, data) {
            if (err) {
                logger.error("AddTransactionToGroup: %s", err.message);
            }
            callback_func(err, data);
        });

    };

    var AddShareToTransaction = function(share, transaction, callback_func) {
        var transactions_db = cld_db.db.use(db_module_config.transactions_db_name);
        var updated_list = transaction.shares;
        updated_list.push(share.id);
        transactions_db.insert({_id:transaction.id, _rev: transaction.rev, shares:updated_list}, function(err, data) {
            if (err) {
                logger.error("AddShareToTransaction: %s", err.message);
            }
            callback_func(err, data);
        });
    };

    var AddGroupToUser = function(user, group, callback_func) {
        var users_db = cld_db.db.use(db_module_config.users_db.name);
        //updating user's group list
        user.in_groups.push(group.id);
        users_db.insert(user, user.id, function(err, data) {
            if (err) {
                logger.error("AddGroupToUser: %s", err.message);
            }
            callback_func(err, data);
        });

    };

    var InsertNewUser = function (password, email, public_key, callback_func) {
        // TODO: Add hashing and possibly a salt for the password [Discuss either here or on server prior to the request].
        var users_db = cld_db.db.use(db_module_config.users_db.name);
        users_db.insert(
            { password: password, in_groups: [], email: email, public_key: public_key }, // Document
            function(err, data) {                                 // Callback func
                if (err) {
                    logger.error("InsertNewUser: %s", err.message);
                }
                callback_func(err, data);
            });
    };

    var CreateNewGroup = function (creator, user_list, group_name, callback_func) {
        // TODO: Check that group name is complaint to some policy we'll set (max length, forbidden chars etc.) [Discuss either here or on server prior to the request].
        var groups_db = cld_db.db.use(db_module_config.groups_db_name);
        groups_db.insert(
            { creator: creator, members: user_list, name: group_name, transactions:[] },                    // Document
            function(err, data) {                                                          // Callback func
                if (err) {
                    logger.error("CreateNewGroup: %s", err.message);
                }
                callback_func(err, data);
            });
    };

    var GetAllMyGroups = function (user_id, callback_func) {
        var group_db = cld_db.db.use(db_module_config.groups_db_name);
        group_db.find({selector:{name:name, creator:creator}}, function (err, data) {
            if (err) {
                logger.error("GetGroupByNameAndCreator: %s", err.message);
            }
            callback_func(err, data);
        });
    };

    var GetUserByEmail = function(email, callback_func) {
        var users_db = cld_db.db.use(db_module_config.users_db.name);
        var view_name = db_module_config.users_db.api.user_data_by_email.name;
        var design_name = db_module_config.users_db.api.user_data_by_email.design_name;
        users_db.view(design_name, view_name, { keys: [email] }, function (err, data) {
            if (err) {
                logger.error("GetUserByEmail: %s", err.message);
            }
            callback_func(err, data);
        });
    };

    var IsUserExists = function(email, callback_func) {
        var users_db = cld_db.db.use(db_module_config.users_db.name);
        var view_name = db_module_config.users_db.api.user_data_by_email.name;
        var design_name = db_module_config.users_db.api.user_data_by_email.design_name;
        users_db.view(design_name, view_name, { keys: [email] }, function (err, data) {
            if (err) {
                logger.error("GetUserByEmail: %s", err.message);
                callback_func(err, data);
            }
            else {
                if (data.rows.length == 0) {
                    callback_func(null, false);

                }
                else {
                    callback_func(err, true);
                }

            }

        });
    };

    var GetGroupIdByTransactionId = function(transaction_id, callback_func) {

    };

    var AddUsersToGroup = function(user_emails_list, group, callback_func) {
        var users_db = cld_db.db.use(db_module_config.users_db.name);
        var view_name = db_module_config.users_db.api.user_data_by_email.name;
        var design_name = db_module_config.users_db.api.user_data_by_email.design_name;
        users_db.view(design_name, view_name, { keys: user_emails_list }, function (err, data) {
            if (err) {
                logger.error("AddUsersToGroup: fetch - %s", err.message);
                callback_func(err, data);
            }
            else {
                if (data.rows.length == 0) {
                    callback_func(err, false);
                }
                else {
                    for (var i = 0; i < data.rows.length; ++i) {
                        var doc = data.rows[i].doc;
                        doc.in_groups.push(group.id);
                    }
                    users_db.bulk({docs: data.rows}, function(err, updated_data) {
                        if (err) {
                            logger.error("AddUsersToGroup: bulk - %s", err.message);
                        }
                        callback_func(err, updated_data);
                    });
                }
            }
        });
    };

    var GetUsersPublicKeys = function(user_ids_list, callback_func) {
        //This function returns a list of objects contains for each email its public key
        var users_db = cld_db.db.use(db_module_config.users_db.name);
        users_db.fetch({keys:user_ids_list}, function(err, data) {
            var list_of_public_keys = [];
            if (err) {
                logger.error("GetUsersPublicKeys: fetch - %s", err.message);
            }
            else {
                for (var i = 0; i < data.rows.length; ++i) {
                    var doc = data.rows[i].doc;
                    list_of_public_keys.push({email:doc.email,public_key:doc.public_key});
                }
                callback_func(err, list_of_public_keys);
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
    exports.GetUsersPublicKeys = GetUsersPublicKeys;
    exports.GetUserByEmail = GetUserByEmail;
    exports.IsUserExists = IsUserExists;
    exports.GetAllMyGroups = GetAllMyGroups;
    exports.CreateTransaction = CreateTransaction;
    exports.CreateShare = CreateShare;
    exports.GetGroupIdByTransactionId = GetGroupIdByTransactionId;

} (CloudantDBModule || {}));
