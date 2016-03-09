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
}
module.exports = BetweenUsServer;