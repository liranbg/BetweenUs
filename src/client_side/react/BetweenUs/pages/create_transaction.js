import React, {View, Text, StyleSheet,TextInput} from 'react-native'
var MK = require('react-native-material-kit');
var LoginInputStyles = require("../styles/email_password.js");
var ServerAPI = require('../api/server_interaction');
const { MKSlider, MKButton, MKColor,MKTextField } = MK;
var Slider = require('react-native-slider');
var betweenUs = require('../api/betweenus');

var TransactionCreation = React.createClass({
    getInitialState() {
        return( {
            threshold:2,
            group_id:"",
            group_member_list_length:1,
            transaction_data: "TrTest12",
            transaction_name:"TrTest1"
        })
    },
    componentDidMount() {
        if (this.props.data) {
            this.setState({
                group_id:this.props.data.group_id,
                group_member_list_length:this.props.data.group_member_list_length
            })
        }
    },
    clickToCreateTransaction () {
        if ((this.state.threshold < 2) || (!this.state.group_id) || (this.state.transaction_data == "") || (this.state.transaction_name == ""))
        {
            console.warn(this.state.threshold);
            //TODO: mark all empty fields
            return false;
        }
        var symmetric_key = "";
        var encrypted_text = "";
        var assigned_shares = [];
        ServerAPI.getMembersPublicKeys(this.state.group_id)
            .then((response)=> {
                for (var i in response.key_info) {
                    assigned_shares.push(response.key_info[i]);
                }
                return betweenUs.GenerateSymmetricKey();
            })
            .then((sym_key)=> {
                symmetric_key = sym_key;
                return betweenUs.SymmetricEncrypt(this.state.transaction_data, symmetric_key);
            })
            .then((enc_text) => {
                encrypted_text = enc_text;
                return betweenUs.MakeShares(symmetric_key, assigned_shares.length, parseInt(this.state.threshold), 0);
            })
            .then((shares) => {
                for (var i in shares) {
                    assigned_shares[i].share = betweenUs.AsymmetricEncrypt(shares[i], assigned_shares[i].public_key);
                }
                return assigned_shares;
            })
            .then((ready_shares) => {
                ServerAPI.createTransaction(this.state.group_id, encrypted_text, parseInt(this.state.threshold), this.state.transaction_name, ready_shares)
                    .then((result)=> {
                        console.warn(JSON.stringify(result));
                        var data = result.data;
                        var i;
                        var member_list = [];
                        var count_for_threshold = 1; //my own share
                        for (i = 0; i < assigned_shares.length; ++i) {
                            if (assigned_shares[i].user_id != this.props.user_info.user_id) {
                                member_list.push({
                                    user_id:assigned_shares[i].user_id,
                                    share:"",
                                    email:assigned_shares[i].email,
                                    share_status:"missing"
                                });
                            }
                            else {
                                member_list.push({
                                    user_id:assigned_shares[i].user_id,
                                    share:assigned_shares[i].share,
                                    email:assigned_shares[i].email,
                                    share_status:"own_stash"
                                });
                            }
                        }
                        return ({
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
                        })
                    })
                    .then((transaction_data)=> {
                        this.props.navigator.replace({id:"transaction", data:transaction_data});
                    });
            })
            .catch((error) => console.warn(error));
    },
    render(){
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Transaction Creation</Text>
                <View style={styles.container}>
                    <View style={styles.textInputContainer}>
                        <MKTextField
                            tintColor={'#86CDAD'}
                            textInputStyle={{color: '#86CDAD'}}
                            placeholder="Transaction Name"
                            style={styles.textInput}
                            value={this.state.transaction_name}
                            onChangeText={(transaction_name) => this.setState({transaction_name})}
                        />
                    </View>
                    <View style={[styles.textInputContainer]}>
                        <Text style={{marginRight:10}}>Threshold: {this.state.threshold}</Text>
                        <Slider
                            style={{flex:1, marginRight:10}}
                            minimumValue={1}
                            step={1}
                            maximumValue={this.state.group_member_list_length}
                            value={this.state.threshold}
                            onValueChange={(threshold) => this.setState({threshold})}
                        />
                    </View>
                    <View style={styles.textInputContainer}>
                        <Text>Data:</Text>
                        <TextInput
                            multiline={true}
                            numberOfLines={5}
                            style={styles.dataInput}
                            value={this.state.transaction_data}
                            onChangeText={(transaction_data) => this.setState({transaction_data})}
                        />
                    </View>
                </View>
                <MKButton
                    backgroundColor={MKColor.Teal}
                    shadowRadius={2}
                    shadowOffset={{width:0, height:2}}
                    shadowOpacity={.7}
                    shadowColor="black"
                    style={styles.createButton}
                    onPress={this.clickToCreateTransaction}>
                    <Text pointerEvents="none"
                          style={{color: 'white', fontWeight: 'bold'}}>
                        Create Transaction
                    </Text>
                </MKButton>
            </View>
        );
    }
});


var styles = StyleSheet.create({
    container: {
        flex: 1
    },
    title: {
        justifyContent: 'center',
        textAlign:'center',
        fontWeight:'bold',
        margin: 10,
        fontSize: 24
    },
    textInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom:15
    },
    textInputLabel: {
        flex: 0.1
    },
    textInput:{
        flex: 0.8,
        margin: 10
    },
    dataInput: {
        flex : 1,
        marginLeft:10,
        marginRight:10
    },
    slider: {
        flex: 1
    },
    createButton:{
        height:45,
        margin: 10,
        justifyContent: 'center',
        alignItems: 'center'
    }
});

module.exports = TransactionCreation;