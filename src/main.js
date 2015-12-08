var text_to_encrypt = "BetweenUs";

var client_1 = {
  assymetric_key: {
    private_key: "",
    public_key: "",
  },

  owned_share: "",
};
var client_2 = {
  assymetric_key: {
    private_key: "",
    public_key: "",
  },

  owned_share: "",
};


var symmetric_key_dictionary = BetweenUsModule.GenerateSymmetricKeyInitDictionary();
var encrypted_buffer = BetweenUsModule.Symmetric_Encrypt(text_to_encrypt, symmetric_key_dictionary);
var symmetric_key_shares = BetweenUsModule.SerializedDictionaryToShares(symmetric_key_dictionary, 5, 2, 10);
var from_shares_symmetric_key_dictionary = BetweenUsModule.SharesToSerializedDictionary(symmetric_key_shares.slice(0, 3));
var decrypted_buffer = BetweenUsModule.Symmetric_Decrypt(encrypted_buffer, from_shares_symmetric_key_dictionary);
console.log(decrypted_buffer.toString('utf8'));
