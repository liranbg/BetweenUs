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
            }
        };
        this._InitialDataBasesConnectionVariables();
        this._InitDataBases();
    }

    static get instance() {
        if (!this[_singleton])
        {
            this[_singleton] = new ServerInteraction(_singleton);
        }
        return this[_singleton];
    }

    _InitialDataBasesConnectionVariables() {
        /* TODO: Check if we can remove the need for multiple connections */
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
                .then((doc)=> {resolve("TransactionsDB indexes has been created successfully"); })
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
        return new Promise(function(resolve, reject) {
            resolve("Done");
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
        var group_data = {};
        return new Promise((resolve, reject) => {
            this.groups_db.get(group_id)
                .then((result) => {
                    group_data.group_name = result.group_name;
                    group_data.id = result._id;
                    group_data.member_list = [];
                    group_data.creator = result.creator;
                    group_data.transaction_list = result.transaction_list;
                    var users_ids = result.member_list;
                    users_ids.push(result.creator);
                    return users_ids;
                })
                .then((list_of_user_ids) => this.GetUsersByListOfIds(list_of_user_ids))
                .then((result) => {
                    for (var i = 0; i < result.length; ++i) {
                        var doc = result[i].doc;
                        if (doc._id == group_data.creator) {
                            group_data.creator = { email:doc.email, user_id:doc._id };
                        }
                        else {
                            group_data.member_list.push({email:doc.email, user_id: doc._id});
                        }
                    }
                    return group_data.transaction_list;
                })
                .then((list_of_transaction_ids) => this.GetTransactionsByListOfIds(list_of_transaction_ids))
                .then((transaction_data) => {
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
     * [{ id: '549b28dde0a96df05e8d1426ad6e6aed',
        key: '549b28dde0a96df05e8d1426ad6e6aed',
        value:
         { transaction_name: 'Prototype Transaction',
           group_id: 'e6d4824ba908e09959e5ac63289e800d',
           threshold: 2,
           initiator: 'cddf14e4e0ce7fd1f3fb2f8d66fef344' } }]
     * @param list_of_transactions_ids
     * @returns {Promise}
     * @constructor
     */
    GetTransactionsByListOfIds(list_of_transactions_ids) {
        return new Promise((resolve, reject) => {
            this.transactions_db.query(this._db_module_config.transactions_db.api.get_transaction_info_by_id, {
                    keys: list_of_transactions_ids
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
     * { id: '549b28dde0a96df05e8d1426ad6e6aed',
          transaction_name: 'Prototype Transaction',
          threshold: 2,
          initiator:
           { initiator_id: 'cddf14e4e0ce7fd1f3fb2f8d66fef344',
             initiator_email: 'alice' },
          group_id: 'e6d4824ba908e09959e5ac63289e800d',
          members_list:
           [ { email: 'bob', user_id: '549b28dde0a96df05e8d1426ad61b119' },
             { email: 'charlie',
               user_id: '251535b0e57a94f4382d50a6ac9eff9d' },
             { email: 'alice', user_id: 'cddf14e4e0ce7fd1f3fb2f8d66fef344' } ],
          my_stash: 'd05ab2d51d8a84864e91c642c19c47b3' }
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
            this.transactions_db.query(this._db_module_config.transactions_db.api.get_transaction_share_stash, {
                    keys: [{transaction_id: transaction_id, user_id: user_id}]
                })
                .then((result) => this.GetShareStashByStashID(result.rows[0].value))
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
}

module.exports = ServerInteraction.instance;