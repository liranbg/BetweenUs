//'use strict';
var _crypto = require("crypto-js");
var _secrets = require("./secrets.js");
_secrets.init();
_secrets.setRNG("asyncRandomBytes");
//_secrets.setRNG(function(bits){});


class BetweenUsSSS {

    static get defaults() {
        return {
            aes_128: {
                algorithm_name: 'aes-128-ctr',
                passphrase_byte_size: 16,
                init_vector_byte_size: 16
            },
            aes_256:{
                algorithm_name: 'aes-256-ctr',
                passphrase_byte_size: 32,
                init_vector_byte_size: 16
            },
            random_bytes_length: 512,
            max_bit: 8 // Determines the maximum amount of shares possible - maximum shares is calculated this way: (2^max_bits - 1).
        };

    }

    /**
     * Check type and expected type. throws an error if types isn't matching.
     * @param type              [Variable to check for type.]
     * @param expected_type     [String describing the expected type.]
     * @private
     */
    static _type_assert (type, expected_type) {
        var _types = { number: 1, string: "s", object: {} };
        if ((!_types[expected_type]) && (typeof type != typeof _types[expected_type])) {
            throw new Error('Type Error. Expected: ' + typeof _types[expected_type] + ', Received: ' + typeof type + '.');
        }
    };

    /**
     * TODO: improve symmetric key
     * @constructor
     */
    static GenerateSymmetricKey() {
        return _secrets.random(this.defaults.random_bytes_length);
    };

    /**
     * Encrypts a message with the symmetric key data dictionary.
     * @param  {string}     message                 [Plain text to be encrypted.]
     * @param  {string }    symmetric_key           [A key for encrypting the plain text.]
     * @return {string}                             [String containing the output data - the cipher text.]
     */
    static SymmetricEncrypt(message, symmetric_key) {
        BetweenUsSSS._type_assert(symmetric_key, "string");
        BetweenUsSSS._type_assert(message, "string");
        return _crypto.AES.encrypt(JSON.stringify(message), symmetric_key).toString();
    };

    /**
     * Receives an encrypted message, and the symmetric key to decrypt the message.
     * @param  {string} encrypted_message           [Encrypted message]
     * @param  {string} symmetric_key               [Symmetric key data.]
     * @return {string}                             [Decrypted cipher text.]
     */
    static SymmetricDecrypt(encrypted_message, symmetric_key) {
        BetweenUsSSS._type_assert(encrypted_message, "string");
        BetweenUsSSS._type_assert(symmetric_key, "string");
        var bytes = _crypto.AES.decrypt(encrypted_message, symmetric_key);
        return JSON.parse(bytes.toString(_crypto.enc.Utf8));
    };

    /**
     * Receives a symmetric encryption data and uses Shamir's Secret Sharing algorithm to divide it into N shares, with
     * a threshold of K.
     * @param  {string} symmetric_key       [Encryption information]
     * @param  {number} shares_amount       [Numbers of shares to produce with SSS algo. out of the original text.]
     * @param  {number} threshold           [Threshold of shares needed to restore the original text.]
     * @param  {number} zeropadding         [Padding.]
     * @return {Object}                     [List of the actual shares in hex string forms.]
     */
    static MakeShares(symmetric_key, shares_amount, threshold, zeropadding) {
        BetweenUsSSS._type_assert(symmetric_key, "string");
        BetweenUsSSS._type_assert(shares_amount, "number");
        BetweenUsSSS._type_assert(threshold, "number");
        BetweenUsSSS._type_assert(zeropadding, "number");
        var async = true;
        return _secrets.share(symmetric_key, shares_amount, threshold, zeropadding, async);
    };

    /**
     * Receives a list of shares, and reconstruct the original text with them.
     * @param  {Object} shares [A list of shares, each share should be an hex string.]
     * @return {string}        [Resolve the shares into the form that contains the encryption data.]
     */
    static CombineShares(shares) {
        BetweenUsSSS._type_assert(shares, "object");
        return _secrets.combine(shares);
    };

    static AsymmetricEncrypt(share_plain, rsa_key) {
        //var data_to_encrypt = rsa_key.encrypt(share_plain, 'Base64');
        return share_plain;
    };

    static AsymmetricDecrypt(encrypted_share, rsa_key) {
        //encrypted_share = rsa_key.decrypt(encrypted_share, 'utf8');
        return encrypted_share;
    };

    /**
     * Passing a rng functoin to secrets. this function generates random bytes
     * @param func
     */
    static setRNG(func) {
        _secrets.setRNG(func);
    }

}
module.exports = BetweenUsSSS;