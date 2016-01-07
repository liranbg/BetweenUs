const
    express = require('express'),
    path = require('path'),
    session = require('express-session'),
    body_parser = require('body-parser'),
    logger = require('morgan'),
    favicon = require('serve-favicon'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    routes = require('./routes/index'),
    users = require('./routes/users'),
    database_interface = require('./cloudantdb');


var app = express();

// view engine setup
app.use(logger('dev'));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');


// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

// Initialize Session */
app.use(session({secret: 'ArbitraryStringToUseAsSession', resave: true, saveUninitialized: true}));

app.use(body_parser.json());
app.use(body_parser.urlencoded({extended: false}));

app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;


//TODO: Refactor all functions to its relevant pages & routes
///* Mock Database */
//
//var transaction_to_share_db = [
//    {transaction_id: 1000, user_id: "nadav", share_id:"nadav", share_data: "trans_1000_nadav_share_encrypted_with_nadav_public_key" },
//    {transaction_id: 1000, user_id: "nadav", share_id:"liran", share_data: null },
//    {transaction_id: 1000, user_id: "nadav", share_id:"yaron", share_data: null },
//
//    {transaction_id: 1000, user_id: "liran", share_id:"nadav", share_data: null},
//    {transaction_id: 1000, user_id: "liran", share_id:"liran", share_data: "trans_1000_liran_share_encrypted_with_liran_public_key" },
//    {transaction_id: 1000, user_id: "liran", share_id:"yaron", share_data: null },
//
//    {transaction_id: 1000, user_id: "yaron", share_id:"nadav", share_data: null },
//    {transaction_id: 1000, user_id: "yaron", share_id:"liran", share_data: null },
//    {transaction_id: 1000, user_id: "yaron", share_id:"yaron", share_data: "trans_1000_yaron_share_encrypted_with_yaron_public_key" }
//];
///* End of Mock Database */
//
//
//
///* Session Functions */
//var isUserAuthenticated = function(req) {
//    _session = req.session;
//    return (_session.user_id);
//};
//
///* Database Query Functions */
//var GetUsersPublicKeys = function(user_list) {
//    public_key_list = [];
//    for (var i in user_list) {
//        public_key_list.push(GetPublicKeyForUser(user_list[i]));
//    }
//    return public_key_list;
//};
//
//var GetPublicKeyForUser = function(user_id) {
//    for (var i in public_key_mock_db) {
//        if (public_key_mock_db[i].user_id == user_id) {
//            return public_key_mock_db[i].key;
//        }
//    }
//    return null;
//};
//
//var GetTransactionSharesForUser = function(transaction_id, user_id) {
//    for (var i in transaction_mock_db) {
//        if (transaction_mock_db[i].transaction_id == transaction_id) {
//            var return_share_data = [];
//            /* Get all the share information for the requesting user in the requested transaction */
//            for (var i in transaction_to_share_db) {
//                if (transaction_to_share_db[i].transaction_id == transaction_id && user_id == transaction_to_share_db[i].user_id) {
//                    return_share_data.push(transaction_to_share_db[i]);
//                }
//            }
//            return return_share_data;
//        }
//    }
//    return null;
//};
//
///* Start of server */
//app.get('/', function (req, res) {
//    res.send('Server initialized');
//});
//
///* Server API */
//app.get('/login/:user_id', function (req, res) {
//    var user_id = req.params.user_id;
//    var exists = false;
//    database_interface.GetUserDetailsByEmail(user_id, function(data) {
//        exists = true;
//        if ((data) && (data.username.length)) {
//            //User exists
//            var password = req.query.password;
//            if (data.password == password) {
//                req.session.user_id = user_id;
//                res.json({success: true, message: "Authenticated successfully."});
//            }
//            else {
//                res.json({success: false, message: "Wrong password"});
//            }
//        }
//        else {
//            res.json({success: false, message: "Username does not exists"});
//        }
//    });
//});
//
//app.get('/get_shares/:user_id', function(req, res) {
//    /* Grab the data from the get request */
//    var user_id = req.params.user_id;
//    var transaction_id = parseInt(req.query.transaction_id);
//    /* See if the user is logged in */
//    if (isUserAuthenticated(req) == false) {
//        res.json({success: false, message: "Please log in first."});
//        return;
//    }
//    /* Search for the transaction */
//    var share_data = GetTransactionSharesForUser(transaction_id, user_id);
//    if (share_data) {
//        res.json(share_data);
//    }
//    else {
//        res.json({success: false, message: "Transaction not found"});
//    }
//});
//
//app.get('/get_public_keys/:transaction_id', function (req, res) {
//    var transaction_id = parseInt(req.params.transaction_id);
//    var group_id = -1;
//    /* Check for authenticated session */
//    if (isUserAuthenticated(req) == false) {
//        res.json({success: false, message: "Please log in first."});
//        return;
//    }
//    /* Find group id associated with transaction */
//    for (var i in transaction_mock_db) {
//        if (transaction_mock_db[i].transaction_id == transaction_id) {
//            group_id = transaction_mock_db[i].group_id;
//        }
//    }
//    /* If transaction not found, return failure */
//    if (group_id < 0) {
//        res.json({success: false, message: "Transaction not found."});
//    }
//    /* Else, find group associated with the transaction */
//    else {
//        for (var i in group_mock_db) {
//            if (group_mock_db[i].group_id == group_id) {
//                res.json({success: true, user_ids: group_mock_db[i].members, public_keys: GetUsersPublicKeys(group_mock_db[i].members)});
//                return;
//            }
//        }
//        res.json({success: false, message: "Group associated with transaction not found."});
//        return;
//    }
//
//});
//
///* POST API Is testable with Windows PowerShell, Example:
// $ $data = @{  creator    = "nadav";
// $             user_list = "nadav@gmail.com, liranbg@gmail.com, yaron@gmail.com";
// $             group_name = "nn111n"; }
// $ curl -Uri http://localhost:3000/create_group  -UseBasicParsing -Method Post -Body $data
// */
//
//app.post('/create_group', function (req, res) {
//    // TODO: Check authentication and equivalence of requestor of the request to creator of the group
//    // TODO: Check all users in user_list exist.
//    var creator = req.body.creator,
//        user_list = req.body.user_list,
//        group_name = req.body.group_name;
//    user_list = user_list.split(",");
//    var users = [];
//    for (var i = 0; i < user_list.length; ++i) {
//        users.push(user_list[i].trim());
//    }
//    database_interface.CreateNewGroup(creator, users, group_name, function(group_data, err) {
//        if (err) {
//            res.json({success: false, message: "Error occurred while creating a new group." + err.message })
//        }
//        res.json({success: true, message: "Group created, Group details: " + group_data});
//        for (var i = 0; i < users.length; ++i) {
//            database_interface.GetUserByEmail(users[i], function(user_data, err) {
//                if (!err) {
//                    database_interface.AddGroupToUser(user_data, group_data, function(data, err) {
//                       if (!err) {
//                           console.log("Added group",group_data.id,"to user",user_data.email);
//                       }
//                    });
//                }
//            });
//        }
//    });
//
//    // TODO: For each user in the user list / creator, update document to include new group.
//});
//
//app.post('/register_user', function(req, res) {
//    // TODO: Check parameters are in compliance with some policy we'll set regarding username, password etc.
//    // TODO: Add an email authorization before actually inserting user into the database (Low priority).
//});
//
//app.post('/submit_transaction', function (req, res) {
//    console.log("Received new transaction request");
//    console.log(req.body)
//});
//
//var server = app.listen(3000, function () {
//    var host = "localhost";
//    var port = server.address().port;
//    console.log('BetweenUs is up & listening at http://%s:%s', host, port);
//    console.log("Initializing UsersUB");
//    database_interface.InitUsersDB();
//    console.log("Initializing GroupsDB");
//    database_interface.InitGroupsDB();
//    console.log("Initializing TransactionsDB");
//    database_interface.InitTransactionsDB();
//    console.log("Initializing SharesStashDB");
//    database_interface.InitSharesStashDB();
//    console.log("Done initializing databases");
//
//    //database_interface.getGroupByNameAndCreator("groupname","nadav", function(data) {
//    //    console.log(data);
//    //});
//    var list_of_stash = [{user:"liranbg@gmail.com", stash:"bla1"},{user:"nadav@gmail.com", stash:"bla2"}];
//    database_interface.CreateTransaction("liranbg@gmail.com", "123123", list_of_stash, "groupidaaa1", function(data) {
//        console.log(data);
//    })
//});
