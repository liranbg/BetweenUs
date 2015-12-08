var BetweenUsModule = require('./betweenus.js');
var crypto = require('crypto');

function encrypt_with_public_key(share, public_key) {
  var cipher = crypto.createCipher('aes-128-ctr', public_key);
  var crypted = Buffer.concat([cipher.update(share), cipher.final()]);
  return crypted;
}
function decrypt_with_private_key(enc_share, private_key) {
  var decipher = crypto.createDecipher('aes-128-ctr', private_key);
  var dec = Buffer.concat([decipher.update(enc_share), decipher.final()]);
  return dec.toString('utf8');
}


var text_to_encrypt = "BetweenUs";

var client_1 = {
  id: 'client1',
  assymetric_key: {
    private_key: "client_1_key",
    public_key: "client_1_key",
  },
  owned_share: null
};
var client_2 = {
  id: 'client2',
  assymetric_key: {
    private_key: "client_2_key",
    public_key: "client_2_key",
  },
  owned_share: null
};
var client_3 = {
  id: 'client3',
  assymetric_key: {
    private_key: "client_3_key",
    public_key: "client_3_key",
  },
  owned_share: null
};

/*
Scenario: [Encryption\Creating transaction] -  Client 1 wants to encrypt the text declared in [text_to_encrypt].
1. Creates a transaction by generating symmetric key that will be used to encrypt the [text_to_encrypt]
2. -- Need to ask participants public keys from server, SKIPPED FOR NOW --
3. Create shares according to number of participants in his group and the threshold.
4. Encryptes each share with each participant's public key accordingly
5. -- Need to upload each encrypted share to server --
6. Each client gets his share encrypted with his public key
 */

//Client 1 creates symmetric key [represented as dictoinary. holds key and initial vector]
var symmetric_key = BetweenUsModule.GenerateSymmetricKeyDictionary();

//Client 1 encryptes [text_to_encrypt] with the symmetric key from above
var encrypted_buffer = BetweenUsModule.SymmetricEncrypt(text_to_encrypt, symmetric_key);

//Client 1 gets client list to share the secret with. then encryptes each share with client's public key accordingly
var clients_to_share_with = [client_1, client_2, client_3];
var shares = BetweenUsModule.SerializedDictionaryToShares(symmetric_key, clients_to_share_with.length, 2, 0);
var assigned_shares = [];
for (var i in shares) {
  assigned_shares.push({
    belong_to: clients_to_share_with[i].id,
    share: encrypt_with_public_key(shares[i], clients_to_share_with[i].assymetric_key.public_key)
  });
}
//SKIPPED: Server gets all shares and assign it to the relevant oarticipant

//each client reveals his share by decrypt with private key
for (var i in clients_to_share_with) {
  for (var j in assigned_shares) {
    if (assigned_shares[j].belong_to == clients_to_share_with[i].id) {
      clients_to_share_with[i].owned_share = decrypt_with_private_key(assigned_shares[j].share, clients_to_share_with[i].assymetric_key.private_key);
    }
  }
}
//Checking all clients has correct shares. if not prints client id
for (var i in clients_to_share_with) {
  if (shares.indexOf(clients_to_share_with[i].owned_share) == -1) {
    console.log(clients_to_share_with[i].id);
  }
}


// var from_shares_symmetric_key_dictionary = BetweenUsModule.SharesToSerializedDictionary(symmetric_key_shares.slice(0, 3));
// var decrypted_buffer = BetweenUsModule.Symmetric_Decrypt(encrypted_buffer, from_shares_symmetric_key_dictionary);
// console.log(decrypted_buffer.toString('utf8'));
