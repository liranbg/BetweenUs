'use strict';


var PouchDB = require('pouchdb');
require('dotenv').load({path: './.env'}); //load all environments from .env file


let _singleton = Symbol();

class ServerInteraction {

    constructor(singletonToken) {
        if(_singleton != singletonToken) throw "Cannot construct singleton"; //ensure singleton
        this._views = {
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
                api: {
                    name: '_design/api',
                    get_transaction_info_by_id: {
                        name: "get_transaction_info_by_id",
                        design_name: "api"
                    },
                    get_transaction_share_stash: {
                        name: "get_transaction_share_stash",
                        design_name: "api"
                    }
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
        this.users_db = new PouchDB('https://betweenus.cloudant.com/users', { auth: this._db_module_config.auth });
        this.groups_db = new PouchDB('https://betweenus.cloudant.com/groups', { auth: this._db_module_config.auth });
        this.transactions_db = new PouchDB('https://betweenus.cloudant.com/transactions', { auth: this._db_module_config.auth });
        this.notification_stash_db = new PouchDB('https://betweenus.cloudant.com/notification_stash', { auth: this._db_module_config.auth });
        this.shares_stash_db = new PouchDB('https://betweenus.cloudant.com/shares_stash', { auth: this._db_module_config.auth });

    }
    _InitDataBases() {
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
                    }).then((doca)=> {
                        resolve("UsersDB indexes has been created successfully");
                    }).catch((erra)=> {
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
                    resolve(result.rows[0].value);
                })
                .catch((err) => {
                    reject("Wrong Password");
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
                        reject("Wrong Password");

                })
                .catch((err)=> {
                    //probably user not found. changed the error
                    reject("Wrong Password");

                });
        });
    }

}

module.exports = ServerInteraction.instance;