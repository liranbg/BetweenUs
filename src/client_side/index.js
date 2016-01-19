

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
                    $('#' + output_field_id).val(JSON.parse(xhr.responseText).error);
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
                    group_name = data.groups[i].value.name;
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
            for (var i in data.members) {
                Util_AppendRowToTable(member_list_table, '<td>' + data.members[i].email +'</td><td>' + "Participant" + '</td>');
            }
            for (var i in data.transactions) {
                Util_AppendRowToTable(member_list_table,'<td>' + data.transactions[i].trans_id +'</td><td>' + data.transactions[i].trans_name + '</td>');
            }
            Util_SetSpanText("Transaction and members fetched successfully.", true, error_span_id);
        },
        error: function(xhr, status, error) {
            Util_SetSpanText("Error while fetching member and transaction info.", false, error_span_id);
    }});
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
    console.log('Plain Text: ', text_to_encrypt);
    console.log('Key:', sym_key);
    console.log(cipher_text_string)
    $('#secret_content').val(cipher_text_string);
}


function DecryptSecretContentOnClick() {
    var text_to_decrypt = $('#secret_content').val();
    var sym_key = $("#sym_key").val();
    var buffered_text_to_decrypt = Util_Text2uIntArray(text_to_decrypt);
    var plain_text = betweenus.SymmetricDecrypt(buffered_text_to_decrypt, sym_key);
    $('#secret_content').val(plain_text);
}

function GetMembersPublicKey() {
    var group_id = Util_QueryString.group_id;
    $.ajax({
        type: "GET",
        url: server + "/groups/get_members_public_keys/" + group_id,
        dataType:'json',
        xhrFields: {withCredentials: true},
        // On success, fill in public keys in the table.
        success: function(data, status, xhr) {
            // Fill in Member List table.
            $("#member_key_table tr:not(:first)").remove(); // Remove all lines beside the header
            for (var i in data.key_info) {
                $('#member_key_table tr:last').after('<tr><td>' + data.key_info[i].email +'</td><td>' + data.key_info[i].public_key + '</td>');
            }
        },
        error: function(xhr, status, error) {
            alert("Error fetching public keys group");
        }});
}

function CreateNewTransactionOnClick() {
    var group_id = Util_QueryString.group_id;
    window.location.href = "new_transaction.html?group_id=" + group_id;
}

function KeyToSharesOnClick() {
    var sym_key = $('#sym_key').val();
    var members = $('#member_key_table tr').length;
    console.log(sym_key);
    var shares = betweenus.SerializedDictionaryToShares(sym_key, members, members - 1, 0, 100);
    console.log(shares);
    var placeholder = "lala";
    for (var i in shares) {
        $('#shamir_secret_table tr:last').after('<tr><td>' + shares[i] +'</td><td>'+ placeholder + '</td>');
    }
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

