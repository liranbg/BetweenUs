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
                        for (var i = 0; i < doc.member_list.length ;i++) {
                            emit(doc.member_list[i], doc);
                        }

                        if (doc.creator) {
                            emit(doc.creator, doc);
                        }
                    }
                },
                "get_groups_metadata_by_user": {
                    "map": function(doc) {
                        for (var i = 0; i < doc.member_list.length ;i++) {
                            emit(doc.member_list[i], {
                                group_id: doc._id, group_name: doc.group_name, transactions_length: doc.transaction_list.length, members_length: doc.member_list.length +1 //+1 for creator
                            });
                        }

                        if (doc.creator) {
                            emit(doc.creator, {
                                group_id: doc._id, group_name: doc.group_name, transactions_length: doc.transaction_list.length, members_length: doc.member_list.length +1 //+1 for creator
                            });
                        }
                    }
                }
            }
        },
        transactions_db: {
            "views": {
                "get_transaction_info_by_id": {
                    "map": function (doc) {
                        if (doc.metadata.scheme == "transaction") {
                            emit(doc._id, {
                                transaction_name: doc.transaction_name,
                                group_id: doc.group_id,
                                threshold: doc.threshold,
                                initiator: doc.initiator }
                            );
                        }
                    }
                },
                'get_transaction_share_stash': {
                    "map": function (doc) {
                        for (var i in doc.stash_list) {
                            emit({transaction_id: doc._id, user_id:doc.stash_list[i].user_id}, doc.stash_list[i].stash_id);
                        }
                    }
                }
            }
        },
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
        transactions_db: {
            name: 'transactions',
            api: {
                get_transaction_info_by_id: {
                    name: "get_transaction_info_by_id",
                    design_name: "api"
                },
                get_transaction_share_stash: {
                    name: "get_transaction_share_stash",
                    design_name: "api"
                }
            }
        },
        shares_stash_db_name: 'shares_stash',
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
    var transactions_db = cld_db.db.use(db_module_config.transactions_db.name);
    var shares_stash_db = cld_db.db.use(db_module_config.shares_stash_db_name);

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
                    logger.info("InitUsersDB: %s", data);
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
        cld_db.db.create(db_module_config.transactions_db.name, function () {
            logger.info(db_module_config.transactions_db.name + " database is set");
            transactions_db.update(views.transactions_db, '_design/api',function(err, data) {
                if (err) {
                    logger.error("InitTransactionDB: %s", err);
                }
                else {
                    logger.info("InitTransactionDB: %s", data);
                }
            });
        });

    }
    function InitSharesStashDB() {
        cld_db.db.create(db_module_config.shares_stash_db_name, function () {
            logger.info(db_module_config.shares_stash_db_name + " database is set");
        });
    }
    //End Private Method for initializing databases

    //Transactions Related Functions

    /***
     * This function gets a transaction id and returns its data including initiator name and its group name
     * The return document includes:
     *      -
     * @param transaction_id
     * @param callback_func
     * @constructor
     */
    var GetTransactionInfoById = function(transaction_id, callback_func) {
        var transaction_data = {};
        var view_name = db_module_config.transactions_db.api.get_transaction_info_by_id.name;
        var design_name = db_module_config.transactions_db.api.get_transaction_info_by_id.design_name;
        transactions_db.view(design_name, view_name, { keys: [transaction_id] }, function (err, transaction_doc) {
            if (err) {
                logger.error("GetTransactionInfoById: %s", err.message);
            }
            else {
                console.log(transaction_data.name = transaction_doc.rows[0]);
                console.log(transaction_data.name = transaction_doc.rows[0].value);
                transaction_data.key = transaction_doc.id;
                transaction_data.transaction_name = transaction_doc.rows[0].value.transaction_name;
                transaction_data.threshold = transaction_doc.rows[0].value.threshold;
                transaction_data.initiator = {
                    initiator_id: transaction_doc.rows[0].value.initiator,
                    initiator_email : ""
                };
                var group_id = transaction_doc.rows[0].value.group_id;
                GetGroupDataByGroupId(group_id, function(err, group_doc) {
                    if (err) {
                        logger.error("GetTransactionInfoById: GetGroupDataByGroupId- %s", err.message);
                    }
                    else {
                        transaction_data.group_data = {
                            group_id: group_doc.id,
                            group_name: group_doc.group_name
                        };
                    }
                    GetUsersByIdsList([transaction_data.initiator.initiator_id], function(err, user_doc) {
                        if (err) {
                            logger.error("GetTransactionInfoById: GetUsersByIdsList- %s", err.message);
                        }
                        else {
                            var doc = user_doc.rows[0].doc;
                            transaction_data.initiator = {
                                initiator_id: doc._id,
                                initiator_email: doc.email
                            };
                            callback_func(err, transaction_data);
                        }
                    });
                });
            }
        });
    };

    var GetTransactionsByIdList  = function(list_of_transaction_id, callback_func) {
        transactions_db.fetch({keys:list_of_transaction_id}, function(err, data) {
            if (err) {
                logger.error("GetTransactionsByIdList: fetch - %s", err.message);
            }
            callback_func(err, data);
        });
    };

    var CreateTransaction = function(creator_userid, transaction_name, cipher_data, user_stash_list, group_id, share_threshold, callback_func) {
        //TODO: Store shares_stash before creating the transaction and then add it to the new transaction
        //user_stash_list - [{user_id:"123assss", share:"asdasdasdasd"},{},{},...]
        var new_transaction_doc = {
            metadata: {
                scheme: "transaction",
                scheme_version: "1.0",
                creation_time: (new Date()).toISOString()
            },
            initiator: creator_userid,
            transaction_name: transaction_name,
            cipher_meta_data:{
                type: "String",
                data: cipher_data
            },
            group_id: group_id,
            threshold: share_threshold,
            stash_list: []
        };
        var email_list = [];
        for (var i in user_stash_list) {
            email_list.push(user_stash_list[i].user_id);
        }
        GetUsersByEmailList(email_list, function(err, data) {
            var list_of_user_stash_to_insert = [];
            for (var i in data.rows) {
                user_stash_list[i].user_id = data.rows[i].id;
            }

            CreateStashList(user_stash_list, group_id, function(err, stash_share_body) {
                if (err) {
                    logger.error("CreateTransaction: CreateStashList - %s", err.message);
                    callback_func(err, stash_share_body);
                }
                else {
                    console.log(stash_share_body);
                    var list_of_stash_shares_ids = [];
                    for (var j = 0; j < stash_share_body.length; ++j) {
                        list_of_stash_shares_ids.push({user_id: stash_share_body[j].stash_owner, stash_id: stash_share_body[j].id});
                    }
                    new_transaction_doc.stash_list = list_of_stash_shares_ids;
                    transactions_db.insert(new_transaction_doc, function(err, transaction_body) {
                        if (err) {
                            //TODO remove all created stash
                            logger.error("CreateTransaction: Insert - %s", err.message);
                        }
                        AddTransactionToGroup(group_id, transaction_body, function(err, data) {
                            if (err) {
                                logger.error("CreateTransaction: AddTransactionToGroup - %s", err.message);
                            }
                            callback_func(err, transaction_body);
                        });

                    });

                }

            });

        });

    };

    var CreateStashList = function(user_stash_list, group_id, callback_func) {
        //user_stash_list - [{user_id:"123assss", share:"asdasdasdasd"},{},{},...]
        var list_of_user_stash_to_insert = [];
        for (var i in user_stash_list) {
            var user_stash_doc = {
                metadata: {
                    scheme: "share_stash",
                    scheme_version: "1.0",
                    creation_time: (new Date()).toISOString()
                },
                stash_owner: user_stash_list[i].user_id,
                share_list: [
                    user_stash_list[i]
                ],
                group_id:group_id
            };
            list_of_user_stash_to_insert.push(user_stash_doc);
        }
        shares_stash_db.bulk({docs: list_of_user_stash_to_insert}, function(err, stash_share_body) {
            if (err) {
                logger.error("CreateTransaction: Bulk - %s", err.message);
            }
            else {
                for (var i in stash_share_body) {
                    stash_share_body[i].stash_owner = list_of_user_stash_to_insert[i].stash_owner;
                }
            }
            callback_func(err, stash_share_body);
        })};

    /***  GetStashList
     * FLOW:
     * Receive input of User_ID, Transaction_ID to act as our unique key in a predefined view.
     * Query that view with our keys, in order to obtain the relevant Stash ID.
     * Query the Stash DB to retrieve the Stash document associated with the above ID.
     *
     * @param user_id - user id whose stash to find
     * @param transaction_id - transaction id for the share.
     * @param callback_func - callback function to pass produced data into.
     * @constructor
     */
    var GetShareStash = function(user_id, transaction_id, callback_func) {
        var view_name = db_module_config.transactions_db.api.get_transaction_share_stash.name;
        var design_name = db_module_config.transactions_db.api.get_transaction_share_stash.design_name;
        /* Initial call to produce a stash ID for the user_id and transaction_id */
        transactions_db.view(design_name, view_name, { keys: [{transaction_id: transaction_id, user_id: user_id}] }, function (err, data) {
            if (err) {
                logger.error("GetStashList: %s", err.message);
                callback_func(err, data);
            }
            else {
                /* Once here, we have Stash ID, retrieve stash from the database. */
                var stash_id = data.rows[0].value;
                GetShareStashByStashID(stash_id, callback_func);
            }
        })
    };

    /*** GetShareStashByStashID
     * Recieves a stash id, retrieves the shares from the stash and invokes the callback function with the result.
     *
     * @param share_stash_id
     * @param callback_func
     * @constructor
     */
    var GetShareStashByStashID = function(share_stash_id, callback_func) {
        shares_stash_db.get(share_stash_id, function (err, data) {
            if (err) {
                logger.error("GetShareStashByStashID: %s", err.message);
            }
            else {
                var share_list = data.share_list;
            }
            callback_func(err, share_list);
        });
    };

    var AddTransactionToGroup = function(group_id, transaction_doc, callback_func) {
        groups_db.get(group_id, function (err, group_data) {
            if (err) {
                logger.error("CreateTransaction: Groups Get - %s", err.message);
                callback_func(err, group_data);
                return;
            }
            group_data.transaction_list.push(transaction_doc.id);
            groups_db.update(group_data, group_data._id, function(err, data) {
                if (err) {
                    logger.error("AddTransactionToGroup: %s", err.message);
                }
                callback_func(err, data);
            });
        });
    };

    var AddGroupToUser = function(user, group, callback_func) {
        //updating user's group list
        user.groups.push(group.id);
        users_db.insert(user, user.id, function(err, data) {
            if (err) {
                logger.error("AddGroupToUser: %s", err.message);
            }
            callback_func(err, data);
        });

    };

    var InsertNewUser = function (password, email, public_key, callback_func) {
        // TODO: Add hashing and possibly a salt for the password [Discuss either here or on server prior to the request].
        var user_doc = {
            "metadata": {
                "scheme": "user",
                "scheme_version": "1.0",
                "registration_time": (new Date()).toISOString(), //ISO FORMAT DATE STRING
                "last_login_time": "" //ISO FORMAT DATE STRING,
            },
            "email": email,
            "password": password,
            "public_key": public_key,
            "groups": [  ],
            "notifications_stash": ""

        };
        users_db.insert(
            user_doc, // Document
            function(err, data) {                                 // Callback func
                if (err) {
                    logger.error("InsertNewUser: %s", err.message);
                }
                callback_func(err, data);
            });
    };

    var CreateGroup = function (creator, list_of_users_ids, group_name, callback_func) {
        // TODO: Check that group name is complaint to some policy we'll set (max length, forbidden chars etc.) [Discuss either here or on server prior to the request].
        var group_doc = {
            "metadata": {
                "scheme": "group",
                "scheme_version": "1.0",
                "creation_time": (new Date()).toISOString()
            },
            "creator": creator,
            "group_name": group_name,
            "member_list": list_of_users_ids,
            "transaction_list": [ ]
        };
        groups_db.insert(
            group_doc,                    // Document
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
                group_data.group_name = data.group_name;
                group_data.id = data._id;
                group_data.member_list = [];

                var users_ids = data.member_list;
                users_ids.push(data.creator);

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
                                group_data.member_list.push({email:doc.email, user_id: doc._id});
                            }
                        }
                        group_data.transaction_list = data.transaction_list;
                        GetTransactionsByIdList(group_data.transaction_list, function(err, transaction_data) {
                            if (err) {
                                logger.error("GetGroupDataByGroupId: GetTransactionsByIdList: %s", err.message);
                            }
                            else {
                                group_data.transaction_list = [];
                                for (var i in transaction_data.rows) {
                                    group_data.transaction_list.push({
                                        transaction_id: transaction_data.rows[i].id,
                                        transaction_name: transaction_data.rows[i].doc.transaction_name
                                    })
                                }
                                callback_func(err, group_data);
                            }
                        });
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
            doc.groups.push(group.id);
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
    exports.GetTransactionById = GetTransactionInfoById;
    exports.AddTransactionToGroup = AddTransactionToGroup;
    exports.GetShareStash = GetShareStash;

} (CloudantDBModule || {}));
