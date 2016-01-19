const
    express = require('express'),
    session = require('express-session'),
    body_parser = require('body-parser'),
    logger = require('morgan'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    cors = require('cors'),
    database_interface = require('./cloudantdb'),
    users = require('./routes/users'),
    groups = require('./routes/groups'),
    transactions = require('./routes/transactions');


var app = express();

app.use(logger('dev'));

app.use(cors({credentials: true, origin: true}));

// Initialize Session */

app.use(session({secret: 'ArbitraryStringToUseAsSession', resave: true, saveUninitialized: true}));


app.use(body_parser.json());
app.use(body_parser.urlencoded({extended: false}));

app.use(cookieParser());

app.use('/users', users);
app.use('/groups', groups);
app.use('/transactions', transactions);

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
        res.status(err.status || 500).json({
            success: false,
            error: err.message
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500).json({
        success: false,
        error: err.message
    });
});

var server = app.listen(3000, function () {
    var host = "localhost";
    var port = server.address().port;
    console.log('BetweenUs is up & listening at http://%s:%s', host, port);
    console.log("Initializing Database");
    database_interface.InitDataBases();

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
//
///* Server API */

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
//


//
//app.post('/submit_transaction', function (req, res) {
//    console.log("Received new transaction request");
//    console.log(req.body)
//});
//
