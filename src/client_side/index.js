var server = "http://localhost:3000";
function RegisterFormOnClick () {
    var email = document.getElementById("form_register_email").value;
    var password =  document.getElementById("form_register_password").value;
    var public_key = document.getElementById("form_register_public_key").value;
    var json_data = {email: email, password: password, public_key: public_key };
    $.ajax({
        type: "POST",
        url: server + "/users/register_user",
        data: json_data,
        dataType:'json',
        success: function(data, status, xhr) {
            document.getElementById("textfield_register_user").value = xhr.responseText;
        },
        error: function(xhr, status, error) {
            document.getElementById("textfield_register_user").value = JSON.parse(xhr.responseText).error;
        }
    });
}

function LoginFormOnClick () {
    var email = document.getElementById("form_login_email").value;
    var password =  document.getElementById("form_login_password").value;
    var json_data = {email: email, password: password };
    $.ajax({
        type: "POST",
        url: server + "/users/login",
        data: json_data,
        dataType:'json',
        xhrFields: {withCredentials: true},
        success: function(data, status, xhr) {
            document.getElementById("textfield_login_user").value = xhr.responseText;
            window.location.href = "groups.html";
        },

        error: function(xhr, status, error) {
            document.getElementById("textfield_login_user").value = JSON.parse(xhr.responseText).error;
        }
    });
}

function GetGroupsOnClick() {
    var tableRef = document.getElementById('table_groups').getElementsByTagName('tbody')[0];
    $.ajax({
        type: "GET",
        url: server + "/groups/get_groups",
        dataType:'json',
        xhrFields: {withCredentials: true},
        success: function(data, status, xhr) {
            // Remove all lines beside the header
            $("#table_groups tr:not(:first)").remove();
            for (var i in data.groups) {
                var transaction_amt = data.groups[i].value.transactions_length;
                var member_amt, group_name, group_id;
                member_amt = data.groups[i].value.members_length; // Members
                group_name = data.groups[i].value.name;
                group_id = '<a href ="group.html?group_id=' +  data.groups[i].value.group_id + '">' + data.groups[i].value.group_id + '</a>';

                // Append row to the table.
                $('#table_groups tr:last').after('<tr><td>' + group_id +'</td><td>' + group_name + '</td><td>' + member_amt + '</td><td>' + transaction_amt + '</td></tr>');

            }
        },
        error: function(xhr, status, error) {
            console.log(xhr.responseTest);
            alert("Error");
        }
    });
    //
}

function AddUserOnClick(row) {
    var table = document.getElementById('table_add_members');
    var row_count = document.getElementById('table_add_members').rows.length;
    var old_row = document.getElementById('table_add_members').rows[row+1];
    email = document.getElementById('table_add_members').rows[row+1].cells[0].firstChild.value;
    $.ajax({
        type: "GET",
        url: server + "/users/user_exists?user_email=" + email,
        dataType:'json',
        xhrFields: {withCredentials: true},
        success: function(data, status, xhr) {
            old_row.cells[1].innerHTML = ""; // Remove old add button
            old_row.cells[0].firstChild.readOnly = true;
            var input = '<input style="width: 99%" type="text" id="member' + (row_count - 1) + '"/>';
            var add_user = '<button style="width: 100%" onclick="AddUserOnClick('+(row_count - 1)+ ')">Add User</button>';
            $('#table_add_members tr:last').after('<tr><td>' + input +'</td><td>' + add_user + '</td>');
        },
        error: function(xhr, status, error) {
            alert("User not found");
        }
    });
}

function CreateGroupOnClick() {
    var table = document.getElementById('table_add_members');
    var group_name = document.getElementById("create_group_name").value;
    var member_list = [];

    for(var i=0; i<table.rows.length;i++) {
        if (i == 0 || i == (table.rows.length-1)) {
            continue;
        }
       member_list.push(table.rows[i].cells[0].firstChild.value);
    }
    var json_object = { group_name: group_name, member_list: member_list};
    $.ajax({
        type: "POST",
        url: server + "/groups/create_group",
        dataType:'json',
        data: json_object,
        xhrFields: {withCredentials: true},
        success: function(data, status, xhr) {
            alert("Group created successfully");
        },
        error: function(xhr, status, error) {
            alert("Error creating group");
        }
    });
}

function FetchGroupDataOnClick() {
    group_id = document.getElementById("input_group_id").value;
    $.ajax({
        type: "GET",
        url: server + "/groups/get_group_info?group_id=" + group_id,
        dataType:'json',
        xhrFields: {withCredentials: true},
        // On success, fill in transaction data.
        success: function(data, status, xhr) {
            // Fill in Member List table.
            data = data.data;
            $("#member_list_table tr:not(:first)").remove(); // Remove all lines beside the header
            var creator_name = data.creator;
            $('#member_list_table tr:last').after('<tr><td>' + creator_name.email +'</td><td>' + "Creator" + '</td>');

            for (var i in data.members) {
                $('#member_list_table tr:last').after('<tr><td>' + data.members[i].email +'</td><td>' + "Participant" + '</td>');
            }
            // Fill in Transaction List table.
            $("#transaction_list_table tr:not(:first)").remove(); // Remove all lines beside the header
            for (var i in data.transactions) {
                $('#transaction_list_table tr:last').after('<tr><td>' + data.transactions[i].trans_id +'</td><td>' + data.transactions[i].trans_name + '</td>');
            }
        },
        error: function(xhr, status, error) {
    alert("Error fetching transactions group");
    }});
}

// Parse arguments from URL
var QueryString = function () {
    // This function is anonymous, is executed immediately and
    // the return value is assigned to QueryString!
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

function GroupPageOnLoad() {
    // Make sure we have received arguments.
    if (window.location.search.length == 0) {
        alert("Must supply argument for group id");
        return;
    }
    // QueryString contains a dictionray of keys and values extract from the URL; <URL>?key=value,key1=value1 etc.
    group_id = QueryString.group_id;
    // Update value in group id field.
    document.getElementById("input_group_id").value = group_id;
    // Run Fetch function, gets the group id from the 'input_group_id'
    FetchGroupDataOnClick();
}

function TransactionPageOnLoad() {
    //alert(QueryString.group_id);
}

function GetMembersPublicKey() {
    var group_id = QueryString.group_id;
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
    var group_id = QueryString.group_id;
    window.location.href = "new_transaction.html?group_id=" + group_id;
}