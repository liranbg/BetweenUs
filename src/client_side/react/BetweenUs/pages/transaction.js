import React, {Alert, View, Text, StyleSheet,ScrollView, TouchableHighlight, ListView} from 'react-native'
var ServerAPI = require('../api/server_interaction');
var MemberSlider = require('../components/MembersSlider');
var Button = require('react-native-button');
var betweenUs = require('../api/betweenus');

var Transaction = React.createClass({
    statics: {
        betweenus: function() {
            var text_to_encrypt = "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";
            var client_1 = {
                id: 'client1',
                assymetric_key: {
                    rsa_key: null
                },
                owned_share: null,
                share_hold: []
            };
            var client_2 = {
                id: 'client2',
                assymetric_key: {
                    rsa_key: null
                },
                owned_share: null,
                share_hold: []
            };
            var client_3 = {
                id: 'client3',
                assymetric_key: {
                    rsa_key: null
                },
                owned_share: null,
                share_hold: []
            };
            var clients_to_share_with = [client_1, client_2, client_3];
            var symmetric_key;
            var encrypted_buffer;
            console.warn("-------------------");
            console.warn('Starting BetweenUs flow on text:');
            console.warn('"' + text_to_encrypt + '"');
            console.warn('Generating Symmetric Key...');
            betweenUs.GenerateSymmetricKey()
                .then((result) => {
                    console.warn('Done.');
                    console.warn('Key: ' + JSON.stringify(result));
                    return result;
                })
                .then((result_symmetric_key) => {
                    symmetric_key = result_symmetric_key;
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
                    console.warn('Done.');
                    console.warn('Starting encryption with RSA');
                    var assigned_shares = [];
                    for (var i in shares) {
                        console.warn('ID: ' + clients_to_share_with[i].id + ', Share: ' + shares[i]);
                        assigned_shares.push({
                            belong_to: clients_to_share_with[i].id,
                            share: betweenUs.AsymmetricEncrypt(shares[i], clients_to_share_with[i].assymetric_key.rsa_key)
                        });
                    }
                    console.warn('Starting decryption client\'s shares');
                    for (var i in clients_to_share_with) {
                        for (var j in assigned_shares) {
                            if (assigned_shares[j].belong_to == clients_to_share_with[i].id) {
                                console.warn('ID: ' + clients_to_share_with[i].id + ', Encrypted Share: ' + JSON.stringify(assigned_shares[j].share));
                                clients_to_share_with[i].owned_share = betweenUs.AsymmetricDecrypt(assigned_shares[j].share, clients_to_share_with[i].assymetric_key.rsa_key);
                            }
                        }
                    }
                    for (var i in clients_to_share_with) {
                        if (shares.indexOf(clients_to_share_with[i].owned_share) == -1) {
                            console.warn(clients_to_share_with[i].id);
                        }
                    }
                    var shares_to_decrypt = [clients_to_share_with[0].owned_share, clients_to_share_with[1].owned_share];
                    var from_shares_symmetric_key_dictionary = betweenUs.CombineShares(shares_to_decrypt);
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
        var my_own_share;
        var my_own_decrypted;
        var target_user_pk;
        var encrypted_share_for_target_user;
        Promise.all([
                ServerAPI.get_my_share(this.state.transaction.id),
                ServerAPI.get_public_key_for_user(target_user_id)
            ])
            .then((all)=> {
                my_own_share = all[0];
                my_own_decrypted = betweenUs.AsymmetricDecrypt(my_own_share, "");
                target_user_pk = all[1].public_key.public_key;
                encrypted_share_for_target_user = betweenUs.AsymmetricEncrypt(my_own_decrypted, target_user_pk);
                return encrypted_share_for_target_user;
            })
            .then((data) => ServerAPI.commit_share(target_user_id, data, this.state.transaction.id))
            .then((data) => { console.warn(JSON.stringify(data))})
            .catch((error) => {
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
                var member_list = [];
                var count_for_threshold = 0;
                var i;
                for (i = 0; i < all[1].transaction_data.length; ++i) {
                    if ((all[1].transaction_data[i].share_status == "own_stash") || (all[1].transaction_data[i].share))
                        count_for_threshold++;
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
        var shares_to_decrypt = [];
        var index = 0;
        while ((shares_to_decrypt.length < this.state.transaction.threshold) && (index < this.state.transaction.transaction_shares_data.length)) {
            if (this.state.transaction.transaction_shares_data[index].share) {
                shares_to_decrypt.push(betweenUs.AsymmetricDecrypt(this.state.transaction.transaction_shares_data[index].share,""));
            }
            index+=1;
        }
        if (shares_to_decrypt.length >= this.state.transaction.threshold) {
            var from_shares_symmetric_key_dictionary = betweenUs.CombineShares(shares_to_decrypt);
            try{
            var decrypted_buffer = betweenUs.SymmetricDecrypt(this.state.transaction.data.content, from_shares_symmetric_key_dictionary);
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