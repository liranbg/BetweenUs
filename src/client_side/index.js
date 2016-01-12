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
    //$.ajax({
    //    type: "GET",
    //    url: server + "/groups/get_groups",
    //    dataType:'json',
    //    success: function(data, status, xhr) {
    //        xhr.responseText;
    //    },
    //    error: function(xhr, status, error) {
    //        alert("Error");
    //    }
    //});
    $('#table_groups tr:last').after('<tr><td>' + bla +'</td><td>' + bla + '</td><td>' + bla + '</td><td>' + bla + '</td></tr>');
}

function AddUserOnClick(row) {
    var row_count = document.getElementById('table_add_members').rows.length;
    alert(row)
    //$.ajax({
    //    type: "GET",
    //    url: server + "/groups/get_groups",
    //    dataType:'json',
    //    success: function(data, status, xhr) {
    //        xhr.responseText;
    //    },
    //    error: function(xhr, status, error) {
    //        alert("Error");
    //    }
    //});
    var input = '<input style="width: 99%" type="text" id="member' + (row_count - 1) + '"/>';
    var add_user = '<button style="width: 100%" onclick="AddUserOnClick('+(row_count - 1)+ ')">Add User</button>';
    $('#table_add_members tr:last').after('<tr><td>' + input +'</td><td>' + add_user + '</td>');
}