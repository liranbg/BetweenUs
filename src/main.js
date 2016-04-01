/**
 * This file main.js purpose is to demonstrate clients[1..3] communications throughout BetweenUs protocols.
 * Scenario 1 is related to Encryption flow which is described graphically in our project files
 * 1. Client 1 wants to share a file with his friends (client 2, client 3).
 * 		A) Generates a symmetric key
 * 		B) Encryptes the target file to be shared with his friends
 * 		C) Using ShamirSecretSharing to split the symmetric key into N shares
 * 		D) Encrypt each of client's x share with thier public key
 * 		E) Each client gets his encrypted (with his public key) share and decrypt it with his private key.
 * 		F) If one of the clients wants to decrypt the shared file. he needs to join his share with the other clients (need k of n shares)
 * 			F-1) Once he gets all the required shares, he can join them and get the symmetric key to open the shared file.
 * 		 	F-2) Decrypts the shared file with the symmetric key
 */

var BetweenUsModule = require('./betweenus');
var RSA = require('node-rsa');
var rsa_bits = 1024;

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


//Client 1 creates symmetric key [represented as dictoinary. holds key and initial vector]
console.log("-------------------");
console.log('Starting BetweenUs flow on text:');
console.log('"' + text_to_encrypt + '"');
console.log('Generating Symmetric Key...');
var symmetric_key = BetweenUsModule.GenerateSymmetricKeyDictionary();
console.log('Done.');
console.log('Key: ' + symmetric_key);

//Client 1 encryptes [text_to_encrypt] with the symmetric key from above
console.log('Generating cipher text using previously generated symmetric key...');
var encrypted_buffer = BetweenUsModule.SymmetricEncrypt(text_to_encrypt, symmetric_key);
console.log('Encryption done.');
console.log('Cipher text: ' + encrypted_buffer.toString('hex'));
//Client 1 gets client list to share the secret with. then encryptes each share with client's public key accordingly
var clients_to_share_with = [client_1, client_2, client_3];
console.log('Using Shamir\'s Secret Sharing to split symmetric key into shares.');
var shares = BetweenUsModule.MakeShares(symmetric_key, clients_to_share_with.length, 2, 0);


console.log('Done.');
console.log('Starting encryption with RSA');
var assigned_shares = [];
for (var i in shares) {
    console.log('ID: ' + clients_to_share_with[i].id + ', Share: ' + shares[i]);
    var start = process.hrtime();
    assigned_shares.push({
        belong_to: clients_to_share_with[i].id,
        share: BetweenUsModule.AsymmetricEncrypt(shares[i], clients_to_share_with[i].assymetric_key.rsa_key)
    });
    console.log("Took %d seconds", (process.hrtime(start)[1]*1e-9).toFixed(5));
}
//SKIPPED: Server gets all shares and assign it to the relevant oarticipant

//each client reveals his share by decrypt with private key
console.log('Starting decryption client\'s shares');
for (var i in clients_to_share_with) {
    for (var j in assigned_shares) {
        if (assigned_shares[j].belong_to == clients_to_share_with[i].id) {
            console.log('ID: ' + clients_to_share_with[i].id + ', Encrypted Share: ' + assigned_shares[j].share);
            var start = process.hrtime();
            clients_to_share_with[i].owned_share = BetweenUsModule.AsymmetricDecrypt(assigned_shares[j].share, clients_to_share_with[i].assymetric_key.rsa_key);
            console.log("Took %d seconds", (process.hrtime(start)[1]*1e-9).toFixed(5));
        }
    }
}
//Checking all clients has correct shares. if not prints client id
for (var i in clients_to_share_with) {
    if (shares.indexOf(clients_to_share_with[i].owned_share) == -1) {
        console.log(clients_to_share_with[i].id);
    }
}

//Restoring information from raw shares
var shares_to_decrypt = [clients_to_share_with[0].owned_share, clients_to_share_with[1].owned_share];
var from_shares_symmetric_key_dictionary = BetweenUsModule.CombineShares(shares_to_decrypt);
var decrypted_buffer = BetweenUsModule.SymmetricDecrypt(encrypted_buffer, from_shares_symmetric_key_dictionary);

console.log(decrypted_buffer.toString('utf-8'));
