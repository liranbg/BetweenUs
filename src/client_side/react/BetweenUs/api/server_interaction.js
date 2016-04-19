var GLOBAL = require('../env');

class BetweenUsServer {

    static login(email, password) {
        return new Promise(function(resolve, reject)
        {
            fetch(GLOBAL.DB_SERVER + "/users/login",
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(
                        {
                            email: email,
                            password: password
                        })
                })
                .then((response) => response.json())
                .then((responseJSON)=>{resolve(responseJSON)})
                .catch((err)=>{reject(err)});
        });
    }
    static register(email, password, public_key) {
        return new Promise(function(resolve, reject)
        {
            fetch(GLOBAL.DB_SERVER + "/users/register_user",
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: email,
                        password: password,
                        public_key: public_key
                    })
                })
                .then((response) => {if (response.status != 201) reject(response); else response.json() })
                .then((responseJSON)=>{resolve(responseJSON)})
                .catch((err)=>{reject(err)});
        });
    }
    static GetGroups() {
        return new Promise(function(resolve, reject)
        {
            fetch(GLOBAL.DB_SERVER + "/groups/get_groups",
                {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json'
                    }
                })
                .then((response) => response.json())
                .then((responseJSON)=>{resolve(responseJSON)})
                .catch((err)=>{reject(err)});

        });

    }
    static FetchGroupData(group_id) {
        return new Promise(function(resolve, reject)
        {
            fetch(GLOBAL.DB_SERVER + "/groups/get_group_info?group_id=" + group_id,
                {
                    method: 'GET',
                    headers:
                    {
                        'Accept': 'application/json'
                    }
                })
                .then((response) => response.json())
                .then((responseJSON)=>{
                    var creator = responseJSON.data.creator;
                    creator.is_creator = true;
                    responseJSON.data.member_list.unshift(creator);
                    responseJSON.data.group_id=responseJSON.data.id;
                    delete responseJSON.data.id;
                    resolve(responseJSON.data)})
                .catch((err)=>{reject(err)});

        });
    }
    static fetchTransactionData(transaction_id) {
        return new Promise(function(resolve, reject)
        {
            fetch(GLOBAL.DB_SERVER + "/transactions/get_transaction?transaction_id=" + transaction_id,
                {
                    method: 'GET',
                    headers:
                    {
                        'Accept': 'application/json'
                    }
                })
                .then((response) => resolve(response.json()))
                .catch((error) => {reject(error); });
        });
    }
    static fetchTransactionSharesData(transaction_id) {
        return new Promise(function(resolve, reject)
        {
            fetch(GLOBAL.DB_SERVER + "/transactions/get_share_stash?transaction_id=" + transaction_id,
                {
                    method: 'GET',
                    headers:
                    {
                        'Accept': 'application/json'
                    }
                })
                .then((response) => resolve(response.json()))
                .catch((error) => {reject(error); });
        });
    }
    static fetchTransactionsNotifications(transaction_id) {
        return new Promise(function(resolve, reject)
        {
            fetch(GLOBAL.DB_SERVER + "/notifications/get_notifications_for_transaction?transaction_id=" + transaction_id,
                {
                    method: 'GET',
                    headers:
                    {
                        'Accept': 'application/json'
                    }
                })
                .then((response) => response.json())
                .then((response_json) => {response_json.success?resolve(response_json.notifications):reject(response_json);})
                .catch((error) => {reject(error); });
        });
    }
    static requestShareFrom(transaction_id, from_user_id) {
        return new Promise(function(resolve, reject)
        {
            fetch(GLOBAL.DB_SERVER + "/transactions/request_share?transaction_id=" + transaction_id + "&share_owner=" + from_user_id,
                {
                    method: 'GET',
                    headers:
                    {
                        'Accept': 'application/json'
                    }
                })
                .then((response) => response.json())
                .then((response_json) => {response_json.success?resolve(response_json):reject(response_json);})
                .catch((error) => {reject(error); });
        });
    }
    static get_my_share(transaction_id) {
        return new Promise(function(resolve, reject)
        {
            fetch(GLOBAL.DB_SERVER + "/transactions/get_my_share?transaction_id=" + transaction_id,
                {
                    method: 'GET',
                    headers:
                    {
                        'Accept': 'application/json'
                    }
                })
                .then((response) => response.json())
                .then((response_json) => {response_json.success?resolve(response_json.share):reject(response_json);})
                .catch((error) => {reject(error); });
        });

    }
    static get_public_key_for_user(user_id) {
        return new Promise(function(resolve, reject)
        {
            fetch(GLOBAL.DB_SERVER + "/users/get_public_key?user_id=" + user_id,
                {
                    method: 'GET',
                    headers:
                    {
                        'Accept': 'application/json'
                    }
                })
                .then((response) => response.json())
                .then((response_json) => {response_json.success?resolve(response_json.public_key):reject(response_json);})
                .catch((error) => {reject(error); });
        });

    }
    static commit_share(target_user_id, encrypted_share, transaction_id) {
        var data = JSON.stringify({
            transaction_id: transaction_id,
            target_user_id: target_user_id,
            encrypted_share: encrypted_share
        });
        console.warn(target_user_id);
        console.warn(encrypted_share);
        console.warn(transaction_id);
        return new Promise(function(resolve, reject)
        {
            fetch(GLOBAL.DB_SERVER + "/transactions/commit_share",
                {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: data
                })
                .then((response) => response.json())
                .then((response_json) => {if (!response_json.success) reject(response_json); else resolve(response_json)})
                .catch((error) => {reject(error); });
        });
    }
    static checkUserExists(email) {
        return new Promise(function(resolve, reject)
        {
            fetch(GLOBAL.DB_SERVER + "/users/user_exists?user_email=" + email,
                {
                    method: 'GET',
                    headers:
                    {
                        'Accept': 'application/json'
                    }
                })
                .then((response) => response.json())
                .then((response_json) => {response_json.success?resolve(response_json):reject(response_json);})
                .catch((error) => {reject(error); });
        });
    }
    static createGroup(group_name, list_of_members) {
        var data = JSON.stringify({
            group_name: group_name,
            member_list: list_of_members
        });
        return new Promise(function(resolve, reject)
        {
            fetch(GLOBAL.DB_SERVER + "/groups/create_group",
                {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: data
                })
                .then((response) => response.json())
                .then((response_json) => {if (!response_json.success) reject(response_json); else return response_json})
                .then((response_json) => {
                    var new_group = {};
                    new_group.member_list = response_json.message.member_list;
                    new_group.group_name = response_json.message.group_name;
                    new_group.group_id = response_json.message._id;
                    new_group.transaction_list = response_json.message.transaction_list;
                    resolve(new_group);

                })
                .catch((error) => {reject(error); });
        });
    }
    static getMembersPublicKeys(group_id) {
        return new Promise(function(resolve, reject)
        {
            fetch(GLOBAL.DB_SERVER + "/groups/get_members_public_keys/" + group_id,
                {
                    method: 'GET',
                    headers:
                    {
                        'Accept': 'application/json'
                    }
                })
                .then((response) => response.json())
                .then((response_json) => {response_json.success?resolve(response_json):reject(response_json);})
                .catch((error) => {reject(error); });
        });

    }
    static createTransaction(group_id,cipher_Data,threshold,transaction_name,stash_list) {
        var data = JSON.stringify({
            group_id: group_id,
            cipher_data: cipher_Data,
            share_threshold: parseInt(threshold),
            transaction_name: transaction_name,
            stash_list: stash_list
        });
        console.warn(JSON.stringify(data));
        // return new Promise(function(resolve, reject)
        //     {
        //
        //         fetch(GLOBAL.DB_SERVER + "/transactions/create_transaction",
        //             {
        //                 method: 'POST',
        //                 headers: {
        //                     'Accept': 'application/json',
        //                     'Content-Type': 'application/json'
        //                 },
        //                 body: data
        //             })
        //             .then((response) => response.json())
        //             .then((response_json) => {response_json.success?resolve(response_json):reject(response_json);})
        //             .catch((error) => {reject(error); });
        //     }
        // );

    }
}
module.exports = BetweenUsServer;