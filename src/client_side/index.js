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
        xhrFields: {withCredentials: true},
        success: function(data, status, xhr) {
            console.log(xhr.responseText);
            json_dict = JSON.parse(xhr.responseText);
            for (var i in json_dict.data) {
                var transaction_amt = json_dict.data[i].value.transactions_length;
                var member_amt, group_name, group_id;
                member_amt = json_dict.data[i].value.members.length; // Members 
                group_name = json_dict.data[i].value.name;
                group_id = json_dict.data[i].value._id;
                console.log(json_dict.data[i].value);
                $('#table_groups tr:last').after('<tr><td>' + group_id +'</td><td>' + group_name + '</td><td>' + member_amt + '</td><td>' + transaction_amt + '</td></tr>');
            }
            //{"success":true,"data":[{"id":"d4b33cbab42543cf915cb14a1ac80f99","key":"513fd51e2e3c9f4f9a58c8881ff9af9f","value":{"_id":"d4b33cbab42543cf915cb14a1ac80f99","_rev":"1-6c5da4061e4fc607723ebf50b6473927","creator":"115ff250812c6ccbb3887a2dd591d503","members":["513fd51e2e3c9f4f9a58c8881ff9af9f","c143fba02b0dfd7752497296e5ac1780"],"name":"the chevre2","transactions":[]}},{"id":"eaa841a81a4f9f23ebb0d5baff7f7525","key":"513fd51e2e3c9f4f9a58c8881ff9af9f","value":{"_id":"eaa841a81a4f9f23ebb0d5baff7f7525","_rev":"2-f8b671893aee28e7d012a6d878aaa391","creator":"115ff250812c6ccbb3887a2dd591d503","members":["513fd51e2e3c9f4f9a58c8881ff9af9f","c143fba02b0dfd7752497296e5ac1780"],"name":"the chevre","transactions":[]}},{"id":"fd7a202b4e23241f4a8a944785144484","key":"513fd51e2e3c9f4f9a58c8881ff9af9f","value":{"_id":"fd7a202b4e23241f4a8a944785144484","_rev":"1-6c5da4061e4fc607723ebf50b6473927","creator":"115ff250812c6ccbb3887a2dd591d503","members":["513fd51e2e3c9f4f9a58c8881ff9af9f","c143fba02b0dfd7752497296e5ac1780"],"name":"the chevre2","transactions":[]}}]
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
    old_row = document.getElementById('table_add_members').rows[row+1];
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