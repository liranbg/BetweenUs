var BetweenUsModule = (function() {

  /* Symmetric Encryption Algorithms data */
  /**
   * Contains the data to be used when symmetric encryption is set to AES 256 bits.
   * @type {Object}
   */
  var aes_256 = {
    algorithm_name: 'aes-256-ctr',
    passphrase_byte_size: 32,
    init_vector_byte_size: 16
  };

  /**
   * Contains the data to be used when symmetric encryption is set to AES 128 bits.
   * @type {Object}
   */
  var aes_128 = {
    algorithm_name: 'aes-128-ctr',
    passphrase_byte_size: 16,
    init_vector_byte_size: 16
  };

  /* Defaults */
  /**
   * Contains the default data to be used throughout the module.
   * @type {Object}
   */
  var defaults = {
    max_bit: 8, // Determines the maximum amount of shares possible - maximum shares is calculated this way: (2^max_bits - 1).
    symmetric_algorithm: aes_256
  };

  var _crypto = require("crypto");
  var _secrets = require("./secrets.js");

  _secrets.init(defaults.max_bit);

  /**
   * Serializes a dictionary into a stringfied JSON.
   * @param  {dictionary} dictionary  [contains a .key{Buffer} (random passphrase) and .iv{Buffer} (init vector) keys.]
   * @return {string}                 [Stringified input dictionary.]
   */
  var _serialized_symmetric_dictionary = function(dictionary) {
    var serialized = {};
    serialized.key = dictionary.key.toString('hex');
    serialized.iv = dictionary.iv.toString('hex');
    return JSON.stringify(dictionary);
  };

  /**
   * Deserializes a JSON stringified dictionary into a javascript dictionary.
   * @param  {string}     json_string [JSON stringified dictionary containing .key and .iv in _hex_]
   * @return {dictionary}             [dictionary parsed from the stingified JSON]
   */
  var _deserialized_symmetric_dictionary = function(json_string) {
    var deserialized = {};
    try {
      parsed_dictionary = JSON.parse(json_string);
    } catch (e) {
      throw "Invalid JSON Object to parse.";
    }
    /* Convert the hex strings into Buffer types (required by the AES algo.)  */
    deserialized.key = Buffer(parsed_dictionary.key);
    deserialized.iv = Buffer(parsed_dictionary.iv);
    return deserialized;
  };

  /**
   * This function generates two random byte buffers, that act as the symmetric key passphrase and IV.
   * Then the function seralizes into a string that will later be used for the purpose of decrypting the
   * cipher text.
   * @return {string} [Return a serialized dictionary that contains the AES init data.]
   */
  var GenerateSymmetricKeyInitDictionary = function() {
    var symmetric_key = _crypto.randomBytes(defaults.symmetric_algorithm.passphrase_byte_size);
    var initialization_vector = _crypto.randomBytes(defaults.symmetric_algorithm.init_vector_byte_size);
    return _serialized_symmetric_dictionary({
      key: symmetric_key,
      iv: initialization_vector
    });
  };

/**
 *	Symmetric Encryption Section
 */
/**
 * Encrypts a message with the symmetric key data dictionary.
 * @param  {string}     message                  [Plain text to be encrypted.]
 * @param  {dictionary} symmetric_key_dictionary [Dictionary containing the data needed for encrypting the plain text.]
 * @return {Buffer}                              [Buffer containing the output data - the cipher text.]
 */
  var Symmetric_Encrypt = function(message, symmetric_key_dictionary) {
    var key_object = _deserialized_symmetric_dictionary(symmetric_key_dictionary);
    var cipher = _crypto.createCipheriv(defaults.symmetric_algorithm.algorithm_name, key_object.key, key_object.iv);
    var crypted = Buffer.concat([cipher.update(message), cipher.final()]);
    return crypted;
  };


/**
 * Receives an hex Buffer, and the dictionary containing the symmetric key data, and decrypts it.
 * @param  {Buffer} encrypted_message           [Encryped message, in the form of a Buffer object.]
 * @param  {string} symmetric_key_dictionary    [Serialized dictionary containing the symmetric key data.]
 * @return {Buffer}                             [Buffer containing the decrypted cipher text.]
 */
  var Symmetric_Decrypt = function(encrypted_message, symmetric_key_dictionary) {
      var key_object = _deserialized_symmetric_dictionary(symmetric_key_dictionary);
      var decipher = _crypto.createDecipheriv(defaults.symmetric_algorithm.algorithm_name, key_object.key, key_object.iv);
      var dec = Buffer.concat([decipher.update(encrypted_message), decipher.final()]);
      return dec;
    };

/**
 *  Shamir Secret Sharing Section
 */
/**
 * Receives a serialized dictionary that contains the Symmetric encryption data
 * and uses Shamir's Secret Sharing algorithm to divide it into N shares, with
 * a threshold of K.
 * @param  {string} serialized_dictionary [Serialized dicionary that contains the encryption information]
 * @param  {number} shares                [Numbers of shares to produce with SSS algo. out of the original text.]
 * @param  {number} threshold             [Threshold of shares needed to restore the original text.]
 * @param  {number} zeropadding           [Padding.]
 * @return {Object}                       [Object that contains the list of the actual shares in hex string forms.]
 */
  var SerializedDictionaryToShares = function(serialized_dictionary, shares, threshold, zeropadding) {
    if (typeof serialized_dictionary !== "string") {
      throw "Invalid Input: String Input Only";
    }
     var share_list = _secrets.share(_secrets.str2hex(serialized_dictionary), shares, threshold, zeropadding);
     return share_list;
  };

  /**
   * Receives a list of shares, and reconstruct the original text with them.
   * @param  {Object} shares [A list of shares, each share should be an hex string.]
   * @return {string}        [Resolve the shares into the serialized dictionary that contains the encryption data.]
   */
  var SharesToSerializedDictionary = function(shares) {
    if (typeof shares !== "object") {
      throw "Invalid Input: Shares Only";
    }
    var hex_string = _secrets.combine(shares);
    return _secrets.hex2str(hex_string);
  };

  /**
   * [function description]
   * @param  {[type]} id     [description]
   * @param  {[type]} shares [description]
   * @return {[type]}        [description]
   */
  var GetNewShare = function(id, shares) {
      if (typeof shares !== "object") {
        throw "Invalid Input: Shares Only";
      }
      return _secrets.newShare(id, shares); // => newShare = '808xxx...xxx'
    };

    /**
     * BetweenUs Module API
     */
  return {
    SerializedDictionaryToShares: SerializedDictionaryToShares,
    SharesToSerializedDictionary: SharesToSerializedDictionary,
    GetNewShare: GetNewShare,
    GenerateSymmetricKeyInitDictionary: GenerateSymmetricKeyInitDictionary,
    Symmetric_Encrypt: Symmetric_Encrypt,
    Symmetric_Decrypt: Symmetric_Decrypt
  };

}(BetweenUsModule || {}));

var text_to_encrypt = "BetweenUs";
var symmetric_key_dictionary = BetweenUsModule.GenerateSymmetricKeyInitDictionary();
var encrypted_buffer = BetweenUsModule.Symmetric_Encrypt(text_to_encrypt, symmetric_key_dictionary);
var symmetric_key_shares = BetweenUsModule.SerializedDictionaryToShares(symmetric_key_dictionary, 5, 2, 10);
var from_shares_symmetric_key_dictionary = BetweenUsModule.SharesToSerializedDictionary(symmetric_key_shares.slice(0, 3));
var decrypted_buffer = BetweenUsModule.Symmetric_Decrypt(encrypted_buffer, from_shares_symmetric_key_dictionary);
console.log(decrypted_buffer.toString('utf8'));
