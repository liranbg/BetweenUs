var BetweenUsModule = require('./betweenus');
var RSA = require('node-rsa');
var winston = require('winston');
var moment = require('moment');
var logger = new(winston.Logger)({
  transports: [
    new(winston.transports.File)({
      // humanReadableUnhandledException: true,
      // handleExceptions: true,
      colorize: true,
      json: false,
      level: 'debug',
      name: 'info-file',
      filename: 'info.json',
      timestamp: function() {
        return moment(new Date()).format("YYYY-MM-dTHH:mm:ss:SSS");
      },
      formatter: function(options) {
        // Return string will be passed to logger.
        return options.timestamp() + ' ' + options.level.toUpperCase() + ' ' + (undefined !== options.message ? options.message : '') +
          (options.meta && Object.keys(options.meta).length ? '\n\t' + JSON.stringify(options.meta) : '');
      }
    }),
    new(winston.transports.Console)({
      level: 'error',
      timestamp: function() {
        return moment(new Date()).format("YYYY-MM-dTHH:mm:ss:SSS");
      },
      formatter: function(options) {
        // Return string will be passed to logger.
        return options.timestamp() + ' ' + options.level.toUpperCase() + ' ' + (undefined !== options.message ? options.message : '') +
          (options.meta && Object.keys(options.meta).length ? '\n\t' + JSON.stringify(options.meta) : '');
      }
    })
  ]
});
var rsa_bits = 512;

function encrypt_with_public_key(share, rsa_key) {
  return rsa_key.encrypt(share, 'base64');
}

function decrypt_with_private_key(enc_share, rsa_key) {
  return rsa_key.decrypt(enc_share, 'utf8');
}
var text_to_encrypt = "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

var client_1 = {
  id: 'client1',
  assymetric_key: {
    rsa_key: new RSA({b: rsa_bits})
  },
  owned_share: null,
  share_hold: []
};
var client_2 = {
  id: 'client2',
  assymetric_key: {
    rsa_key: new RSA({
      b: rsa_bits
    })
  },
  owned_share: null,
  share_hold: []
};
var client_3 = {
  id: 'client3',
  assymetric_key: {
    rsa_key: new RSA({
      b: rsa_bits
    })
  },
  owned_share: null,
  share_hold: []
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
logger.info('Starting BetweenUs flow on text:');
logger.info('"' + text_to_encrypt + '"');
logger.info('Generating Symmetric Key...');
var symmetric_key = BetweenUsModule.GenerateSymmetricKeyDictionary();
logger.info('Done.');
logger.info('Key: ' + symmetric_key);

//Client 1 encryptes [text_to_encrypt] with the symmetric key from above
logger.info('Generating cipher text using previously generated symmetric key...');
var encrypted_buffer = BetweenUsModule.SymmetricEncrypt(text_to_encrypt, symmetric_key);
logger.info('Encryption done.');
logger.info('Cipher text: ' + encrypted_buffer.toString('hex'));
//Client 1 gets client list to share the secret with. then encryptes each share with client's public key accordingly
var clients_to_share_with = [client_1, client_2, client_3];
logger.info('Using Shamir\'s Secret Sharing to split symmetric key into shares.');
var shares = BetweenUsModule.SerializedDictionaryToShares(symmetric_key, clients_to_share_with.length, 2, 0);
logger.info('Done.');
logger.info('Shares:');
var assigned_shares = [];
for (var i in shares) {
  logger.info('ID: ' + clients_to_share_with[i].id + ', Share: ' + shares[i]);
  assigned_shares.push({
    belong_to: clients_to_share_with[i].id,
    share: encrypt_with_public_key(shares[i], clients_to_share_with[i].assymetric_key.rsa_key)
  });
}
//SKIPPED: Server gets all shares and assign it to the relevant oarticipant

//each client reveals his share by decrypt with private key
for (var i in clients_to_share_with) {
  for (var j in assigned_shares) {
    if (assigned_shares[j].belong_to == clients_to_share_with[i].id) {
      clients_to_share_with[i].owned_share = decrypt_with_private_key(assigned_shares[j].share, clients_to_share_with[i].assymetric_key.rsa_key);
    }
  }
}
//Checking all clients has correct shares. if not prints client id
for (var i in clients_to_share_with) {
  if (shares.indexOf(clients_to_share_with[i].owned_share) == -1) {
    logger.info(clients_to_share_with[i].id);
  }
}

//Restoring information from raw shares
shares_to_derypt = [clients_to_share_with[0].owned_share, clients_to_share_with[1].owned_share];

var from_shares_symmetric_key_dictionary = BetweenUsModule.SharesToSerializedDictionary(shares_to_derypt);
var decrypted_buffer = BetweenUsModule.SymmetricDecrypt(encrypted_buffer, from_shares_symmetric_key_dictionary);

logger.info(decrypted_buffer.toString('utf-8'));
