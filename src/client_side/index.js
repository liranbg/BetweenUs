

var server = "http://localhost:3000";

/* Requirements:
 * libraries:
 -  jquery
 -  crypto_actions.js
 * notes:
 -  ajax requests that requires authentication must be sent with:
 'xhrFields: {withCredentials: true}'
 as one of the parameters, otherwise a CORS issue will arise.
 */


/* Button OnClick Handlers. */

/** Register user according to the details received.
 *
 * Uses global variable 'server' and a predefined REST URI address to submit the request.
 * Prints the success / error status on the output_text_field.
 *
 * @param email_field_id
 * @param password_field_id
 * @param public_key_field_id
 * @param output_field_id
 * @return None
 */
function RegisterFormOnClick (email_field_id, password_field_id, public_key_field_id, output_field_id) {
    var email = $("#" + email_field_id).val();
    var password =  $("#" + password_field_id).val();
    var public_key = $("#" + public_key_field_id).val();
    var json_data = {email: email, password: password, public_key: public_key };
    $.ajax({
        type: "POST",
        url: server + "/users/register_user",
        data: json_data,
        dataType:'json',
        success: function(data, status, xhr) {
            $('#' + output_field_id).val(xhr.responseText)
        },
        error: function(xhr, status, error) {
            $('#' + output_field_id).val(JSON.parse(xhr.responseText).error.message);
        }
    });
}

/** Authorization to the server.
 *
 * sends authentication requests to the predefined server api, on success, it initializes
 * a session with the server, and redirects the page to groups menu - groups.html.
 *
 * @param email_field_id
 * @param password_field_id
 * @param output_field_id
 * @constructor
 */
function LoginFormOnClick (email_field_id, password_field_id, output_field_id) {
    var email = $("#" + email_field_id).val();
    var password =  $("#" + password_field_id).val();
    var json_data = {email: email, password: password };
    $.ajax({
        type: "POST",
        url: server + "/users/login",
        data: json_data,
        dataType:'json',
        xhrFields: {withCredentials: true},
        success: function(data, status, xhr) {
            $('#' + output_field_id).val(xhr.responseText)
            window.location.href = "groups.html";
        },

        error: function(xhr, status, error) {
            $('#' + output_field_id).val(JSON.parse(xhr.responseText).error);
        }
    });
}

/** Get all the groups for the user.
 *
 * Gets all the groups for the user in session, and fills the data into the table.
 *
 * @param groups_table_id id of a table that consists of 4 columns headers; id, name, member amount, transaction amount.
 * @return None
 */
function GetGroupsOnClick(groups_table_id) {
    $.ajax({
        type: "GET",
        url: server + "/groups/get_groups",
        dataType:'json',
        xhrFields: {withCredentials: true},
        success: function(data, status, xhr) {
            Util_ClearTable(groups_table_id);
            for (var i in data.groups) {
                var transaction_amt = data.groups[i].value.transactions_length;
                var member_amt, group_name, group_id;
                member_amt = data.groups[i].value.members_length; // Members
                group_name = data.groups[i].value.group_name;
                console.log(data.groups[i].value);
                group_id = '<a href ="group.html?group_id=' +  data.groups[i].value.group_id + '">' + data.groups[i].value.group_id + '</a>';
                // Append row to the table.
                $('#' + groups_table_id + ' tr:last').after('<tr><td>' + group_id +'</td><td>' + group_name + '</td><td>' + member_amt + '</td><td>' + transaction_amt + '</td></tr>');
            }
        },
        error: function(xhr, status, error) {
            console.log(xhr.responseText);
            alert("Error");
        }
    });
}


/** Adds a user (if exists) to the member_table_id.
 *
 * Queries the predefined server api and adds a new user to the table, if user exists.
 *
 * @param member_table_id
 * @return
 */
function AddUserOnClick(member_table_id) {
    var row_count = $('#' + member_table_id + ' tr').length;
    var email = $('#' + member_table_id + ' tr:last td:eq(0) input').val();
    $.ajax({
        type: "GET",
        url: server + "/users/user_exists?user_email=" + email,
        dataType:'json',
        xhrFields: {withCredentials: true},
        success: function(data, status, xhr) {
            /* Disable text from old row and remove 'Add' button. */
            $('#' + member_table_id + ' tr:last td:eq(1)').empty();
            $('#' + member_table_id + ' tr:last td:eq(0) input').prop('readonly', 'true');
            /* Prepare new row info */
            var input = '<input style="width: 99%" type="text" id="member' + (row_count - 1) + '"/>';
            var add_user = '<button style="width: 100%" onclick="AddUserOnClick(\'' +member_table_id + '\');">Add User</button>';
            /* Append new row to table. */
            Util_AppendRowToTable(member_table_id, '<td>' + input +'</td><td>' + add_user + '</td>');
        },
        error: function(xhr, status, error) {
            alert("User not found");
        }
    });
}


/** Creates a group, a group must contain at least 3 users, no duplications, and a group name.
 *
 * @param group_name_field_id
 * @param member_table_id
 * @param output_span_id
 * @constructor
 */
function CreateGroupOnClick(group_name_field_id, member_table_id, output_span_id) {
    var group_name = $('#' + group_name_field_id).val();
    var member_list = [];
    /* Iterate through all rows but first and last. */
    $('#' + member_table_id + ' tr:gt(0):lt(-1)').each(function () {
        var $tds = $(this).find('td'),
            name = $tds.eq(0).find('input').eq(0).val();
        member_list.push(name);
    });
    /* VALIDATION! for input correctness */
    /* Verify at least 3 users. */
    if (member_list.length < 2) {
        Util_SetSpanText("Group should contain at least 3 participants.", false, output_span_id);
        return;
    };
    /* See that there's no duplications in members name. */
    if (member_list.length != new Set(member_list).size) {
        Util_SetSpanText("Group should not contain duplicated members.", false, output_span_id);
        return;
    }
    /* Verify group name is present. */
    if (group_name.length == 0) {
        Util_SetSpanText("Group name is required.", false, output_span_id);
        return;
    }
    /* End of VALIDATION! */
    var json_object = { group_name: group_name, member_list: member_list};
    $.ajax({
        type: "POST",
        url: server + "/groups/create_group",
        dataType:'json',
        data: json_object,
        xhrFields: {withCredentials: true},
        success: function(data, status, xhr) {
            Util_SetSpanText("Group created successfully!", true, output_span_id);
        },
        error: function(xhr, status, error) {
            Util_SetSpanText("An error occured trying to create group.", false, output_span_id);

        }
    });
}

/** Gets group data when clicked, this function is also called when the page is loaded.
 *
 * Group info contains member list and transaction list.
 *
 * @param group_id_field
 * @param member_list_table
 * @param transaction_list_table
 * @param error_span_id
 */
function FetchGroupDataOnClick(group_id_field, member_list_table, transaction_list_table, error_span_id) {
    var group_id = $('#' + group_id_field).val();
    $.ajax({
        type: "GET",
        url: server + "/groups/get_group_info?group_id=" + group_id,
        dataType:'json',
        xhrFields: {withCredentials: true},
        /* On success, fill in transaction data and member list. */
        success: function(data, status, xhr) {
            data = data.data;
            /* Clear tables. */
            Util_ClearTable(member_list_table);
            Util_ClearTable(transaction_list_table);
            /* Write tables */
            var creator_name = data.creator;
            Util_AppendRowToTable(member_list_table, '<td>' + creator_name.email +'</td><td>' + "Creator" + '</td>');
            for (var i in data.member_list) {
                Util_AppendRowToTable(member_list_table, '<td>' + data.member_list[i].email +'</td><td>' + "Participant" + '</td>');
            }
            for (var i in data.transaction_list) {
                var transaction_id = data.transaction_list[i].transaction_id;
                Util_AppendRowToTable(transaction_list_table,'<td><a href="transaction.html?transaction_id='+transaction_id+'">' + transaction_id + '</a></td><td>' + data.transaction_list[i].transaction_name + '</td>');
            }
            Util_SetSpanText("Transaction and members fetched successfully.", true, error_span_id);
        },
        error: function(xhr, status, error) {
            Util_SetSpanText("Error while fetching member and transaction info.", false, error_span_id);
        }});
}

function FetchTransactionDataOnClick(input_transaction_id,transaction_info_error_id,group_name_span_id,
                                     transaction_name_span_id,transaction_threshold_span_id,share_status_list_table,
                                     threshold_reached_span_id,secret_output_textarea_id) {
    var transaction_id = $("#" + input_transaction_id).val();
    /** GET TRANSACTION META DETAILS **/
    $.ajax({
        type: "GET",
        url: server + "/transactions/get_transaction?transaction_id=" + transaction_id,
        dataType:'json',
        xhrFields: {withCredentials: true},
        // On success, fill in public keys in the table.
        success: function(data, status, xhr) {
            /* Set transaction text to true */
            Util_SetSpanText("Transaction data fetched successfully.", true, transaction_info_error_id);
            /* Getting the value out of the json */
            var group_name = data.transaction_data.group_data.group_name,
                transaction_name = data.transaction_data.transaction_name,
                threshold = data.transaction_data.threshold;
            /* Group name */
            $("#" + group_name_span_id).html("Group Name: " + group_name);
            /* Transaction Name */
            $("#" + transaction_name_span_id).html("Transaction Name: " + transaction_name);
            /* Threshold */
            $("#" + transaction_threshold_span_id).html("Threshold: " + threshold);
            GetTransactionShareStash(share_status_list_table, transaction_info_error_id, transaction_id, threshold, threshold_reached_span_id, secret_output_textarea_id);
        },
        error: function(xhr, status, error) {
            alert("Error fetching public keys group");
        }});


}

function GetTransactionShareStash(share_stash_table_id, transaction_info_error_id, transaction_id, transaction_threshold, threshold_reached_span_id, secret_output_textarea_id)
{
    /** GET TRANSACTION SHARE STASH FOR USER **/
    $.ajax({
        type: "GET",
        url: server + "/transactions/get_share_stash?transaction_id=" + transaction_id,
        dataType:'json',
        xhrFields: {withCredentials: true},
        // On success, fill in public keys in the table.
        success: function(data, status, xhr) {
            /* Clean table */
            var share_amt = 0;
            Util_ClearTable(share_stash_table_id);
            /* Set transaction text to true */
            Util_SetSpanText("Transaction share stash fetched successfully.", true, transaction_info_error_id);
            /* Getting the value out of the json */
            var stash = data.transaction_data;
            console.log(data);
            for (var i in stash) {
                share_amt += (stash[i].share.length == 0 ? 0 : 1);
                var share_owner_email = stash[i].email,
                    status = (stash[i].share.length == 0 ? 'Missing': 'Present'),
                    button_id = share_owner_email + "Button",
                    request = (stash[i].share.length == 0 ? '<button id="'+ button_id +'" onclick=\'RequestShareOnClick("' + transaction_id+ '", "' + stash[i].user_id + '", "' + button_id + '");\'>Request Share</button>' : '');
                var table_row = '<td>' + share_owner_email + '</td><td>' + status + '<td>' + request +' </td>';
                Util_AppendRowToTable(share_stash_table_id, table_row);
            }
            if (share_amt >= transaction_threshold) {
                RequestShareStashEnableButton(threshold_reached_span_id, transaction_id, secret_output_textarea_id);
            }

        },
        error: function(xhr, status, error) {
            alert("Error fetching public keys group");
        }});
}

function RequestShareStashEnableButton(threshold_reached_span_id, transaction_id, secret_output_textarea_id) {
    var func_call = 'RequestAndResolveShareStash("{0}", "{1}")'.format(transaction_id, secret_output_textarea_id);
    $("#" + threshold_reached_span_id).html("You have enough shares! <br><button onclick='" + func_call + "'>Decrypt Secret</button>");
}

/** RequestAndResolveShareStash
 * FLOW:
 * 1. Request the entire stash from the server for the transaction_id.
 * 2. For each share, decrypt it using private key.
 * 3. Take all the decrypted shares and combine them with SSS.
 * 4. Display output in the textarea element.
 *
 * @param transaction_id
 * @param secret_output_textarea_id
 * @constructor
 */
function RequestAndResolveShareStash(transaction_id, secret_output_textarea_id) {
    $("#" + secret_output_textarea_id).prop("hidden", false);
    $.ajax({
        type: "GET",
        url: server + "/transactions/get_all_shares?transaction_id=" + transaction_id,
        dataType:'json',
        xhrFields: {withCredentials: true},
        success: function(data, status, xhr) {
            var prvt_key = _mock_get_private_key();
            var decrypted_shares = [];
            var encrypted_shares = data.shares_list;
            /* Decrypt all shares */
            for (var i in encrypted_shares) {
                var share = encrypted_shares[i];
                if (share.length == 0) continue;
                share.data = _mock_rsa_decrypt(share.data, prvt_key);
                decrypted_shares.push(share);
            }
            var symmetric_key = betweenus.CombineShares(decrypted_shares);
            $("#" + secret_output_textarea_id).val("Symmetric Key: " + symmetric_key);
        },
        error: function(xhr, status, error) {

        }});

}

/** Gets the public keys for all users in the group, sets threshold to maximum of members.length.
 *
 * @param member_table_id
 * @param threshold_input_field
 * @return none
 */
function GetMembersPublicKeyOnClick(member_table_id, threshold_input_field) {
    var group_id = Util_QueryString.group_id;
    $.ajax({
        type: "GET",
        url: server + "/groups/get_members_public_keys/" + group_id,
        dataType:'json',
        xhrFields: {withCredentials: true},
        // On success, fill in public keys in the table.
        success: function(data, status, xhr) {
            var member_amt = 0;
            Util_ClearTable(member_table_id);
            for (var i in data.key_info) {
                Util_AppendRowToTable(member_table_id, '<td>' + data.key_info[i].email +'</td><td>' + data.key_info[i].public_key + '</td>');
                member_amt++;
            }
            $('#' + threshold_input_field).prop('max', member_amt);
        },
        error: function(xhr, status, error) {
            alert("Error fetching public keys group");
        }});
}

function RequestShareOnClick(transaction_id, user_id, request_share_button_id) {
    $.ajax({
        type: "GET",
        url: server + "/transactions/request_share?transaction_id=" + transaction_id + "&share_owner=" + user_id,
        dataType:'json',
        xhrFields: {withCredentials: true},
        // On success, fill in public keys in the table.
        success: function(data, status, xhr) {
            $("#" + request_share_button_id).attr("disabled", true);
            $("#" + request_share_button_id).html("Share Requested.");
        },
        error: function(xhr, status, error) {
            alert("Error occured while sending the request.");
        }});
}

function GetRequestsOnClick(transaction_field_id, request_table_id)
{
    var trans_id = $("#" + transaction_field_id).val();
    $.ajax({
        type: "GET",
        url: server + "/notifications/get_notifications_for_transaction?transaction_id=" + trans_id,
        dataType:'json',
        xhrFields: {withCredentials: true},
        // On success, fill in public keys in the table.
        success: function(data, status, xhr) {
            Util_ClearTable(request_table_id);
            var request_list = data.notifications;;
            for (var i in request_list) {
                if (request_list[i].status != 'pending')
                    continue;
                var requesting_user = request_list[i].sender.user_email,
                    request_type = request_list[i].type;
                /* Accept and Decline buttons creation. */
                var accept_button_id = requesting_user + "_accept_request",
                    accept_button = '<button id="{0}" onclick="AcceptRequestOnClick(\'{1}\',\'{2}\');">Accept</button>'.format(accept_button_id, trans_id,request_list[i].sender.user_id);
                var decline_button_id = requesting_user + "_decline_request",
                    decline_button = '<button id="{0}" onclick="DeclineRequestOnClick(\'{1}\',\'{2}\');">Decline</button>'.format(decline_button_id, trans_id,request_list[i].sender.user_id);
                var action_row = accept_button + decline_button;
                /* Prepare and append Row HTML */
                var table_row = '<td>' + requesting_user + '</td><td>' + request_type + '</td><td>' +
                    action_row + '</td>';
                Util_AppendRowToTable(request_table_id, table_row);
            }
        },
        error: function(xhr, status, error) {
            alert("Error fetching requests.");
        }});
}

/** This function handles the flow of getting the share and comitting it to the user.
 *  FLOW:
 *  1. Get own share from the server.
 *  2. Decrypt it with user private key.
 *  3. Request target_user public key from server.
 *  4. Encrypt own decrypted share with target_user public key.
 *  5. Commit share to server.
 *
 * @param transaction_id
 * @param target_user
 * @constructor
 */
function AcceptRequestOnClick(transaction_id, target_user) {
    $.ajax({
        type: "GET",
        url: server + "/transactions/get_my_share?transaction_id=" + transaction_id,
        dataType:'json',
        xhrFields: {withCredentials: true},
        success: function(data, status, xhr) {
            /* Decrypt share */
            var prv_key = _mock_get_private_key();
            var encrypted_share = data.share;
            /* Decrypt the .data component */
            var decrypted_share = encrypted_share; // Same data, different names for flow clarity.
            decrypted_share.data = _mock_rsa_decrypt(encrypted_share.data, prv_key);
            /* Once we have the decrypted share in our lap,
             make another call to the server to get the target_user public_key */
            $.ajax({
                type: "GET",
                url: server + "/users/get_public_key?user_id=" + target_user,
                dataType: 'json',
                xhrFields: {withCredentials: true},
                success: function (data, status, xhr) {
                    var target_user_pub_key = data.public_key;
                    _CommitShareToServer(decrypted_share, target_user_pub_key, target_user, transaction_id);
                },
                error: function (xhr, status, error) {
                    alert("Error occured while sending the request.");
                }
            });
        },
        error: function(xhr, status, error) {
            alert("Error occured while sending the request.");
        }});
}

function _CommitShareToServer(share, target_user_public_key, target_user_id, transaction_id) {
    var encrypted_share = _mock_rsa_public_encrypt(share, target_user_public_key);
    var data = {target_user_id: target_user_id, encrypted_share: JSON.stringify(encrypted_share), transaction_id: transaction_id};
    $.ajax({
        type: "POST",
        url: server + "/transactions/commit_share",
        dataType:'json',
        data: data,
        xhrFields: {withCredentials: true},
        success: function(data, status, xhr) {
        },
        error: function(xhr, status, error) {
        }});
}

function _mock_get_private_key()
{
    return 'private_key';
}

function _mock_rsa_public_encrypt(input, public_key) {
    return input;
}

function _mock_rsa_decrypt(input, private_key)
{
    return input;
}

/* On Page Load Functions */

/** Handles fetching the data on load for the user to see.
 *
 * @return None
 */
function GroupPageOnLoad(group_id_field, member_list_table, transaction_list_table, error_span_id) {
    if (window.location.search.length == 0) {
        Util_SetSpanText('Must supply group_id argument in the url or the input field.', false, error_span_id);
        return;
    }
    /* QueryString contains a dictionray of keys and values extract from the URL; <URL>?key=value,key1=value1 etc. */
    var group_id = Util_QueryString.group_id;
    /* Update value in group id field. */
    $('#' + group_id_field).val(group_id);
    FetchGroupDataOnClick(group_id_field, member_list_table, transaction_list_table, error_span_id);
}

function NewTransactionPageOnLoad(member_table_id, threshold_input_field) {
    GetMembersPublicKeyOnClick(member_table_id, threshold_input_field);
}

function TransactionPageOnLoad(transaction_input_field_id, error_field_id) {
    var transaction_id = Util_QueryString.transaction_id;
    $("#" + transaction_input_field_id).val(transaction_id);
}

http://localhost:63342/BetweenUs/src/client_side/transaction.html?transaction_id=1
    /* BetweenUs functions. */
    function GenerateSymmetricKeyOnClick() {
        var sym_key = betweenus.GenerateSymmetricKeyDictionary();
        $('#sym_key').val(sym_key);
    }

function EncryptSecretContentOnClick() {
    var text_to_encrypt = $('#secret_content').val();
    var sym_key = $("#sym_key").val();
    var cipher_text_buffer = betweenus.SymmetricEncrypt(text_to_encrypt, sym_key);
    var cipher_text_string = Util_uIntArray2Text(cipher_text_buffer);
    $('#secret_content').val(cipher_text_string);
}

function DecryptSecretContentOnClick() {
    var text_to_decrypt = $('#secret_content').val();
    var sym_key = $("#sym_key").val();
    var buffered_text_to_decrypt = Util_Text2uIntArray(text_to_decrypt);
    var plain_text = betweenus.SymmetricDecrypt(buffered_text_to_decrypt, sym_key);
    $('#secret_content').val(plain_text);
}



function CreateNewTransactionOnClick() {
    var group_id = Util_QueryString.group_id;
    window.location.href = "new_transaction.html?group_id=" + group_id;
}


function SubmitNewTransactionOnClick(share_table_id, sym_key_field_id, member_table_id, threshold_field_id, plain_text_field, transaction_name) {
    var sym_key = $('#' + sym_key_field_id).val();
    var members = $('#' + member_table_id + ' tr').length - 1;
    var threshold = parseInt($('#' + threshold_field_id).val());
    var shares = betweenus.MakeShares(sym_key, members, threshold, 0);
    for (var i in shares) {
        Util_AppendRowToTable(share_table_id, '<td>' + shares[i] +'</td>');
    }
    var user_key_info = [];
    $('#' + member_table_id + ' tr:gt(0)').each(function () {
        var $tds = $(this).find('td'),
            name = $tds.eq(0).text(),
            key = $tds.eq(1).text();
        user_key_info.push({user: name, public_key: key});
    });
    /** Generate data for the JSON **/
    /* Generate [{user_id: , share:}, {}, ..., {}] list. */
    var encrypted_share_info = EncryptSharesForUsers(shares, user_key_info);
    /* Transaction Name */
    var transaction_name = $('#' + transaction_name).val();
    /* Create cipher data */
    var text_to_encrypt = $('#' + plain_text_field).val();
    var cipher_text_buffer = betweenus.SymmetricEncrypt(text_to_encrypt, sym_key);
    var cipher_text_string = Util_uIntArray2Text(cipher_text_buffer);
    /* Group ID */
    var group_id = Util_QueryString.group_id;
    var json_data = {
        group_id: group_id,
        cipher_data: cipher_text_string,
        share_threshold: threshold,
        transaction_name: transaction_name,
        stash_list: encrypted_share_info
    };
    $.ajax({
        type: "POST",
        url: server + "/transactions/create_transaction",
        dataType:'json',
        data: {json_data : JSON.stringify(json_data) }, // Must stringify due to encryption including wierd chars
        xhrFields: {withCredentials: true},
        success: function(data, status, xhr) {
            alert("SUCCESS!");
        },
        error: function(xhr, status, error) {
            alert("ERROR!");
        }});

}

/** Takes a non encrypt stringified shares and user information (id and key), and creates a list of a dictionary
 *  to contain the encrypted share info.
 *
 * @param shares stringified shares
 * @param users_key_info a list of {user: , public_key: } dictionaries.
 * @return a list of {user_id: , share:}
 *
 *
 * /*** Flow for applying SSS on the Symmetric Key:
 * PREFACE:
 * - Symmetric Key is represented in a serialized string that contains passphrase and IV.
 * - Encrypted data string representation contains non standard characters that cannot be
 *   relayed in .ajax calls.
 * - Each share returned is a stringified JSON object with the following properties:
 *      * bit - int
 *      * id - int
 *      * data - string containing non-standard characters.
 * - The flow following describe the solution to the issues mentioned above.
 * FLOW:
 * 1. Use Shamir's Secret Sharing on the serialized symmetric key string.
 * 2. Unpack the share objects using JSON.parse().
 * 3. Apply the following actions on the .data field for each share:
 *      3.1. Take the public key of the designated user for this share.
 *      3.2. Encrypt the .data field using this RSA key.
 *      3.3. The output for the encryption function is a hex-string ex. 'ff0aba123'
 * 4. Use JSON.stringify() on all the modified shares.
 */
function EncryptSharesForUsers(shares, users_key_info) {
    if (shares.length != users_key_info.length) {
        console.log('Mismatch in size of shares to size of users.');
        return null;
    }
    var encrypted_shares_info = [];
    for (var i in shares) {
        var encrypted_share = MockRSAPublicKeyEncrypt(shares[i], users_key_info[i].public_key);
        var username = users_key_info[i].user;
        encrypted_shares_info.push({user_id: username, share: encrypted_share});
    }
    return encrypted_shares_info;
}

function MockRSAPublicKeyEncrypt(data, key) {
    return betweenus.AsymmetricEncrypt(data, key);
}

/* Javascript Utility Functions */

/** Clears all the table rows except the header.
 *
 * @param table_id
 * @return None
 */
function Util_ClearTable(table_id) {
    $('#' + table_id + ' tr:not(:first)').remove();
}

/** Appends a new row to a table with the row_html_txt as it's inner html.
 *
 * @param table_id
 * @param row_html_text The text to input inside the row tags - <tr></tr>
 * @return None
 */
function Util_AppendRowToTable(table_id, row_html_text) {
    $('#' + table_id + ' tr:last').after('<tr>' + row_html_text + '</tr>');
}

/**
 *
 * @param text string to display in the span.
 * @param success boolean value, if true - text is green, else, red.
 * @param span_id id of the span to use.
 * @return None
 */
function Util_SetSpanText(text, success, span_id) {
    var color = success? 'green' : 'red';
    $('#' + span_id).html(text);
    $('#' + span_id).css('color',  color);
}

/** Recieves a uInt8Array and converts it into a string.
 *
 * @param uintArray {uInt8Array}
 * @returns {string}
 */
function Util_uIntArray2Text(uintArray) {
    return String.fromCharCode.apply(null, new Uint16Array(uintArray));
}

/** Receives a string and converts it into a uInt8Array.
 *
 * @param s {string}
 * @returns {Uint8Array}
 */
function Util_Text2uIntArray(s) {
    var ua = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) {
        ua[i] = s.charCodeAt(i);
    }
    return ua;
}


/** Parses the URL query data from the form of '?key1=value1&key2=value2&...&keyN=valueN' to a dictionary
 *  dict.key1 = value1, dict.key2 = value2, ... , dict.keyN = valueN.
 *
 * @return Dictionary containing the query data.
 */
var Util_QueryString = function () {
    // This function is anonymous, is executed immediately and
    // the return value is assigned to Util_QueryString!
    var query_string = {};
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i=0;i<vars.length;i++) {
        var pair = vars[i].split("=");
        // If first entry with this name
        if (typeof query_string[pair[0]] === "undefined") {
            query_string[pair[0]] = decodeURIComponent(pair[1]);
            // If second entry with this name
        } else if (typeof query_string[pair[0]] === "string") {
            var arr = [ query_string[pair[0]],decodeURIComponent(pair[1]) ];
            query_string[pair[0]] = arr;
            // If third or later entry with this name
        } else {
            query_string[pair[0]].push(decodeURIComponent(pair[1]));
        }
    }
    return query_string;
}();

String.prototype.format = String.prototype.f = function() {
    var s = this,
        i = arguments.length;

    while (i--) {
        s = s.replace(new RegExp('\\{' + i + '\\}', 'gm'), arguments[i]);
    }
    return s;
};
