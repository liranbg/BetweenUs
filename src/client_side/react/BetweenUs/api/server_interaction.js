var GLOBAL = require('../env');

class BetweenUsServer {

    static Login(email, password) {
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
                .then((responseJSON)=>{resolve(responseJSON)})
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
                .then((response_json) => {
                    if (!response_json.success){
                        reject(response_json);
                    }
                    else {
                        resolve(response_json)
                    }

                })
                .catch((error) => {
                    console.warn("123")
                    reject(error); });
        });
    }
}
module.exports = BetweenUsServer;