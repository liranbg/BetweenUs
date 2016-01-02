const
    express = require('express'),
    session = require('express-session'),
    body_parser = require('body-parser'),
    logger = require('morgan'),
    database_interface = require('./cloudantdb');
var app = express();

/* Initialize Session */
app.use(logger('dev'));
app.use(session({secret: 'ArbitraryStringToUseAsSession', resave: true, saveUninitialized: true}));
app.use(body_parser.urlencoded({extended: false}));
app.use(body_parser.json());


/* Mock Database */
var user_login_db = [
    {user_id: "nadav", password: "n123"},
    {user_id: "liran", password: "l123"},
    {user_id: "yaron", password: "y123"}
];

var group_mock_db = [
    {group_id:1, members: ["nadav", "liran", "yaron"]}
];

var transaction_mock_db = [
    {transaction_id: 1000, cipher_text: "encrypted_aes_message", group_id: 1},
];

var public_key_mock_db = [
    {user_id: "nadav", key: "nnnnnnnnnnnnnnn"},
    {user_id: "liran", key: "lllllllllllllll"},
    {user_id: "yaron", key: "yyyyyyyyyyyyyyy"}
];

var transaction_to_share_db = [
    {transaction_id: 1000, user_id: "nadav", share_id:"nadav", share_data: "trans_1000_nadav_share_encrypted_with_nadav_public_key" },
    {transaction_id: 1000, user_id: "nadav", share_id:"liran", share_data: null },
    {transaction_id: 1000, user_id: "nadav", share_id:"yaron", share_data: null },

    {transaction_id: 1000, user_id: "liran", share_id:"nadav", share_data: null},
    {transaction_id: 1000, user_id: "liran", share_id:"liran", share_data: "trans_1000_liran_share_encrypted_with_liran_public_key" },
    {transaction_id: 1000, user_id: "liran", share_id:"yaron", share_data: null },

    {transaction_id: 1000, user_id: "yaron", share_id:"nadav", share_data: null },
    {transaction_id: 1000, user_id: "yaron", share_id:"liran", share_data: null },
    {transaction_id: 1000, user_id: "yaron", share_id:"yaron", share_data: "trans_1000_yaron_share_encrypted_with_yaron_public_key" },
];
/* End of Mock Database */



/* Session Functions */
var isUserAuthenticated = function(req) {
    _session = req.session;
    if (_session.user_id) {
        return true;
    }
    else {
        return false;
    }
};

/* Database Query Functions */
var GetUsersPublicKeys = function(user_list) {
    public_key_list = [];
    for (var i in user_list) {
        public_key_list.push(GetPublicKeyForUser(user_list[i]));
    }
    return public_key_list;
}

var GetPublicKeyForUser = function(user_id) {
    for (var i in public_key_mock_db) {
        if (public_key_mock_db[i].user_id == user_id) {
            return public_key_mock_db[i].key;
        }
    }
    return null;
};

var GetTransactionSharesForUser = function(transaction_id, user_id) {
    for (var i in transaction_mock_db) {
        if (transaction_mock_db[i].transaction_id == transaction_id) {
            var return_share_data = [];
            /* Get all the share information for the requesting user in the requested transaction */
            for (var i in transaction_to_share_db) {
                if (transaction_to_share_db[i].transaction_id == transaction_id && user_id == transaction_to_share_db[i].user_id) {
                    return_share_data.push(transaction_to_share_db[i]);
                }
            }
            return return_share_data;
        }
    }
    return null;
};

/* Start of server */
app.get('/', function (req, res) {
    res.send('Server initialized');
});

/* Server API */
app.get('/login/:user_id', function (req, res) {
    var user_id = req.params.user_id;
    var exists = false;
    database_interface.GetUserDetailsByEmail(user_id, function(data) {
        exists = true;
        if ((data) && (data.username.length)) {
            //User exists
            var password = req.query.password;
            if (data.password == password) {
                req.session.user_id = user_id;
                res.json({success: true, message: "Authenticated successfully."});
            }
            else {
                res.json({success: false, message: "Wrong password"});
            }
        }
        else {
            res.json({success: false, message: "Username does not exists"});
        }
    });
});

app.get('/get_shares/:user_id', function(req, res) {
    /* Grab the data from the get request */
    var user_id = req.params.user_id;
    var transaction_id = parseInt(req.query.transaction_id);
    /* See if the user is logged in */
    if (isUserAuthenticated(req) == false) {
        res.json({success: false, message: "Please log in first."});
        return;
    }
    /* Search for the transaction */
    var share_data = GetTransactionSharesForUser(transaction_id, user_id);
    if (share_data) {
        res.json(share_data);
    }
    else {
        res.json({success: false, message: "Transaction not found"});
    }
});

app.get('/get_public_keys/:transaction_id', function (req, res) {
    var transaction_id = parseInt(req.params.transaction_id);
    var group_id = -1;
    /* Check for authenticated session */
    if (isUserAuthenticated(req) == false) {
        res.json({success: false, message: "Please log in first."});
        return;
    }
    /* Find group id associated with transaction */
    for (var i in transaction_mock_db) {
        if (transaction_mock_db[i].transaction_id == transaction_id) {
            group_id = transaction_mock_db[i].group_id;
        }
    }
    /* If transaction not found, return failure */
    if (group_id < 0) {
        res.json({success: false, message: "Transaction not found."});
    }
    /* Else, find group associated with the transaction */
    else {
        for (var i in group_mock_db) {
            if (group_mock_db[i].group_id == group_id) {
                res.json({success: true, user_ids: group_mock_db[i].members, public_keys: GetUsersPublicKeys(group_mock_db[i].members)});
                return;
            }
        }
        res.json({success: false, message: "Group associated with transaction not found."});
        return;
    }

});

/* POST API Is testable with Windows PowerShell, Example:
 $ $data = @{  creator    = "nadav";
 $             user_list = "naaav, danav, nadav";
 $             group_name = "nn111n"; }
 $ curl -Uri http://localhost:3000/create_group  -UseBasicParsing -Method Post -Body $data
 */

app.post('/create_group', function (req, res) {
    // TODO: Check authentication and equivalence of requestor of the request to creator of the group
    // TODO: Check all users in user_list exist.
    var creator = req.body.creator,
        user_list = req.body.user_list,
        group_name = req.body.group_name;
    database_interface.CreateNewGroup(creator, user_list, group_name, function(data, err) {
        if (err) {
            res.json({success: false, message: "Error occured while creating a new group." + err.message })
        }
        var success_message = "Group created, ID: " + data.id;
        res.json({success: true, message: success_message});
    });
    // TODO: For each user in the user list / creator, update document to include new group.
});

app.post('/register_user', function(req, res) {
    // TODO: Check parameters are in compliance with some policy we'll set regarding username, password etc.
    // TODO: Add an email authorization before actually inserting user into the database (Low priority).
});

app.post('/submit_transaction', function (req, res) {
    console.log("Received new transaction request");
    console.log(req.body)
});

var server = app.listen(3000, function () {
    var host = "localhost";
    var port = server.address().port;
    console.log('BetweenUs is up & listening at http://%s:%s', host, port);
    database_interface.InitUsersDB();
    database_interface.InitGroupsDB();
    database_interface.GetUsersPublicKeys(["liranbg@gmail.com"], function(data) {
        console.log(data);
    })
});
