const
    express = require('express'),
    session = require('express-session');
var app = express();

/* Initialize Session */
app.use(session({secret: 'ArbitraryStringToUseAsSession', resave: true, saveUninitialized: true}));

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
  {transaction_id: 1000, ciper_text: "encrypted_aes_message", group: 1},
];

var public_key_mock_db = [
  {id: "nadav", key: "nnnnnnnnnnnnnnn"},
  {id: "liran", key: "lllllllllllllll"},
  {id: "yaron", key: "yyyyyyyyyyyyyyy"}
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

var AuthenticateUser = function(req, user_id, password) {
    _session = req.session;
    for (var i in user_login_db) {
        if (user_login_db[i].user_id == user_id && user_login_db[i].password == password) {
            _session.user_id = user_id;
            return true;
        }
    }
    return false;
};

/* Database Query Functions */
var GetTransactionSharesForUser = function(transaction_id, user_id) {
    for (var i in transaction_mock_db) {
        if (transaction_mock_db[i].transaction_id == transaction_id) {
            var return_share_data = []
            /* Get all the share information for the requesting user in the requested transaction */
            for (var i in transaction_to_share_db) {
                if (transaction_to_share_db[i].transaction_id == transaction_id && user_id == transaction_to_share_db[i].user_id) {
                    return_share_data.push(transaction_to_share_db[i]);
                }
                return return_share_data;
            }
            /* If transaction / user_id shares not found */
            return null;
        }
    }
};

/* Start of server */
app.get('/', function (req, res) {
  res.send('Server initialized');
});

/* Server API */
app.get('/login/:user_id', function (req, res) {
    var user_id = req.params.user_id;
    var password = req.query.password;
    if (AuthenticateUser(req, user_id, password)){
        res.json({message: "Authenticated successfully."});
    }
    else {
        res.json({err: "User name or password not found."});
    }
});

app.get('/get_shares/:user_id', function(req, res) {
  /* Grab the data from the get request */
  var user_id = req.params.user_id;
  var transaction_id = parseInt(req.query.transaction_id);
    /* See if the user is logged in */
    if (isUserAuthenticated(req) == false) {
        res.json({err: "Please log in first."});
        return;
    }
  /* Search for the transaction */
  var share_data = GetTransactionSharesForUser(transaction_id, user_id);
  if (share_data) {
    res.json(share_data);
  }
  else {
    res.json({err: "Transaction not found"});
  }
});

var server = app.listen(3000, function () {
  var host = "localhost";
  var port = server.address().port;
  console.log('Example app listening at http://%s:%s', host, port);
});
