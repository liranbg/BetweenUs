import React, {View, Text, StyleSheet, TouchableHighlight, ListView} from 'react-native'
var ServerAPI = require('../api/server_interaction');
var Button = require('react-native-button');
var betweenUs = require('../api/betweenus');
betweenUs.setRNG(function(bits){
    require("react-native-randombytes"); //must be here before injecting rng function in betweenus plugin. generating seed
    function padLeft(str, bits){
        bits = bits || config.bits;
        var missing = str.length % bits;
        return (missing ? new Array(bits - missing + 1).join('0') : '') + str;
    }
    function construct(bits, arr, radix, size){
        var str = '',
            i = 0,
            len = arr.length-1;
        while( i<len || (str.length < bits) ){
            str += padLeft(parseInt(arr[i], radix).toString(2), size);
            i++;
        }
        str = str.substr(-bits);
        if( (str.match(/0/g)||[]).length === str.length){ // all zeros?
            return null;
        }else{
            return str;
        }
    }
    var bytes = Math.ceil(bits/8),
        str = null;
    while( str === null ){
        str = construct(bits, require("react-native-randombytes").randomBytes(bytes).toString('hex'), 16, 4);
    }
    return str;
});


var Transaction = React.createClass({
    transaction_test(){
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
        console.warn("-------------------");
        console.warn('Starting BetweenUs flow on text:');
        console.warn('"' + text_to_encrypt + '"');
        console.warn('Generating Symmetric Key...');
        var symmetric_key = betweenUs.GenerateSymmetricKey();
        console.warn('Done.');
        console.warn('Key: ' + symmetric_key);
        console.warn('Generating cipher text using previously generated symmetric key...');
        var encrypted_buffer = betweenUs.SymmetricEncrypt(text_to_encrypt, symmetric_key);
        console.warn('Encryption done.');
        console.warn('Cipher text: ' + encrypted_buffer);
        var clients_to_share_with = [client_1, client_2, client_3];
        console.warn('Using Shamir\'s Secret Sharing to split symmetric key into shares.');
        var shares = betweenUs.MakeShares(symmetric_key, clients_to_share_with.length, 2, 0);
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
    },

    getInitialState() {
        var members_ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1.user_id !== r2.user_id});
        var member_list = [];
        return( {
            transaction_id: "",
            transaction_name: "",
            threshold: "",
            initiator: {
                initiator_id: "",
                initiator_email: ""
            },
            group_data: {
                group_id:"",
                group_name:""
            },
            user_info: this.props.user_info,
            transaction_share_data: members_ds.cloneWithRows(member_list)
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
            console.log(all[0]);
            var members_ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1.user_id !== r2.user_id});

            all[0].transaction_data.transaction_share_data = members_ds.cloneWithRows(all[[1]].transaction_data);
            this.setState(all[0].transaction_data);

            console.warn("combining shares...");
            var all_shares = betweenUs.CombineShares([
                all[1].transaction_data[0].share,
                all[1].transaction_data[2].share
            ]);
            console.warn(all_shares);
            console.warn("combining shares is done");
            var chiper = all[0].transaction_data.cipher_meta_data.data;
            console.warn("chiper is");
            console.warn(chiper);
            console.warn("finishing...");
            /** Receives a string and converts it into a uInt8Array.
             *
             * @param s {string}
             * @returns {Uint8Array}
             */
            function Util_Text2uIntArray(s) {
                var ua = new Uint8Array(s.length);
                for (var i = 0; i < s.length; i++) {
                    ua[i] = s.charCodeAt(i);
                }
                return ua;
            }
            function Util_uIntArray2Text(uintArray) {
                return String.fromCharCode.apply(null, new Uint16Array(uintArray));
            }

            var decrypted_buffer = betweenUs.SymmetricDecrypt(Util_Text2uIntArray(chiper), all_shares);
            console.log(Util_uIntArray2Text(decrypted_buffer));


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
                <Text style={{justifyContent: 'center', flex:1, textAlign:'center', fontWeight:'bold', margin: 10, fontSize: 24}}>{this.state.transaction_name}</Text>
                <Text>Member List</Text>
                <View style={{flexDirection: 'row'}}>
                    <Text style={{flex:0.2, fontWeight:'bold', marginRight: 5, fontSize: 12}}>Email</Text>
                    <Text style={{flex:0.8, fontWeight:'bold', marginRight: 5, fontSize: 12}}>Share</Text>
                </View>
                <ListView
                    dataSource={this.state.transaction_share_data}
                    renderRow={this.PaintMembers}
                />
                <View style={{marginBottom:20}}/>
                <Button onPress={this.fetchTransactionData}>Get Data</Button>
            </View>
        );
    }
});


var styles = StyleSheet.create({
    container: {
        flex: 1
    }
});

module.exports = Transaction;