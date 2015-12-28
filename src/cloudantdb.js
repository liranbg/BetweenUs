
// Load the Cloudant library.
var Cloudant = require('cloudant');

var db_module_config = {
    users_db_name: 'users',
    cloudant_username: '',
    cloudant_password: ''
};

var cloudant = Cloudant({account:cloudant_username, password:cloudant_password});

var db_module_config = {
    users_db_name: 'users'
};

var InitUsersDB = function() {
    cloudant.db.create(db_module_config.users_db_name, function () {

    });
};

var InsertNewUser = function (username, email, public_key) {
    var users_db = cloudant.db.use(db_module_config.users_db_name);
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

var GetUserDetailsByEmail = function(email) {
    var users_db = cloudant.db.use(db_module_config.users_db_name);
    users_db.get(email, function (err, data) {
        if (err)
        {
            return console.log("Error occured while fetching user email: ", err.message);
        }
        // The rest of your code goes here. For example:
        console.log("Found user:", data);
    });
};
