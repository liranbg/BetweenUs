# BetweenUS

> ###Repository Information
#### Issues Manager
[Issues Backlog](https://waffle.io/liranbg/JCEFinalProject)
#### Calendar Manager
[Calendar Manager](https://trello.com/b/nJPCPDXT/jcefinalproject)


## Essential Code Review
```javascript
/** RequestAndResolveShareStash
 * FLOW:
 * 1. Request the entire stash from the server for the transaction_id, the requesting user id is derived from the session.
 * 2. For each share, decrypt it using private key.
 * 3. Take all the decrypted shares and combine them with SSS.
 * 4. The output of combining the shares is the symmetric key usd to encrypt the cipher text.
 * 5. Decrypt cipher text and output result in the appropriate output window..
 *
 * @param transaction_id - The transaction which secret we want to solve.
 * @param secret_output_textarea_id - HTML textarea object to use as output for the decrypted secret.
 */
function RequestAndResolveShareStash(transaction_id, secret_output_textarea_id) {
    $.ajax({
        /* Issue a get request to the server, which return a structure of this form:
         {
         "success":true,
         "shares_list":
         [
         {"bits":8,"id":1,"data":"share1_that's_with_requesting_user_public_key"},
         {"bits":8,"id":2,"data":"share2_that's_with_requesting_user_public_key"},
         {"bits":8,"id":3,"data":"share3_that's_with_requesting_user_public_key"}
         ]
         }
         */
        type: "GET",
        url: server + "/transactions/get_all_shares?transaction_id=" + transaction_id,
        dataType:'json',
        xhrFields: {withCredentials: true},
        success: function(data, status, xhr) {
            /* Upon success, we now have an object of the format mentioned above,
             Iterate through the share list, decrypting each one with the user supplied private key.
             */
            var private_key = _mock_get_private_key();
            var decrypted_shares = [];
            var encrypted_shares = data.shares_list;
            /* Decrypt all shares here. */
            for (var i in encrypted_shares) {
                var share = encrypted_shares[i];
                if (share.length == 0) continue;
                share.data = _mock_rsa_decrypt(share.data, private_key);
                decrypted_shares.push(share);
            }
            /* After finishing iterating through the share list and decrypting them, we now can combine them together
             in order to reconstruct the secret, that is the symmetric key.
             NOTE: the reconstructed secret will only be valid if the amount of shares we have, is equal or greater
             than the threshold defined when generating the shares.
             */
            var symmetric_key = betweenus.CombineShares(decrypted_shares);
            /* Once we have the symmetric key, we query the server for the actual encrypted data, solving it using
             the symmetric key we constructing, and outputting it to the supplied output textarea.
             */

            /* The next fragment of code is usually executed in another function, but for the sake of verbosity, we've
             included the function body here.
             Func Call: SolveTransactionWithSymmetricKey(transaction_id, symmetric_key, secret_output_textarea_id);
             */
            $.ajax({
                /* Query the server for the cipher data, which returns a structure of this form:
                 {
                 "success":true,
                 "cipher":
                 {
                 "type":"String",
                 "data":"\u0002F°r\u0007êÒ\u0017Â\u000b\u0015\u0015_¡ÑÐ!»..\u0017tö"
                 }
                 }
                 */
                type: "GET",
                url: server + "/transactions/get_cipher_data?transaction_id=" + transaction_id,
                dataType:'json',
                xhrFields: {withCredentials: true},
                success: function(data, status, xhr) {
                    /* extract relevant data, and use the BetweenUs module SymmetricDecrypt function.
                     SymmetricDecrypt arguments are:
                     * param1: uIntArray/Buffer of the cipher data.
                     * param2: String representing the serialized AES key data
                     * return: uIntArray/Buffer containing the plain text.
                     */
                    var cipher_text = data.cipher.data,
                        output_text = betweenus.SymmetricDecrypt(Util_Text2uIntArray(cipher_text), symmetric_key);
                    output_text = Util_uIntArray2Text(output_text);
                    /* Done decrypting and converting data.
                     Output the data for the user to see.
                     */
                    $("#" + secret_output_textarea_id).prop("hidden", false);
                    $("#" + secret_output_textarea_id).val(output_text);
                },
                error: function(xhr, status, error) {
                    alert("Error fetching cipher data.");
                }});
        },
        error: function(xhr, status, error) {
            alert("An error occured while fetching the share stash.");
        }});
}
```
