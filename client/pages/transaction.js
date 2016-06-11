import React from 'react';
import {Alert, View, Text, StyleSheet,ScrollView, TouchableHighlight, ListView} from 'react-native'
var ServerAPI = require('../api/server_interaction');
var MemberSlider = require('../components/MembersSlider');
var Button = require('react-native-button');
var betweenUs = require('../api/betweenus');
var RSATools = require('../utils/rsa/index');
var promiseWhile = require("../utils/promise-while");


String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};


var Transaction = React.createClass({
    statics: {
        betweenus: function() {
            betweenUs.setRSA(RSATools.EncryptWithPublicKey, RSATools.DecryptWithPrivateKey);
            var text_to_encrypt = "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";
            var client_1 = {
                id: 'client1',
                rsa_key: null
            };
            var client_2 = {
                id: 'client2',
                rsa_key: null
            };
            var client_3 = {
                id: 'client3',
                rsa_key: null
            };
            var clients_to_share_with = [client_1, client_2, client_3];
            var symmetric_key;
            var encrypted_buffer;
            // RSATools.GenerateKeys(1024)
            //     .then((result) => {
            //         console.warn("Generating private and public keys...");
            //         private_key = result["private"];
            //         public_key = result["public"];
            //         console.warn("Generating is done");
            //         console.warn("Encrypting...");
            //         return betweenUs.AsymmetricEncrypt(text_to_rsa_encrypt, public_key);
            //     })
            //     .then((result) => {
            //         console.warn("Encrypting is done");
            //         encrypted_cipher = result;
            //         console.warn(JSON.stringify(encrypted_cipher));
            //         console.warn("Decrypting...");
            //         return betweenUs.AsymmetricDecrypt(encrypted_cipher, private_key);
            //     })
            //     .then((result) => {
            //         console.warn("Decrypting is done");
            //         console.warn(JSON.stringify(result));
            //     })
            //     .catch((err)=> {
            //         console.warn(JSON.stringify("err"));
            //         console.warn(JSON.stringify(err));
            //     });
            function setRSAToClients() {
                let i = 0;
                let len = clients_to_share_with.length;
                return new Promise(function(f_resolve, f_reject){
                    promiseWhile(
                        function() { return i < len; },
                        function() {
                            return new Promise(function(resolve, reject) {
                                RSATools.GenerateKeys(2048)
                                    .then((result)=> {
                                        clients_to_share_with[i].rsa_key = {
                                            public: result["public"],
                                            private: result["private"]
                                        };
                                        ++i;
                                        resolve();
                                    });
                            });
                        })
                        .then(()=>{
                            f_resolve();
                        });
                });
            }

            var assigned_shares = [];
            betweenUs.GenerateSymmetricKey()
                .then((result) => {
                    console.warn('Key: ' + JSON.stringify(result));
                    return result;
                })
                .then((result_symmetric_key) => {
                    symmetric_key = result_symmetric_key;
                })
                .then(() => setRSAToClients())
                .then(() => {
                    console.warn('Generating cipher text using previously generated symmetric key...');
                    return betweenUs.SymmetricEncrypt(text_to_encrypt, symmetric_key);
                })
                .then((result_encrypted_buffer) => {
                    encrypted_buffer = result_encrypted_buffer;
                    console.warn('Encryption done.');
                    console.warn('Cipher text: ' + encrypted_buffer);
                    console.warn('Using Shamir\'s Secret Sharing to split symmetric key into shares.');
                    return symmetric_key;
                })
                .then((symmetric_key) => betweenUs.MakeShares(symmetric_key, clients_to_share_with.length, 2, 0))
                .then((shares) => {
                    console.warn('Starting encryption with RSA');
                    let i = 0;
                    let len = shares.length;
                    return new Promise(function(f_resolve, f_reject){
                        promiseWhile(
                            function() { return i < len; },
                            function() {
                                return new Promise(function(resolve, reject) {
                                    console.warn('ID: ' + clients_to_share_with[i].id + ', Share: ' + shares[i]);
                                    betweenUs.AsymmetricEncrypt(shares[i], clients_to_share_with[i].rsa_key.public)
                                        .then((result)=> {
                                            assigned_shares.push({
                                                belong_to: clients_to_share_with[i].id,
                                                share: result
                                            });
                                            ++i;
                                            resolve();
                                        });
                                });
                            })
                            .then(()=>{
                                f_resolve(assigned_shares);
                            });
                    });
                })
                .then((encrypted_shares) => {
                    console.warn('Starting decryption client\'s shares');
                    let i = 0;
                    let len = encrypted_shares.length;
                    let decrypted = [];
                    return new Promise(function(f_resolve, f_reject){
                        promiseWhile(
                            function() { return i < len; },
                            function() {
                                return new Promise(function(resolve, reject) {
                                    betweenUs.AsymmetricDecrypt(encrypted_shares[i].share, clients_to_share_with[i].rsa_key.private)
                                        .then((result)=> {
                                            decrypted.push(result);
                                            ++i;
                                            resolve();
                                        });
                                });
                            })
                            .then(()=>{
                                f_resolve(decrypted);
                            });
                    });
                })
                .then((decrypted_shares) => {
                    var from_shares_symmetric_key_dictionary = betweenUs.CombineShares(decrypted_shares);
                    console.warn("Is key restored?", from_shares_symmetric_key_dictionary == symmetric_key);
                    var decrypted_buffer = betweenUs.SymmetricDecrypt(encrypted_buffer, from_shares_symmetric_key_dictionary);
                    console.warn(decrypted_buffer);
                })
                .catch((err)=> {console.warn(err)});
        },
    },
    getInitialState() {
        return( {
            transaction: {
                id: "",
                name: "",
                threshold: "",
                initiator: {
                    id: "",
                    email: ""
                },
                group: {
                    id:"",
                    name:""
                },
                members_list: [],
                my_stash_id: "",
                transaction_shares_data: [],
                can_decrypt: false
            },
            user_info: this.props.user_info,
        })
    },
    componentDidMount() {
        if (this.props.data !== undefined)
        {
            this.setState(this.props.data);
        }
    },
    request_share(from_user_id) {
        ServerAPI.requestShareFrom(this.state.transaction.id, from_user_id)
            .then((data) => {
                //TODO: change status for requester to pending

            })
            .catch((error)=> {
                Alert.alert('ERROR', error.error, [{text: 'OK' ,  style: 'ok'}]);
            })
    },
    approve_share(target_user_id) {
        betweenUs.setRSA(RSATools.EncryptWithPublicKey, RSATools.DecryptWithPrivateKey);
        var my_own_share;
        var target_user_pk;
        Promise.all([
            ServerAPI.get_my_share(this.state.transaction.id),
            ServerAPI.get_public_key_for_user(target_user_id)
        ])
            .then((all)=> {
                console.warn(JSON.stringify(all[1]));
                my_own_share = all[0];
                target_user_pk = all[1].public_key;
                return betweenUs.AsymmetricDecrypt(my_own_share, this.props.user_info.private_key.replaceAll("\n",""))
            })
            .then((my_own_decrypted) => {
                return betweenUs.AsymmetricEncrypt(my_own_decrypted, target_user_pk.replaceAll("\n",""));
            })
            .then((data) => ServerAPI.commit_share(target_user_id, data, this.state.transaction.id))
            .catch((error) => {
                console.warn("error");
                console.warn(error);
            });

    },
    fetchTransactionData() {
        Promise.all([
            ServerAPI.fetchTransactionData(this.state.transaction.id),
            ServerAPI.fetchTransactionSharesData(this.state.transaction.id),
            ServerAPI.fetchTransactionsNotifications(this.state.transaction.id)
        ])
            .then((all)=> {
                var data = all[0].transaction;
                var i;
                var member_list = [];
                var count_for_threshold = 0;
                for (i = 0; i < all[1].transaction_data.length; ++i) {
                    if (all[1].transaction_data[i].share) {
                        count_for_threshold++;
                    }
                    member_list.push(all[1].transaction_data[i]);
                }
                for (i = 0; i < all[2].length; ++i) {
                    if (all[2][i].status == "pending") {
                        for (var j = 0; j < member_list.length; ++j) {
                            if (member_list[j].user_id == all[2][i].sender.user_id)
                            {
                                member_list[j].pending_request = all[2][i];
                                break;
                            }
                        }
                    }
                }
                this.setState({
                    transaction: {
                        id: data.id,
                        name: data.transaction_name,
                        threshold: data.threshold,
                        initiator: {
                            id: data.initiator.initiator_id,
                            email: data.initiator.initiator_email
                        },
                        group: {
                            id:data.group_id,
                            name:data.my_stash
                        },
                        data: {
                            type:data.cipher_meta_data.type,
                            content:data.cipher_meta_data.data
                        },
                        members_list: data.members_list,
                        my_stash_id: "",
                        can_decrypt: count_for_threshold >= data.threshold,
                        transaction_shares_data: member_list
                    }

                });
            }).catch((error) => {
            console.warn(error);
        });
    },
    showFile(){
        betweenUs.setRSA(RSATools.EncryptWithPublicKey, RSATools.DecryptWithPrivateKey);
        var shares_to_decrypt = [];
        var index = 0;
        var transaction = this.state.transaction;
        var private_key = this.props.user_info.private_key;
        if (private_key === null) {
            Alert.alert(
                'Show File',
                "Please load your private key before opening the file",
                [
                    {text: 'OK' ,  style: 'ok'}
                ]
            );
            return;
        }
        function decryptshares() {
            return new Promise((f_resolve, f_reject) =>{
                promiseWhile(
                    function() { return ((shares_to_decrypt.length < transaction.threshold) && (index < transaction.transaction_shares_data.length)); },
                    function() {
                        if (transaction.transaction_shares_data[index].share) {
                            return new Promise((resolve, reject) => {
                                betweenUs.AsymmetricDecrypt(transaction.transaction_shares_data[index].share, private_key.replaceAll("\n",""))
                                    .then((result)=> {
                                        shares_to_decrypt.push(result);
                                        ++index;
                                        resolve();
                                    });
                            });
                        }
                        else {
                            return new Promise((resolve, reject) => {
                                ++index;
                                resolve();
                            });
                        }
                    })
                    .then(()=>{
                        f_resolve(shares_to_decrypt);
                    });
            });
        }
        decryptshares().then((shares_to_decrypt)=> {
            if (shares_to_decrypt.length >= transaction.threshold) {
                var from_shares_symmetric_key_dictionary = betweenUs.CombineShares(shares_to_decrypt);
                try{
                    var decrypted_buffer = betweenUs.SymmetricDecrypt(transaction.data.content, from_shares_symmetric_key_dictionary);
                    Alert.alert(
                        'Response',
                        decrypted_buffer,
                        [
                            // {text: 'Ask me later', onPress: () => console.warn('Ask me later pressed')},
                            // {text: 'Cancel', onPress: () => console.warn('Cancel Pressed'), style: 'cancel'},
                            {text: 'OK' ,  style: 'ok'}
                        ]
                    );
                    // );
                } catch(e) {
                    Alert.alert(
                        'Error reading response',
                        "Response has been malformed",
                        [
                            // {text: 'Ask me later', onPress: () => console.warn('Ask me later pressed')},
                            // {text: 'Cancel', onPress: () => console.warn('Cancel Pressed'), style: 'cancel'},
                            {text: 'OK' ,  style: 'ok'}
                        ]
                    );
                }

            }
        });
    },
    render(){
        return (
            <View style={styles.container}>
                <Text style={styles.header}>{this.state.transaction.name}</Text>
                <Text style={styles.sub_header}>Threshold: {this.state.transaction.threshold}</Text>
                {(
                    () => {
                        if (this.state.transaction.can_decrypt) {

                            return <Button onPress={this.showFile}><Text style={styles.sub_header}>Open File</Text></Button>
                        }
                    }
                )()}
                <MemberSlider data={{
                    members_list:this.state.transaction.transaction_shares_data,
                    request_share: this.request_share,
                    approve_share: this.approve_share
                 }}/>

                <View style={{marginBottom:20}}/>
                <Button onPress={this.fetchTransactionData}>Get Data</Button>
            </View>
        );
    }
});
var styles = StyleSheet.create({
    header: {textAlign:'center', fontWeight:'bold', margin: 5, fontSize: 20},
    sub_header: {textAlign:'center', fontWeight:'bold', margin: 0, fontSize: 18},
    member_row:{flexDirection: 'row', height:40},
    container: {
        flex: 1
    }
});
// Transaction.betweenus();
module.exports = Transaction;