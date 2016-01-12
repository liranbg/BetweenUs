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
        success: function(data, status, xhr) {
            console.log(xhr.responseText);
        },
        error: function(xhr, status, error) {
            console.log(xhr.responseTest);
            alert("Error");
        }
    });
    $('#table_groups tr:last').after('<tr><td>' + bla +'</td><td>' + bla + '</td><td>' + bla + '</td><td>' + bla + '</td></tr>');
}

function AddUserOnClick(row) {
    var table = document.getElementById('table_add_members');
    var row_count = document.getElementById('table_add_members').rows.length;
    old_row = document.getElementById('table_add_members').rows[row+1];
    email = document.getElementById('table_add_members').rows[row+1].cells[0].firstChild.value;
    console.log( server + "/users/user_exists?user_email=" + email);
    $.ajax({
        type: "GET",
        url: server + "/users/user_exists?user_email=" + email,
        dataType:'json',
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