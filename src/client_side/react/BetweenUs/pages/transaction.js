import React, {View, Text, StyleSheet, TouchableHighlight, ListView} from 'react-native'
var ServerAPI = require('../api/server_interaction');
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
        }
    },
    getInitialState() {
        var members_ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1.user_id !== r2.user_id});
        var shares_ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1.user_id !== r2.user_id});
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
                members_list: members_ds.cloneWithRows([]),
                my_stash_id: "",
                transaction_shares_data: shares_ds.cloneWithRows([]),
                can_decrypt: false
            },
            user_info: this.props.user_info,
            // transaction_shares_data: members_ds.cloneWithRows([])
        })
    },
    componentDidMount: function() {
        if (this.props.data !== undefined)
        {
            this.setState({
                transaction_name: this.props.data.transaction_name,
                transaction_id: this.props.data.transaction_id
            });
            //this.fetchTransactionData(); //TODO unmark when finish with transaction page
        }
    },
    fetchTransactionData() {
        Promise.all([
            ServerAPI.fetchTransactionData(this.props.data.transaction_id),
            ServerAPI.fetchTransactionSharesData(this.props.data.transaction_id)
        ]).then((all)=> {
            var members_ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1.user_id !== r2.user_id});
            var shares_ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1.user_id !== r2.user_id});
            var data = all[0].transaction_data;
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
                    members_list: members_ds.cloneWithRows(data.members_list),
                    my_stash_id: "",
                    can_decrypt: all[1].transaction_data.length >= data.threshold,
                    transaction_shares_data: shares_ds.cloneWithRows(all[1].transaction_data)
                }

            });


        }).catch((error) => {
            console.warn(error);
        });
    },
    PaintMembers(rowData) {
        return (
            <View style={{flexDirection: 'row'}}>
                <Text style={{flex:0.2, fontWeight:'bold', marginRight: 5}}>{rowData.email}</Text>
                <Text style={{flex:0.7, fontWeight:'bold', marginRight: 5}}>{rowData.share?'Exists':'Missing'}</Text>
            </View>
        );
    },
    render(){
        return (
            <View style={styles.container}>
                <Text style={styles.header}>{this.state.transaction.name}</Text>
                <Text style={styles.sub_header}>Threshold: {this.state.transaction.threshold}</Text>
                {(
                    () => {
                        if (this.state.transaction.can_decrypt) {
                            return <Text style={styles.sub_header}>Open File</Text>
                        }
                    }
                )()}
                {(
                    () => {
                        if (this.state.transaction.members_list.length > 0) {
                            return


                        }
                    }
                )()}

                <ListView
                    dataSource={this.state.transaction.transaction_shares_data}
                    renderRow={this.PaintMembers}
                />
                <View style={{marginBottom:20}}/>
                <Button onPress={this.fetchTransactionData}>Get Data</Button>
            </View>
        );
    }
});


var styles = StyleSheet.create({
    header: {textAlign:'center', fontWeight:'bold', margin: 5, fontSize: 20},
    sub_header: {textAlign:'center', fontWeight:'bold', margin: 0, fontSize: 18},
    container: {
        flex: 1
    }
});
//Transaction.betweenus();
module.exports = Transaction;