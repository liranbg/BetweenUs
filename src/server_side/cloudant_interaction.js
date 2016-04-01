'use strict';
var PouchDB = require('pouchdb');
require('dotenv').load({path: './.env'}); //load all environments from .env file


let _singleton = Symbol();

class ServerInteraction {
    constructor(singletonToken) {
        if(_singleton != singletonToken) throw "Cannot construct singleton"; //ensure singleton
        this._views = {
            /* In PouchDB we need to apply toString on the map, since the module excepts a string and not an object. */
            users_db: {
                get_user_doc_by_email: {
                    map: function (doc) {
                        if (doc.email) {
                            emit(doc.email, doc);
                        }
                    }.toString()
                }
            },
            groups_db: {
                get_groups_by_user: {
                    map: function (doc) {
                        for (var i = 0; i < doc.member_list.length; i++) {
                            emit(doc.member_list[i], doc);
                        }
                        if (doc.creator) {
                            emit(doc.creator, doc);
                        }
                    }.toString()
                },
                get_groups_metadata_by_user: {
                    map: function (doc) {
                        for (var i = 0; i < doc.member_list.length; i++) {
                            emit(doc.member_list[i], {
                                group_id: doc._id,
                                group_name: doc.group_name,
                                transactions_length: doc.transaction_list.length,
                                members_length: doc.member_list.length + 1 //+1 for creator
                            });
                        }
                        if (doc.creator) {
                            emit(doc.creator, {
                                group_id: doc._id,
                                group_name: doc.group_name,
                                transactions_length: doc.transaction_list.length,
                                members_length: doc.member_list.length + 1 //+1 for creator
                            });
                        }
                    }.toString()
                }

            },
            transactions_db: {
            get_transaction_info_by_id: {
                map: function (doc) {
                    if (doc.metadata.scheme == "transaction") {
                        emit(doc._id, {
                                transaction_name: doc.transaction_name,
                                group_id: doc.group_id,
                                threshold: doc.threshold,
                                initiator: doc.initiator
                            }
                        );
                    }
                }.toString()
            },
            get_transaction_share_stash: {
                map: function (doc) {
                    for (var i in doc.stash_list) {
                        emit({
                            transaction_id: doc._id,
                            user_id: doc.stash_list[i].user_id
                        }, doc.stash_list[i].stash_id);
                    }
                }.toString()
            }
        },
        notification_stash_db: {
            transaction_status: {
                map: function (doc) {
                    for (var i in doc.notification_list) {
                        emit([doc.notification_list[i].transaction_id, doc.notification_list[i].sender],
                            doc.notification_list[i].status);
                    }
                }.toString()
            }
        }
        };
        this._db_module_config = {
            auth: {
                username: process.env.cloudant_username,
                password: process.env.cloudant_password
            },
            users_db: {
                api: {
                    name: '_design/api',
                    get_user_doc_by_email: 'api/get_user_doc_by_email'
                }
            },
            groups_db: {
                api: {
                    name: '_design/api',
                    get_groups_by_user: "api/get_groups_by_user",
                    get_groups_metadata_by_user: "api/get_groups_metadata_by_user"
                }
            },
            transactions_db: {
                api: {
                    name: '_design/api',
                    get_transaction_info_by_id: "api/get_transaction_info_by_id",
                    get_transaction_share_stash: "api/get_transaction_share_stash"
                }
            },
            notification_stash_db: {
                api: {
                    name: '_design/api',
                    get_status_by_transaction_and_requester: "api/transaction_status",
                }
            }
        };
        this._InitialDataBasesConnectionVariables();
        this._InitDataBases();
        //this._TestFunctions();
    }

    _TestFunctions() {
        this.GetShareStashDocByStashID("04b48a28c77b587c6e9f594d0a2dce58")
        .then((stash_doc) => {
             this.CommitShareToUser(stash_doc, "12345", "251535b0e57a94f4382d50a6ac9eff9d")
            .then((data) => {
                console.log(data);
                console.log(data);
            })
        })
        .catch((err) => {
            console.log(err);
            console.log(err);
        })
    }

    static get instance() {
        if (!this[_singleton])
        {
            this[_singleton] = new ServerInteraction(_singleton);
        }
        return this[_singleton];
    }

    _InitialDataBasesConnectionVariables() {
        this.users_db = new PouchDB('https://betweenus.cloudant.com/users', { auth: this._db_module_config.auth });
        this.groups_db = new PouchDB('https://betweenus.cloudant.com/groups', { auth: this._db_module_config.auth });
        this.transactions_db = new PouchDB('https://betweenus.cloudant.com/transactions', { auth: this._db_module_config.auth });
        this.notification_stash_db = new PouchDB('https://betweenus.cloudant.com/notification_stash', { auth: this._db_module_config.auth });
        this.shares_stash_db = new PouchDB('https://betweenus.cloudant.com/shares_stash', { auth: this._db_module_config.auth });
    }

    _InitDataBases() {
        /* TODO: Check for database existence. create if doesn't exist. */
        Promise.all([
            this._InitUsersDB(),
            this._InitGroupsDB(),
            this._InitTransactionsDB(),
            this._InitNotificationsStashDB(),
            this._InitSharesStashDB()
        ]).then((result) => {
            console.log("Start creating databases indexes");
            console.log(result);
            console.log("Done creating databases indexes");
        }).catch((err) => {
            console.log(err);
        });


    }

    _InitUsersDB() {
        return new Promise((resolve, reject) => {
            this.users_db.get(this._db_module_config.users_db.api.name)
                .then((doc)=> { resolve("UsersDB indexes has been created successfully"); })
                .catch((err)=> {
                    //document does not exists, create it
                    this.users_db.post({
                        views: this._views.users_db,
                        _id: this._db_module_config.users_db.api.name
                    }).then((doc)=> {
                        resolve("UsersDB indexes has been created successfully");
                    }).catch((err)=> {
                        reject("Error on creating UsersDB indexes");
                    });
                });
        });
    }

    _InitGroupsDB() {
        return new Promise((resolve, reject) => {
            this.groups_db.get(this._db_module_config.groups_db.api.name)
                .then((doc)=> {resolve("GroupsDB indexes has been created successfully"); })
                .catch((err)=> {
                    //document does not exists, create it
                    this.groups_db.post({
                        views: this._views.groups_db,
                        _id: this._db_module_config.groups_db.api.name
                    }).then((doca)=> {
                        resolve("GroupsDB indexes has been created successfully");
                    }).catch((erra)=> {
                        reject("Error on creating GroupsDB indexes");
                    });
                });

        });
    }

    _InitTransactionsDB() {
        return new Promise((resolve, reject) => {
            this.transactions_db.get(this._db_module_config.transactions_db.api.name)
                .then((doc)=> { resolve("TransactionsDB indexes has been created successfully"); })
                .catch((err)=> {
                    //document does not exists, create it
                    this.transactions_db.post({
                        views: this._views.transactions_db,
                        _id: this._db_module_config.transactions_db.api.name
                    }).then((doca)=> {
                        resolve("TransactionsDB indexes has been created successfully");
                    }).catch((erra)=> {
                        reject("Error on creating TransactionsDB indexes");
                    });
                });
        });
    }

    _InitSharesStashDB() {
        return new Promise(function(resolve, reject) {
            resolve("Done");
        });
    }

    _InitNotificationsStashDB() {
        return new Promise((resolve, reject) => {
            this.notification_stash_db.get(this._db_module_config.notification_stash_db.api.name)
                .then((doc)=> { resolve("Notification stash DB indexes has been created successfully"); })
                .catch((err)=> {
                    //document does not exists, create it
                    this.notification_stash_db.post({
                        views: this._views.notification_stash_db,
                        _id: this._db_module_config.notification_stash_db.api.name
                    }).then((doca)=> {
                        resolve("Notification stash DB indexes has been created successfully");
                    }).catch((erra)=> {
                        reject("Error on creating Notification stash DB indexes");
                    });
                });
        });
    }

    /**
     * Gets user's document by email address
     * @param email
     * @constructor
     */
    GetUserByEmail (email) {
        return new Promise((resolve, reject) => {
            this.users_db.query(this._db_module_config.users_db.api.get_user_doc_by_email, {
                    key: email,
                    include_docs: true
                })
                .then((result) => {
                    if (result.rows.length == 0) {
                        reject("User not found.");
                    }
                    resolve(result.rows[0].value);
                })
                .catch((err) => {
                    reject("User not found.");
                })
        });
    }

    /**
     * This function checks if email and password exists in database.
     * @param email
     * @param password
     * @returns {Promise} A promise object. if user and password found, it returns its document.
     * otherwise, it returns a string represent the error
     * @constructor
     */
    CheckLogin(email, password) {
        return new Promise((resolve, reject) => {
            this.GetUserByEmail(email)
                .then((doc) => {
                    if (doc.password == password)
                        resolve(doc);
                    else
                        reject("Bad credentials.");
                })
                .catch((err)=> {
                    reject("Bad Credential.");
                });
        });
    }

    /**
     * This function returns all groups information for a given user_id
     * @param user_id
     * @constructor
     */
    GetGroupsForUserId(user_id) {
        return new Promise((resolve, reject) => {
            this.groups_db.query(this._db_module_config.groups_db.api.get_groups_by_user, {
                    key: user_id,
                    include_docs: true
                })
                .then((result) => {
                    resolve(result.rows);
                })
                .catch((err) => {
                    reject(err);
                });
        });

    }

    /**
     * This function return all data related to a group_id.
     * It fetches emails for its member id list
     * It fetches transactions meta data for its transaction id list
     * It fetches creator email and user id fot this group
     *
     * {    group_name: 'Prototype Group',
            id: 'e6d4824ba908e09959e5ac63289e800d',
            member_list:
            [ { email: 'bob', user_id: '549b28dde0a96df05e8d1426ad61b119' },
             { email: 'charlie',
               user_id: '251535b0e57a94f4382d50a6ac9eff9d' } ],
            creator: { email: 'alice', user_id: 'cddf14e4e0ce7fd1f3fb2f8d66fef344' },
            transaction_list:
            [ { transaction_id: '549b28dde0a96df05e8d1426ad6e6aed',
               transaction_name: 'Prototype Transaction',
               transaction_creator: 'cddf14e4e0ce7fd1f3fb2f8d66fef344',
               threshold: 2 } ] }

     * @param group_id
     * @returns {Promise}
     * @constructor
     */
    GetGroupDataByGroupId(group_id) {
        //TODO need to follow old get group data
        console.log("In GetGroupDataByGroupId");
        var group_data = {};
        return new Promise((resolve, reject) => {
            this.groups_db.get(group_id)
                .then((result) => {
                    group_data.group_name = result.group_name;
                    group_data.id = result._id;
                    console.log("lalal1");
                    group_data.member_list = [];
                    group_data.creator = result.creator;
                    group_data.transaction_list = result.transaction_list;
                    console.log("lalal2");
                    var users_ids = result.member_list;
                    users_ids.push(result.creator);
                    console.log("lalal3");
                    console.log("resolving with", users_ids);
                    return this.GetUsersByListOfIds(users_ids)
                })
                .then((result) => {
                    console.log(result);
                    for (var i = 0; i < result.length; ++i) {
                        var doc = result[i].doc;
                        if (doc._id == group_data.creator) {
                            group_data.creator = { email:doc.email, user_id:doc._id };
                        }
                        else {
                            group_data.member_list.push({email:doc.email, user_id: doc._id});
                        }
                    }
                    console.log("Returning trasnaction list...: ", group_data.transaction_list);
                    return group_data.transaction_list;
                })
                .then((list_of_transaction_ids) => {
                    console.log("next then...", list_of_transaction_ids);
                    return this.GetTransactionsByListOfIds(list_of_transaction_ids)
                })
                .then((transaction_data) => {
                    console.log("transaction data:", transaction_data);
                    group_data.transaction_list = [];
                    for (var i in transaction_data) {
                        group_data.transaction_list.push({
                            transaction_id: transaction_data[i].id,
                            transaction_name: transaction_data[i].value.transaction_name,
                            transaction_creator: transaction_data[i].value.initiator,
                            threshold: transaction_data[i].value.threshold
                        })
                    }
                    resolve(group_data);
                })
                .catch((err) => {
                    reject(err);
                });
        });

    }

    /**
     * This function returns all data for given list of user ids
     * Input: [id1, id2]
     * Output:
     * // id1
     * [ { id: '549b28dde0a96df05e8d1426ad61b119',
         key: '549b28dde0a96df05e8d1426ad61b119',
         value: { rev: '4-96f7cc0ecc46976221b865a0d87fb92d' },
         doc:
         { _id: '549b28dde0a96df05e8d1426ad61b119',
           _rev: '4-96f7cc0ecc46976221b865a0d87fb92d',
           metadata: [Object],
           email: 'bob',
           password: '1',
           public_key: 'bob_pk1',
           groups: [Object],
           notifications_stash: [Object] } },
     * // id2
         { id: '251535b0e57a94f4382d50a6ac9eff9d',
           key: '251535b0e57a94f4382d50a6ac9eff9d',
           value: { rev: '4-c4687cd931990971f3b48056e78b49a8' },
           doc:
            { _id: '251535b0e57a94f4382d50a6ac9eff9d',
              _rev: '4-c4687cd931990971f3b48056e78b49a8',
              metadata: [Object],
              email: 'charlie',
              password: '1',
              public_key: 'charlie_pk',
              groups: [Object],
              notifications_stash: [Object] } } ]

     * @param list_of_users_ids
     * @returns {Promise}
     * @constructor
     */
    GetUsersByListOfIds(list_of_users_ids) {
        return new Promise((resolve, reject) => {
            this.users_db.allDocs({
                    include_docs: true,
                    keys: list_of_users_ids
                })
                .then((result) => {
                    resolve(result.rows);
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }

    /**
     * This function returns list of transactions meta data by given list of transactions ids
     * [     { id: '31d7e197b72a77f80ed736a77043685b',
       key: '31d7e197b72a77f80ed736a77043685b',
       value: { rev: '1-754431bdd2494831604a2621ae988c33' },
       doc:
        { _id: '31d7e197b72a77f80ed736a77043685b',
          _rev: '1-754431bdd2494831604a2621ae988c33',
          metadata:
           { scheme: 'transaction',
             scheme_version: '1.0',
             creation_time: '2016-03-28T05:49:28.222Z' },
          initiator: 'cddf14e4e0ce7fd1f3fb2f8d66fef344',
          transaction_name: 'Antother test trans',
          cipher_meta_data: { type: 'String', data: 'ghdñÿ°ä¶ÌûÏò\'¼<4áwÓ1&a¤\u0011n(' },
          group_id: 'e6d4824ba908e09959e5ac63289e800d',
          threshold: 3,
          stash_list: [ [Object], [Object], [Object] ] } }]
     * @param list_of_transactions_ids
     * @returns {Promise}
     * @constructor
     */
    GetTransactionsByListOfIds(list_of_transactions_ids) {
        return new Promise((resolve, reject) => {
            this.transactions_db.allDocs({
                    keys: list_of_transactions_ids,
                    include_docs: true
                })
                .then((result) => {
                    resolve(result.rows);
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }

    /**
     * This function returns data for a specific transaction id
     * @param requesting_user_id
     * @param transaction_id
     * @returns {Promise}
     * @constructor
     */
    GetTransactionAllInfoById(requesting_user_id, transaction_id) {
        var transaction_data = {};
        return new Promise((resolve, reject) => {
            this.transactions_db.get(transaction_id)
                .then((transaction_doc) => {
                    transaction_data.cipher_meta_data = transaction_doc.cipher_meta_data;
                    transaction_data.id = transaction_doc._id;
                    transaction_data.transaction_name = transaction_doc.transaction_name;
                    transaction_data.threshold = transaction_doc.threshold;
                    transaction_data.initiator = {
                        initiator_id: transaction_doc.initiator,
                        initiator_email: ""
                    };
                    transaction_data.group_id = transaction_doc.group_id;
                    transaction_data.members_list = [];
                    for (var i = 0; i < transaction_doc.stash_list.length; ++i) {
                        var stash = transaction_doc.stash_list[i];
                        if (stash.user_id == requesting_user_id) {
                            transaction_data.my_stash = stash.stash_id;
                        }
                        transaction_data.members_list.push(stash.user_id);
                    }
                    return transaction_data.members_list;
                })
                .then((members_list) => this.GetUsersByListOfIds(members_list))
                .then((members_list) => {
                    transaction_data.members_list = [];
                    for (var i = 0; i < members_list.length; ++i) {
                        var doc = members_list[i].doc;
                        if (doc._id == transaction_data.initiator.initiator_id) {
                            transaction_data.initiator.initiator_email = doc.email;
                        }
                        transaction_data.members_list.push({
                            email:doc.email,
                            user_id: doc._id
                        });
                    }
                    resolve(transaction_data);
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }

    /**
     * This function returns user information (if true) for a specific user stash id
     * [ { user_id: '549b28dde0a96df05e8d1426ad61b119',
    share:
     { bits: 8,
       id: 1,
       data: '31395a75e1a451ede9838da4ff5236d8da612a3e1968044bc876d671eb401c47cae56696ba6c513c50dee45b96fab7aed1fb168e0d145264791ae3021572255975ca9a632bc33e98d163bd613b828640927a240a6b3aab57e0d8ca0a44e5ddbd20f28e3b025fa10fe64b9df7fc4ba81ec63505c910e2cb6c921a3b4bc05c092368553321e9a7e0a8b4fbda4eaf70a8278425142b09951411adcd38dfbf5b13ef416f56000db3ba07aa7b36a7e0e05f2786d1ea3856a8e742c8f4f27d6bd4afa081d3a7721fd420f511b9cb24463b7e04' },
    email: 'bob' },
     { user_id: '251535b0e57a94f4382d50a6ac9eff9d',
       share: '',
       email: 'charlie' },
     { user_id: 'cddf14e4e0ce7fd1f3fb2f8d66fef344',
       share:
        { bits: 8,
          id: 3,
          data: '534bee9f3ef1f32a26988af11cf45ab973c57e2c2bd40cb9455c675520a024a543feaa6dd3daf328f0153181a77fc4236ed63aff17fef66e8b4a38ca3f5a6f879f2fb3d77d3842df6ec5dad34df397b4ab466c7ebd22e0313d1b43d6ccf47a1e606b8f8b0683fe753717ba6c1917e5ea579b0f8e305d4072ab4c4dbd5d281ba1b88d55a126923d29c1727310ece0e5a191ab3c0d1bc23c41ea88480cdc8935e0c375fac417a6d3cbe3495a963d55e10b9706232cfa8b340a45c30bf5bd05ec9b9e02f4f82107606c33a4400aca2b8260' },
       email: 'alice' } ]

     * @param user_id
     * @param transaction_id
     * @param convert_ids_to_name
     * @returns {Promise}
     * @constructor
     */
    GetShareStash(user_id, transaction_id, convert_ids_to_name) {

        return new Promise((resolve, reject) => {
            var nuser_id = user_id,
                ntransaction_id = transaction_id;
            this.transactions_db.query(this._db_module_config.transactions_db.api.get_transaction_share_stash, {
                    keys: [{transaction_id: transaction_id, user_id: user_id}]
                })
                .then((result) => {
                    if (result.rows.length == 0) {
                        reject("No stash found for transaction id: " +  ntransaction_id + " associated with user id: " + nuser_id);
                    }
                    else {
                        return result.rows[0].value;
                    }
                })
                .then((results) => this.GetShareStashByStashID(results))
                .then((result) => {
                    if (convert_ids_to_name) {
                        var user_ids = [];
                        for (var i in result) { user_ids.push(result[i].user_id) }
                        this.GetUsersByListOfIds(user_ids)
                            .then((member_list) => {
                                for (var i in member_list) {result[i].email = member_list[i].doc.email;}
                                resolve(result);
                            })
                            .catch((err) => {
                                reject(err);
                            });
                    }
                    else {
                        resolve(result);
                    }
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }

    /***
     * TODO: Documentation
     * @param email
     * @returns {Promise}
     * @constructor
     */
    IsUserExists(email) {
        return new Promise((resolve, reject) => {
            this.users_db.query(this._db_module_config.users_db.api.get_user_doc_by_email, {
                keys: [email]
            })
            .then((data) => {
                if (data.rows.length == 1)
                    resolve("User was found.")
                else
                    reject("User not found.");
            })
            .catch((err) => reject("User not found."));
        });
    };

    /**
     * This function returns stash's share list
     * @param stash_id
     * @returns {Promise}
     * @constructor
     */
    GetShareStashByStashID (stash_id) {
        return new Promise((resolve, reject) => {
            this.shares_stash_db.get(stash_id)
                .then((result) => resolve(result.share_list))
                .catch((err) => {
                    reject(err);
                });
        });
    }

    InsertNewUser(password, email, public_key) {
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
            "groups": [],
            "notifications_stash": []
        };
        return new Promise((resolve, reject) => {
            var user_doc_g = user_doc;
            this.users_db.post(user_doc)
                .then((user_doc) => this.users_db.get(user_doc.id))
                .then((user_doc) => {
                    user_doc_g = user_doc;
                    this.CreateNotificationStash(user_doc.id)
                    .then((notification_doc) => {
                        user_doc_g.notifications_stash.push(notification_doc.id);
                        this.users_db.put(user_doc_g)
                            .then((doc) => resolve(doc))
                            .catch((err) => reject(err))
                    })
                    .catch((err) => {
                        console.log(err);
                        reject(err);
                    });
                });
        });
    }

    CreateNotificationStash(user_id) {
        var notification_body = {
            metadata: {
                scheme: "notification_stash",
                scheme_version: "1.0",
                last_updated: (new Date()).toISOString()
            },
            user_id: user_id,
            notification_list: [ ]
        };
        return new Promise((resolve, reject) => {
            this.notification_stash_db.post(notification_body)
                .then((data) => {
                    resolve(data)
                })
                .catch((err) => {
                    reject(err)
                });
        });
    };

    /***
     *
     * @param user_ids_list list of objects: [{user_id: doc._id, email:doc.email, public_key:doc.public_key}]
     * @returns {Promise}
     * @constructor
     */
     GetUsersPublicKeys(user_ids_list) {
        // This function returns a list of objects contains for each email its public key
         var public_keys = [];
         return new Promise((resolve, reject) => {
             this.users_db.allDocs({ keys: user_ids_list, include_docs: true})
                 .then((data) => {
                     for (var i in data.rows) {
                         var doc = data.rows[i].doc;
                         public_keys.push({user_id: doc._id, email:doc.email,public_key:doc.public_key});
                     }
                     resolve(public_keys);
                 })
                 .catch((err) => reject(err));
         });
    };

    /***
     * This function recieves an email list and should return a document list back.
     * @param email_list
     * @returns {Promise}
     * @constructor
     */
    GetUsersByEmailList(email_list) {
        return new Promise((resolve, reject) => {
            console.log("GetUsersByEmailList: ", email_list);
            this.users_db.query(this._db_module_config.users_db.api.get_user_doc_by_email, {
                    keys: email_list,
                    include_docs: true
                })
                .then((data) => {
                    console.log("succes,, ", data);
                    resolve(data)
                })
                .catch((err) => {
                    console.log("error, ", err)
                    reject(err)
                });
        });
    };

    CreateStashList(user_stash_list, group_id) {
        return new Promise((resolve, reject) => {
            var list_of_user_stash_to_insert = [];
            for (var i in user_stash_list) {
                var share_list = [];
                /* Fill up the share stash for user 'i' */
                for (var j in user_stash_list) {
                    /* insert user 'j' share data to user 'i' share stash */
                    var share_obj = {};
                    share_obj.user_id = user_stash_list[j].user_id;
                    share_obj.share = (j == i) ?  user_stash_list[i].share : "";
                    share_list.push(share_obj);
                }
                /* Prepare the user stash document for user 'i' */
                var user_stash_doc = {
                    metadata: {
                        scheme: "share_stash",
                        scheme_version: "1.0",
                        creation_time: (new Date()).toISOString()
                    },
                    stash_owner: user_stash_list[i].user_id,
                    share_list: share_list,
                    group_id: group_id
                }
                /* Insert the document (stash) into the main list that we'll push into the database. */
                list_of_user_stash_to_insert.push(user_stash_doc);
            }
            /* Bulk push the stashes */
            this.shares_stash_db.bulkDocs(list_of_user_stash_to_insert, {
                include_docs: true
            })
            .then((data) => {
                var data = data;
                for (var i in data) {
                    list_of_user_stash_to_insert[i].id = data[i].id;
                }
                resolve(list_of_user_stash_to_insert);
            })
            .catch((err) => reject(err));
        });
    }

    CreateTransaction(creator_userid, transaction_name, cipher_data, user_stash_list, group_id, share_threshold) {
        //TODO: Store shares_stash before creating the transaction and then add it to the new transaction
        // user_stash_list - [{user_id:"123assss", share:"asdasdasdasd"},{},{},...]
        var new_transaction_doc = {
            metadata: {
                scheme: "transaction",
                scheme_version: "1.0",
                creation_time: (new Date()).toISOString()
            },
            initiator: creator_userid,
            transaction_name: transaction_name,
            cipher_meta_data: {
                type: "String",
                data: cipher_data
            },
            group_id: group_id,
            threshold: share_threshold,
            stash_list: user_stash_list
        };
        return new Promise((resolve, reject) => {
            this.transactions_db.post(new_transaction_doc, { include_docs: true })
                .then((data) => resolve(data))
                .catch((err) => reject(err));
        });
    };

    AddTransactionToGroup(group_id, transaction_doc) {
        return new Promise((resolve, reject) => {
            console.log("TRANSACTION DOC: ", transaction_doc);
            console.log("GRUOP IDE: ", group_id);
            this.groups_db.get(group_id, {include_docs: true})
                .then((group_data) => {
                    group_data.transaction_list.push(transaction_doc.id);
                    this.groups_db.put(group_data);
                })
                .then((data) => resolve(data))
                .catch((err) => reject(err));
        });
    };


    /***
     * Input: Notifcation stash id.
     * Output:
     * { _id: '7570ad201067614d5afc50056f7cb6ac',
        _rev: '2-aa52fbe0ca34b85d2e68df54a9254152',
        metadata: {
            scheme: 'notification_stash',
            scheme_version: '1.0',
            last_updated: '2016-01-24T15:00:38.779Z' },
        user_id: '549b28dde0a96df05e8d1426ad61b119',
        notification_list: [ {
            time: '2016-01-24T15:08:31.456Z',
            group_id: 'e6d4824ba908e09959e5ac63289e800d',
            transaction_id: '549b28dde0a96df05e8d1426ad6e6aed',
            sender: 'cddf14e4e0ce7fd1f3fb2f8d66fef344',
            type: 'share-request',
            status: 'pending' } ] }
     * @param notification_stash_id
     * @returns {Promise}
     * @constructor
     */
    GetNotificationStash(notification_stash_id) {
        return new Promise((resolve, reject) => {
           this.notification_stash_db.get(notification_stash_id, { include_docs: true })
           .then((data) => resolve(data))
           .catch((err) => reject(err));
        });
    }

    RequestShareFromUser(transaction_id, stash_owner_id, dest_user_id) {
        var transaction_body;
        var src_user_doc = null,
            dst_user_doc = null,
            transaction_id = transaction_id;
        return new Promise((resolve, reject) => {
            this.GetTransactionsByListOfIds([transaction_id])
            .then((data) => {
                transaction_body = data[0].doc;
                return this.GetUsersByListOfIds([stash_owner_id, dest_user_id]);
            })
            .then((user_list) => {
                /* Make sure we get exactly 2 user list, we shouldn ever get anything else but this is just
                   a sanity test.
                 */
                if (user_list.length != 2) {
                    reject("Expected 2 user docs, got ", user_list.length);
                }
                else {
                    src_user_doc = user_list[0].doc;
                    dst_user_doc = user_list[1].doc;
                    var found_src_dst = 0;
                    /* Check that both stash_owner_id and dest_user_id are present in the transaction. */
                    for (var i in transaction_body.stash_list) {
                        if ((transaction_body.stash_list[i].user_id == src_user_doc._id) ||
                            (transaction_body.stash_list[i].user_id == dst_user_doc._id)) {
                            found_src_dst++;
                        }
                    }
                    if (found_src_dst != 2) {
                        reject(("Users are not part of the transaction.", found_src_dst));
                    }
                    else {
                        return this.GetNotificationStash(dst_user_doc.notifications_stash[0]);
                    }
                }
            })
            .then((notification_stash) => {
                /* Once we're here, the notification stash we have is the destination user notification stash. */
                var notification_list = notification_stash.notification_list;
                /* Verify that the sender hasn't already requested the share from the destination user for that specific
                   transaction.
                 */
                for (var i in notification_list) {
                    if ((notification_list[i].transaction_id == transaction_id) &&
                        (notification_list[i].sender == src_user_doc._id) &&
                        (notification_list[i].type == "share-request")) {
                        reject("Share request already exist.");
                        return;
                    }
                }
                /* If share-request doesn't exist, create it. */
                var notification_item_doc = {
                    time: (new Date()).toISOString(),
                    group_id: transaction_body.group_id,
                    transaction_id: transaction_body._id,
                    sender: src_user_doc._id,
                    type: "share-request",
                    status: "pending"
                };
                notification_stash.notification_list.push(notification_item_doc);
                return this.notification_stash_db.put(notification_stash);
            })
            .then((data) => {
                console.log("Share request notification added succesfully.", data);
                resolve(data);
            })
            .catch((err) => reject(err));
        })
    }

    CreateGroup(creator, list_of_users_ids, group_name) {
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
        return new Promise((resolve, reject) => {
            this.groups_db.post(group_doc).
                then((data) => {
                    resolve(data);
                })
                .catch((err) => {
                    reject(err);
                });
        });
    };

    /***
     * Receives a list of n user documents (users_doc.rows[n].doc), pushes the group (group.id) to the docs
     * 'groups' attribute for each user (users_docs.rows[n].doc.groups), and then uses bulkDocs to bulk update
     * the users in the database.
     *
     * @param users_doc
     * @param group
     * @returns {Promise}
     * @constructor
     */
    AddUsersToGroup(users_doc, group) {
        var docs_to_update = [];
        var doc;
        for (var i in users_doc.rows) {
            doc = users_doc.rows[i].doc;
            doc.groups.push(group.id);
            docs_to_update.push(doc);
        }
        return new Promise((resolve, reject) => {
            this.users_db.bulkDocs(docs_to_update)
                .then((data) => resolve(data))
                .catch((err) => reject(err));
        });
    };

    /*** GetShareStashDocByStashID
     * @data:
     * { _id: '04b48a28c77b587c6e9f594d0a2dce58',
      _rev: '1-90594d84c075db59b463fd541a7a74c4',
      metadata:
       { scheme: 'share_stash',
         scheme_version: '1.0',
         creation_time: '2016-03-18T18:23:15.815Z' },
      stash_owner: '549b28dde0a96df05e8d1426ad61b119',
      share_list:
       [ { user_id: '549b28dde0a96df05e8d1426ad61b119', share: [Object] },
         { user_id: '251535b0e57a94f4382d50a6ac9eff9d', share: '' },
         { user_id: 'cddf14e4e0ce7fd1f3fb2f8d66fef344', share: '' } ],
      group_id: 'e6d4824ba908e09959e5ac63289e800d' }
     * @param share_stash_id
     * @returns {Promise}
     * @constructor
     */
    GetShareStashDocByStashID(share_stash_id) {
        return new Promise((resolve, reject) => {
            this.shares_stash_db.get(share_stash_id)
            .then((data) => {
                resolve(data);
            })
            .catch((err) => {
                reject(err);
            })
        });
    };

    /*** CommitShareToUser
     * Receives encrypted share and the stash doc, inserts the encrypted share (in the source_user_id share object)
     * and commits the change to the database.
     * @param stash_doc
     * @param share
     * @param source_user_id
     * @returns {Promise}
     * @constructor
     */
    CommitShareToUser(stash_doc, share, source_user_id) {
        return new Promise((resolve, reject) => {
            for (var i in stash_doc.share_list) {
                if (stash_doc.share_list[i].user_id == source_user_id) {
                    stash_doc.share_list[i].share = share;
                    this.shares_stash_db.post(stash_doc)
                    .then((data) => {
                        resolve(data);
                    })
                    .catch((err) => {
                        reject(err);
                    });
                }
            }
            reject("Can't find stash id.");
        })
    };

    GetShareStatus(transaction, list_of_ids) {

    }

}


module.exports = ServerInteraction.instance;