var CloudantDBModule = (function() {

    // Load the Cloudant library.
    var Cloudant = require('cloudant');
    require('dotenv').load(); //load all environments from .env file

    var db_module_config = {
        users_db_name: 'users',
        groups_db_name: 'groups',
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
    };

    var InsertNewUser = function (username, password, email, public_key) {
        // TODO: Add hashing and possibly a salt for the password [Discuss either here or on server prior to the request].
        var users_db = cld_db.db.use(db_module_config.users_db_name);
        users_db.insert(
            { username: username, password: password, email: email, public_key: public_key }, // Document
            email,                                                        // Identifier
            function(err, body, header) {                                 // Callback func
                if (err) {
                    return console.log('Error encountered while trying to add user: ', err.message);
                }
                console.log('User inserted successfully.');
                console.log(body);
            });
    };

    var CreateNewGroup = function (creator, user_list, group_name, callback_func) {
        // TODO: Check that group name is complaint to some policy we'll set (max length, forbidden chars etc.) [Discuss either here or on server prior to the request].
        var groups_db = cld_db.db.use(db_module_config.groups_db_name);
        groups_db.insert(
            { creator: creator, user_list: user_list, group_name: group_name },                    // Document
            function(err, body, header) {                                                          // Callback func
                if (err) {
                    callback_func(err, body);
                    return console.log('Error encountered while trying to add user: ', err.message);
                }
                callback_func(body);
                return console.log('Group created successfully.');
            });
    };

    var GetUserDetailsByEmail = function(email, callback_func) {
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
        users_db.search('users','_id',{q:'liranbg@gmail.com'}, function(er, result) {
            if (er) {
                throw er;
            }
            console.log('Found %d documents with name Alice', result.docs.length);
            for (var i = 0; i < result.docs.length; i++) {
                console.log('  Doc id: %s', result.docs[i]._id);
            }
            callback_func(result);
        });

    };

    exports.InitUsersDB = InitUsersDB;
    exports.InitGroupsDB = InitGroupsDB;
    exports.InsertNewUser = InsertNewUser;
    exports.CreateNewGroup = CreateNewGroup;
    exports.GetUserDetailsByEmail = GetUserDetailsByEmail;
    exports.GetUsersPublicKeys = GetUsersPublicKeys;

} (CloudantDBModule || {}));