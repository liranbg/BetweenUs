var CloudantDBModule = (function() {

    // Load the Cloudant library.
    var Cloudant = require('cloudant');
    var logger = require('winston');
    require('dotenv').load({path: './.env'}); //load all environments from .env file



    //Databases views definitions
    var views = {
        users_db: {
            "views": {
                "get_user_doc_by_email": {
                    "map": function (doc) {
                        if (doc.email) {
                            emit(doc.email, doc);
                        }
                    }
                }
            }
        },
        groups_db: {
            "views": {
                "get_groups_by_user": {
                    "map": function (doc) {
                        for (var i = 0; i < doc.members.length ;i++) {
                            emit(doc.members[i], doc);
                        }

                        if (doc.creator) {
                            emit(doc.creator, doc);
                        }
                    }
                },
                "get_groups_metadata_by_user": {
                    "map": function(doc) {
                        for (var i = 0; i < doc.members.length ;i++) {
                            emit(doc.members[i], {
                                group_id: doc._id, name: doc.name, transactions_length: doc.transactions.length, members_length: doc.members.length +1 //+1 for creator
                            });
                        }

                        if (doc.creator) {
                            emit(doc.creator, {
                                group_id: doc._id, name: doc.name, transactions_length: doc.transactions.length, members_length: doc.members.length +1 //+1 for creator
                            });
                        }
                    }
                }
            }
        }
        // { creator: creator, members: user_list, name: group_name, transactions:[] },
    };

    //Databases configurations
    var db_module_config = {
        users_db: {
            name: 'users',
            api: {
                get_user_doc_by_email: {
                    name: "get_user_doc_by_email",
                    design_name: "api"
                }
            }
        },
        groups_db: {
            name: 'groups',
            api: {
                get_groups_by_user: {
                    name: "get_groups_by_user",
                    design_name: "api"
                },
                get_groups_metadata_by_user: {
                    name: "get_groups_metadata_by_user",
                    design_name: "api"
                }
            }
        },
        transactions_db_name: 'transactions',
        shares_db_name: 'shares_stash',
        cloudant_account : {
            account: process.env.cloudant_username,
            password: process.env.cloudant_password
        }
    };

    //Database global variables initialization
    var cld_db = Cloudant(db_module_config.cloudant_account);

    var extension = function(db) {
        var update = function(obj, key, callback) {
            var db = this;
            db.get(key, function (error, existing) {
                if(!error) {
                    obj._rev = existing._rev;
                }
                db.insert(obj, key, callback);
            });
        };
        // add Cloudant special functions
        var obj = cld_db._use(db);
        obj.update = update;
        return obj;

    };
    cld_db.db.use = extension;

    var groups_db = cld_db.db.use(db_module_config.groups_db.name);
    var users_db = cld_db.db.use(db_module_config.users_db.name);
    var transactions_db = cld_db.db.use(db_module_config.transactions_db_name);
    var shares_stash_db = cld_db.db.use(db_module_config.shares_db_name);

    /*
     Databases initialization
     */
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
            users_db.update(views.users_db, '_design/api',function(err, data) {
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
        cld_db.db.create(db_module_config.groups_db.name, function () {
            logger.info(db_module_config.groups_db.name + " database is set");
            groups_db.update(views.groups_db, '_design/api',function(err, data) {
                if (err) {
                    logger.error("InitGroupDB: %s", err);
                }
                else {
                    logger.info("InitGroupDB: %s", data);
                }
            });
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

    var CreateTransaction = function(creator_userid, encrypted_data, user_stash_list, group_id, share_threshold, callback_func) {
        //TODO: Store shares_stash before creating the transaction and then add it to the new transaction
        //TODO: add transaction to group
        //user_stash_list - [{user_id:"liranbg@gmail.com", share:"asdasdasdasd"},{},{},...]
        var new_transaction_doc = {
            initiator: creator_userid,
            encrypted_data: encrypted_data,
            group_id: group_id,
            share_threshold: share_threshold,
            shares: []
        };
        var list_of_user_stash_to_insert = [];
        for (var i in user_stash_list) {
            list_of_user_stash_to_insert.push({ group_id:group_id, stash_owner: user_stash_list[i].user_id, stashed_shares: [user_stash_list[i]]});
        }
        shares_stash_db.bulk({docs: list_of_user_stash_to_insert},{include_docs :true}, function(err, stash_share_body) {
                if (err) {
                    logger.error("CreateTransaction: Bulk - %s", err.message);
                    callback_func(err, stash_share_body);
                }
                else {
                    var list_of_stash_shares_ids = [];
                    for (var j = 0; j < stash_share_body.length; ++j) {
                        list_of_stash_shares_ids.push({user_id: list_of_user_stash_to_insert[i].stash_owner, stash_id: stash_share_body[j].id});
                    }
                    new_transaction_doc.shares = list_of_stash_shares_ids;
                    transactions_db.insert(new_transaction_doc, function(err, transaction_body) {
                        if (err) {
                            //TODO remove all created stash
                            logger.error("CreateTransaction: Insert - %s", err.message);
                        }
                        callback_func(err, transaction_body);

                    });
                }
            }
        );
    };

    var AddTransactionToGroup = function(group, transaction, callback_func) {
        var updated_list = group.transactions;
        updated_list.push(transaction.id);
        groups_db.insert({_id:group.id, _rev: group.rev, transactions:updated_list}, function(err, data) {
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
        users_db.insert(
            { password: password, in_groups: [], email: email, public_key: public_key }, // Document
            function(err, data) {                                 // Callback func
                if (err) {
                    logger.error("InsertNewUser: %s", err.message);
                }
                callback_func(err, data);
            });
    };

    var CreateGroup = function (creator, list_of_users_ids, group_name, callback_func) {
        // TODO: Check that group name is complaint to some policy we'll set (max length, forbidden chars etc.) [Discuss either here or on server prior to the request].
        groups_db.insert(
            { creator: creator, members: list_of_users_ids, name: group_name, transactions:[] },                    // Document
            function(err, data) {                                                          // Callback func
                if (err) {
                    logger.error("CreateGroup: %s", err.message);
                }
                callback_func(err, data);
            });
    };

    var GetAllMyGroups = function (user_id, callback_func) {
        var view_name = db_module_config.groups_db.api.get_groups_metadata_by_user.name;
        var design_name = db_module_config.groups_db.api.get_groups_metadata_by_user.design_name;
        groups_db.view(design_name, view_name, { keys: [user_id] }, function (err, data) {
            if (err) {
                logger.error("GetAllMyGroups: %s", err.message);
            }
            callback_func(err, data);

        });
    };

    var GetUserByEmail = function(email, callback_func) {
        var view_name = db_module_config.users_db.api.get_user_doc_by_email.name;
        var design_name = db_module_config.users_db.api.get_user_doc_by_email.design_name;
        users_db.view(design_name, view_name, { keys: [email] }, function (err, data) {
            if (err) {
                logger.error("GetUserByEmail: %s", err.message);
            }
            callback_func(err, data);
        });
    };

    var GetUsersByEmailList = function(email_list, callback_func) {
        var view_name = db_module_config.users_db.api.get_user_doc_by_email.name;
        var design_name = db_module_config.users_db.api.get_user_doc_by_email.design_name;
        users_db.view(design_name, view_name, { keys: email_list }, function (err, data) {
            if (err) {
                logger.error("GetUserByEmail: %s", err.message);
            }
            callback_func(err, data);
        });
    };

    var GetUsersByIdsList = function(ids_list, callback_func) {
        users_db.fetch({ keys: ids_list }, function (err, data) {
            if (err) {
                logger.error("GetUserByEmail: %s", err.message);
            }
            callback_func(err, data);
        });
    };

    var IsUserExists = function(email, callback_func) {
        var view_name = db_module_config.users_db.api.get_user_doc_by_email.name;
        var design_name = db_module_config.users_db.api.get_user_doc_by_email.design_name;
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
    var GetGroupDataByGroupId = function(group_id, callback_func) {
        groups_db.get(group_id, function (err, data) {
            if (err) {
                logger.error("GetGroupDataByGroupId: %s", err.message);
                callback_func(err, data);
            }
            else {
                var group_data = {};
                group_data.group_name = data.name;
                group_data.id = data._id;
                group_data.members = [];

                var users_ids = data.members;
                users_ids.push(data.creator);
                var transactions_ids = data.transactions;
                GetUsersByIdsList(users_ids, function(err, users_data) {
                    if (err) {
                        logger.error("GetGroupDataByGroupId: GetUsersByIdsList: %s", err.message);
                    }
                    else {
                        for (var i = 0; i < users_data.rows.length; ++i) {
                            var doc = users_data.rows[i].doc;
                            if (doc._id == data.creator) {
                                group_data.creator = { email:doc.email, user_id:doc._id };
                            }
                            else {
                                group_data.members.push({email:doc.email, user_id: doc._id});
                            }
                        }
                        group_data.transactions = data.transactions;
                        callback_func(err, group_data);
                    }
                });
            }

        });

    };

    var AddUsersToGroup = function(users_doc, group, callback_func) {
        var docs_to_update = [];
        var doc;
        for (var i = 0; i < users_doc.rows.length; ++i) {
            doc = users_doc.rows[i].value;
            doc.in_groups.push(group.id);
            docs_to_update.push(doc);
        }
        users_db.bulk({docs: docs_to_update}, function(err, updated_data) {
            if (err) {
                logger.error("AddUsersToGroup: bulk - %s", err.message);
            }
            callback_func(err, updated_data);
        });
    };

    var GetUsersPublicKeys = function(user_ids_list, callback_func) {
        //This function returns a list of objects contains for each email its public key
        users_db.fetch({keys:user_ids_list}, function(err, data) {
            var list_of_public_keys = [];
            if (err) {
                logger.error("GetUsersPublicKeys: fetch - %s", err.message);
            }
            else {
                for (var i = 0; i < data.rows.length; ++i) {
                    var doc = data.rows[i].doc;
                    list_of_public_keys.push({user_id: doc._id, email:doc.email,public_key:doc.public_key});
                }
                callback_func(err, list_of_public_keys);
            }
        });
    };

    exports.InitDataBases = InitDataBases;
    exports.InsertNewUser =InsertNewUser;

    exports.IsUserExists = IsUserExists;
    exports.AddGroupToUser = AddGroupToUser;
    exports.AddUsersToGroup = AddUsersToGroup;
    exports.GetUserByEmail = GetUserByEmail;
    exports.GetUsersByEmailList = GetUsersByEmailList;
    exports.GetUsersByIdsList = GetUsersByIdsList;
    exports.GetUsersPublicKeys = GetUsersPublicKeys;

    exports.CreateGroup = CreateGroup;
    exports.GetAllMyGroups = GetAllMyGroups;
    exports.GetGroupDataByGroupId = GetGroupDataByGroupId;

    exports.CreateTransaction = CreateTransaction;
    exports.CreateShare = CreateShare;
    exports.AddShareToTransaction = AddShareToTransaction;
    exports.AddTransactionToGroup = AddTransactionToGroup;



} (CloudantDBModule || {}));
