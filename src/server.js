var express = require('express');
var app = express();

/* Mock Database */
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

app.get('/', function (req, res) {
  res.send('Server initialized');
});

app.get('/get_shares/:user_id', function(req, res) {
  /* Grab the data from the get request */
  user_id = req.params.user_id;
  transaction_id = parseInt(req.query.transaction_id);
  /* Search for the transaction */
  for (var i in transaction_mock_db) {
    if (transaction_mock_db[i].transaction_id == transaction_id) {
      var return_share_data = []
      /* Get all the share information for the requesting user in the requested transaction */
      for (var i in transaction_to_share_db) {
         if (transaction_to_share_db[i].transaction_id == transaction_id && user_id == transaction_to_share_db[i].user_id) {
           return_share_data.push(transaction_to_share_db[i]);
        }
       }
      /* Place all the data into the json format */
      res.json(return_share_data);
      return;
     }
    }
  res.json({err: "Transaction not found"});
  });

var server = app.listen(3000, function () {
  var host = "localhost";
  var port = server.address().port;
  console.log('Example app listening at http://%s:%s', host, port);
});
