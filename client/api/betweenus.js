//'use strict';
var _crypto = require("crypto-js");
var _secrets = require("./secrets.js");
_secrets.init();
_secrets.setRNG("asyncRandomBytes");
//_secrets.setRNG(function(bits){});


class BetweenUsSSS {

    static defaults = {
        rsa: {

        },
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

    /**
     * This  function applying encryption and decryption function to this module
     * @param encrypt_func
     * @param decrypt_func
     */
    static setRSA(encrypt_func, decrypt_func) {
        if ((!encrypt_func) || (!decrypt_func)) {
            throw new Error("You must provide both encryption and decryption functions");
        }
        if ((encrypt_func && typeof encrypt_func !== "function") || (decrypt_func && typeof decrypt_func !== "function")) {
            throw new Error(encrypt_func + "or" + decrypt_func + "is not a function.");
        }
        this.defaults.rsa = {
            encrypt: encrypt_func,
            decrypt: decrypt_func
        }
    };

    /**
     * Encrypts a message with the A-symmetric key data dictionary.
     * @param  {string}     share_plain             [Plain text to be encrypted.]
     * @param  {string }    public_key              [The public key for encrypting the plain text.]
     * @return {string}                             [String containing the output data - the cipher text.]
     */
    static AsymmetricEncrypt(share_plain, public_key) {
        if (this.defaults.rsa === undefined) {
            throw new Error("You must set the  RSA function before.");
        }
        return this.defaults.rsa.encrypt(share_plain, public_key);
    };

    /**
     * Receives an encrypted message, and the symmetric key to decrypt the message.
     * @param  {string} encrypted_share           [Encrypted message]
     * @param  {string} private_key               [A private key that uses to decrypt the data.]
     * @return {string}                           [Decrypted cipher text.]
     */
    static AsymmetricDecrypt(encrypted_share, private_key) {
        if (this.defaults.rsa === undefined) {
            throw new Error("You must set the RSA function before.");
        }
        return this.defaults.rsa.decrypt(encrypted_share, private_key);
    };

    /**
     * Passing a rng function to secrets. this function generates random bytes
     * @param func
     */
    static setRNG(func) {
        _secrets.setRNG(func);
    }

}
module.exports = BetweenUsSSS;