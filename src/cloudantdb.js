var CloudantDBModule = (function() {

    // Load the Cloudant library.
    var Cloudant = require('cloudant');

    var db_module_config = {
        users_db_name: 'users',
        cloudant_account : {
            account: "betweenus",
            password: "BetweenU%"
        }
    };

    var cld_db = Cloudant(db_module_config.cloudant_account);


    var InitUsersDB = function() {
        cld_db.db.create(db_module_config.users_db_name, function () {
            console.log(db_module_config.users_db_name," database is set");
        });
    };

    var InsertNewUser = function (username, email, public_key) {
        var users_db = cld_db.db.use(db_module_config.users_db_name);
        users_db.insert(
            { username: username, email: email, public_key: public_key }, // Document
            email,                                                        // Identifier
            function(err, body, header) {                                 // Callback func
                if (err) {
                    return console.log('Error encountered while trying to add user: ', err.message);
                }
                console.log('User inserted successfully.');
                console.log(body);
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


    exports.InitUsersDB = InitUsersDB;
    exports.InsertNewUser = InsertNewUser;
    exports.GetUserDetailsByEmail = GetUserDetailsByEmail;

}(CloudantDBModule || {}));