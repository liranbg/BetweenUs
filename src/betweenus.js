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
 * Check type and expected type. throws an error if types isn't matching.
 * @param  {variable} type          [Variable to check for type.]
 * @param  {string}   expected_type [String describing the expected type.]
 * @return {None}                   [Return true if types match, throws an error otherwise.]
 */
  var _type_assert = function(type, expected_type) {
      /* Check special case: buffer */
      if (Buffer.isBuffer(expected_type)) {
        if (!Buffer.isBuffer(type)) {
          throw new Error('Type Error. Expected: Buffer, Received: ' + typeof type +'.');
        }
        else {
          return true;
        }
      }
      else if (typeof type != typeof expected_type) {
          throw new Error('Type Error. Expected: ' + typeof expected_type +', Received: ' + typeof type +'.');
      }
  };

  var _types = {
        dictionary: {},
        number: 1,
        string: "s",
        buffer: Buffer("s"),
        obj: {}
      };
  /**
   * Serializes a dictionary into a stringfied JSON.
   * @param  {dictionary} dictionary  [contains a .key{Buffer} (random passphrase) and .iv{Buffer} (init vector) keys.]
   * @return {string}                 [Stringified input dictionary.]
   */
  var _serialized_symmetric_dictionary = function(dictionary) {
    var serialized = {};
    _type_assert(dictionary, _types.dictionary);
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
    _type_assert(json_string, _types.string);
    try {
      parsed_dictionary = JSON.parse(json_string);
    } catch (e) {
      throw "Invalid JSON Object to parse.";
    }
    /* Convert the hex strings into Buffer types (required by the AES algo.)  */
    _type_assert(parsed_dictionary, _types.dictionary);
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
    _type_assert(symmetric_key,         _types.buffer);
    _type_assert(initialization_vector, _types.buffer);
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
    _type_assert(message, _types.string);
    var key_object = _deserialized_symmetric_dictionary(symmetric_key_dictionary);
    var cipher = _crypto.createCipheriv(defaults.symmetric_algorithm.algorithm_name, key_object.key, key_object.iv);
    var crypted = Buffer.concat([cipher.update(message), cipher.final()]);
    _type_assert(crypted, _types.buffer);
    return crypted;
  };


/**
 * Receives an hex Buffer, and the dictionary containing the symmetric key data, and decrypts it.
 * @param  {Buffer} encrypted_message           [Encryped message, in the form of a Buffer object.]
 * @param  {string} symmetric_key_dictionary    [Serialized dictionary containing the symmetric key data.]
 * @return {Buffer}                             [Buffer containing the decrypted cipher text.]
 */
  var Symmetric_Decrypt = function(encrypted_message, symmetric_key_dictionary) {
      _type_assert(encrypted_message,         _types.buffer);
      _type_assert(symmetric_key_dictionary,  _types.string);
      var key_object = _deserialized_symmetric_dictionary(symmetric_key_dictionary);
      var decipher = _crypto.createDecipheriv(defaults.symmetric_algorithm.algorithm_name, key_object.key, key_object.iv);
      var dec = Buffer.concat([decipher.update(encrypted_message), decipher.final()]);
      _type_assert(dec, _types.buffer);
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
     _type_assert(serialized_dictionary,  _types.string);
     _type_assert(shares,                 _types.number);
     _type_assert(threshold,              _types.number);
     _type_assert(zeropadding,            _types.number);
     var share_list = _secrets.share(_secrets.str2hex(serialized_dictionary), shares, threshold, zeropadding);
     return share_list;
  };

  /**
   * Receives a list of shares, and reconstruct the original text with them.
   * @param  {Object} shares [A list of shares, each share should be an hex string.]
   * @return {string}        [Resolve the shares into the serialized dictionary that contains the encryption data.]
   */
  var SharesToSerializedDictionary = function(shares) {
    _type_assert(shares, _types.obj);
    var hex_string = _secrets.combine(shares);
    return _secrets.hex2str(hex_string);
  };

  /**
   * BetweenUs Module API
   */
  return {
    SerializedDictionaryToShares: SerializedDictionaryToShares,
    SharesToSerializedDictionary: SharesToSerializedDictionary,
    GenerateSymmetricKeyInitDictionary: GenerateSymmetricKeyInitDictionary,
    Symmetric_Encrypt: Symmetric_Encrypt,
    Symmetric_Decrypt: Symmetric_Decrypt
  };

}(BetweenUsModule || {}));
