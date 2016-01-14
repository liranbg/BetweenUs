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
            window.location.href = "group.html";
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
                group_id = data.groups[i].value.group_id;
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
            $('#member_list_table tr:last').after('<tr><td>' + creator_name +'</td><td>' + "Creator" + '</td>');

            for (var i in data.members) {
                $('#member_list_table tr:last').after('<tr><td>' + data.members[i] +'</td><td>' + "Participant" + '</td>');
            }
            // Fill in Transaction List table.
            $("#transaction_list_table tr:not(:first)").remove(); // Remove all lines beside the header
            for (var i in data.transactions) {
                $('#transaction_list_table tr:last').after('<tr><td>' + data.transactions[i].trans_id +'</td><td>' + data.transactions[i].trans_name + '</td>');
            }
        },
        error: function(xhr, status, error) {
            alert("Error fetching transactions group");
        }
    });
}