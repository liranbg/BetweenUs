var BetweenUsModule = (function() {

  var defaults = {
    max_bit: 8,
    algorithm: 'aes-256-ctr'
  };
  var _crypto = require("crypto");
  var _secrets = require("./secrets.js");

  _secrets.init(defaults.max_bit); // deterimes the number of shares (2^x)-1. default is 8 -> means 255 shares maximum

  var GenerateSymmetricKeyInitDictionary = function() {
    // this functions returns a dictionary with 32 bytes symmetric key and an initialed vector
    var semmetric_key = _crypto.randomBytes(32); // 16 or 32 bytes
    var initializationVector = _crypto.randomBytes(16); // IV is always 16-bytes
    return {
      key: semmetric_key,
      iv: initializationVector
    };
  }
  var EncryptMessageWithSymmetricKeyDictionary = function(message,
    symmetric_key_dictionary) {
    var cipher = _crypto.createCipheriv(defaults.algorithm,
      symmetric_key_dictionary.key,
      symmetric_key_dictionary.iv);
    var crypted = Buffer.concat([cipher.update(message), cipher.final()]);
    return crypted;
  }
  var DecryptMessageWithSymmetricKeyDictionary = function(
      encrypted_message,
      symmetric_key_dictionary) {
      var decipher = _crypto.createDecipheriv(defaults.algorithm,
        symmetric_key_dictionary.key,
        symmetric_key_dictionary.iv);
      var dec = Buffer.concat([decipher.update(encrypted_message), decipher
        .final()
      ]);
      return dec;
    }
    /* Start Shamir Secret Sharing Public Functions */
  var BufferToShares = function(buffer, shares, threshold, zeropadding) {
    if (typeof buffer !== "object") {
      throw "Invalid Input: Buffer Input Only";
    }
    return _secrets.share(buffer.toString('hex'), shares, threshold,
      zeropadding);
  }
  var SharesToBuffer = function(shares) {
    if (typeof shares !== "object") {
      throw "Invalid Input: Shares Only";
    }
    var hex_string = _secrets.combine(shares)
    return Buffer(hex_string, 'hex');
  }
  var GetNewShare = function(id, shares) {
      if (typeof shares !== "object") {
        throw "Invalid Input: Shares Only";
      }
      return _secrets.newShare(id, shares); // => newShare = '808xxx...xxx'
    }
    /* End Shamir Secret Sharing Public Functions */
  return {
    BufferToShares: BufferToShares,
    SharesToBuffer: SharesToBuffer,
    GetNewShare: GetNewShare,
    GenerateSymmetricKeyInitDictionary: GenerateSymmetricKeyInitDictionary,
    Symmetric_Encrypt: EncryptMessageWithSymmetricKeyDictionary,
    Symmetric_Decrypt: DecryptMessageWithSymmetricKeyDictionary
  };

}(BetweenUsModule || {}));

var text_to_encrypt = "BetweenUs";
var symmetric_key_dictionary = BetweenUsModule.GenerateSymmetricKeyInitDictionary();
var encrypted_text = BetweenUsModule.Symmetric_Encrypt(
  text_to_encrypt, symmetric_key_dictionary);
var symmetric_key_shares = BetweenUsModule.BufferToShares(
  symmetric_key_dictionary.key, 5, 2, 10);
var sym_key_buffer = BetweenUsModule.SharesToBuffer(symmetric_key_shares.slice(
  0, 3));
var decrypted_symmetric_key_dictionary = {
  key: sym_key_buffer,
  iv: symmetric_key_dictionary.iv
};
var decrypted_text = BetweenUsModule.Symmetric_Decrypt(encrypted_text,
  decrypted_symmetric_key_dictionary);
console.log(decrypted_text.toString('utf8'));
