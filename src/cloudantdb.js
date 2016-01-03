var CloudantDBModule = (function() {

    // Load the Cloudant library.
    var Cloudant = require('cloudant');
    require('dotenv').load(); //load all environments from .env file

    var db_module_config = {
        users_db_name: 'users',
        groups_db_name: 'groups',
        transactions_db_name: 'transactions',
        shares_db_name: 'shares',
        cloudant_account : {
            account: process.env.cloudant_username,
            password: process.env.cloudant_password
        }
    };

    var cld_db = Cloudant(db_module_config.cloudant_account);


    var InitUsersDB = function() {
        cld_db.db.create(db_module_config.users_db_name, function () {
            console.log(db_module_config.users_db_name," database is set");
        });
    };

    var InitGroupsDB = function() {
        cld_db.db.create(db_module_config.groups_db_name, function () {
            console.log(db_module_config.groups_db_name," database is set");
        });
        //initialize index for querying db
        var group_db = cld_db.db.use(db_module_config.groups_db_name);
        group_db.index({name:'name', type:'json', index:{fields:['name','creator']}}, function(er, response) {
            if (er) {
                throw er;
            }
            console.log('Index creation result: %s', response.result);
        });
    };

    var InitTransactionsDB = function() {
        cld_db.db.create(db_module_config.transactions_db_name, function () {
            console.log(db_module_config.transactions_db_name," database is set");
        });

    };

    var InitSharesDB = function() {
        cld_db.db.create(db_module_config.shares_db_name, function () {
            console.log(db_module_config.shares_db_name," database is set");
        });

    };

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

    var CreateTransaction = function(initiator, members, group_id, callback_func) {
        var transactions_db = cld_db.db.use(db_module_config.transactions_db_name);
        transactions_db.insert(
            { initiator: initiator, members: members, group_id: group_id, shares: [] },
            function(err, data, header) {
                if (err) {
                    console.log('Error encountered while trying to add transaction: ', err.message);
                    return err;
                }
                callback_func(data);
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

    var InsertNewUser = function (username, password, email, public_key) {
        // TODO: Add hashing and possibly a salt for the password [Discuss either here or on server prior to the request].
        var users_db = cld_db.db.use(db_module_config.users_db_name);
        users_db.insert(
            { password: password, in_groups: [], email: email, public_key: public_key }, // Document
            email,                                                        // Identifier
            function(err, data, header) {                                 // Callback func
                if (err) {
                    return console.log('Error encountered while trying to add user: ', err.message);
                }
                console.log('User inserted successfully.');
                console.log(data);
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
                console.log("Error occured while fetching user email: ", err.message);
            }
            callback_func(data);
        });
    };

    var GetUsersPublicKeys = function(user_ids_list, callback_func) {
        //TODO Figure how to get bulk of documents from server
        var users_db = cld_db.db.use(db_module_config.users_db_name);
        for (var i = 0; i < user_ids_list.length; ++i) {
            var user = user_ids_list[i];
            users_db.get(user, function (err, data) {
                if (err)
                {
                    console.log("Error occured while fetching user email & public keys: ", err.message);
                }
                callback_func(data);
            });
        }

    };

    exports.InitUsersDB = InitUsersDB;
    exports.InitGroupsDB = InitGroupsDB;
    exports.InitTransactionsDB = InitTransactionsDB;
    exports.InitSharesDB = InitSharesDB;
    exports.InsertNewUser = InsertNewUser;
    exports.CreateNewGroup = CreateNewGroup;
    exports.AddShareToTransaction = AddShareToTransaction;
    exports.AddTransactionToGroup = AddTransactionToGroup;
    exports.AddGroupToUser = AddGroupToUser;
    exports.GetUserDetailsByEmail = GetUserDetailsByEmail;
    exports.GetUsersPublicKeys = GetUsersPublicKeys;
    exports.GetUserByEmail = GetUserByEmail;
    exports.GetGroupByNameAndCreator = GetGroupByNameAndCreator;
    exports.CreateTransaction = CreateTransaction;
    exports.CreateShare = CreateShare;

} (CloudantDBModule || {}));