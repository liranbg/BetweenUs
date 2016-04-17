import React, {View, Text, StyleSheet,TextInput} from 'react-native'
var MK = require('react-native-material-kit');
var LoginInputStyles = require("../styles/email_password.js");
var ServerAPI = require('../api/server_interaction');
const { MKSlider, MKButton, MKColor,MKTextField } = MK;
var betweenUs = require('../api/betweenus');

var TransactionCreation = React.createClass({
    getInitialState() {
        return( {
            threshold:1,
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
                console.warn('Symmetric Key: ' + JSON.stringify(symmetric_key));
                console.warn('Generating cipher text using previously generated symmetric key...');
                return betweenUs.SymmetricEncrypt(this.state.transaction_data, symmetric_key);
            })
            .then((enc_text) => {
                encrypted_text = enc_text;
                console.warn('Encryption done.');
                console.warn('Cipher text: ' + encrypted_text);
                console.warn('Using Shamir\'s Secret Sharing to split symmetric key into shares with', parseInt(this.state.threshold), 'threshold');
                return betweenUs.MakeShares(symmetric_key, assigned_shares.length, parseInt(this.state.threshold), 0);
            })
            .then((shares) => {
                console.warn('Done splitting to shares.');
                console.warn('Starting encryption with RSA');
                for (var i in shares) {
                    console.warn('EMAIL: ' + assigned_shares[i].email + ', Share: ' + shares[i]);
                    assigned_shares[i].share = betweenUs.AsymmetricEncrypt(shares[i], assigned_shares[i].public_key);
                }
                return assigned_shares;
            })
            .then((ready_shares) => {
                ServerAPI.createTransaction(this.state.group_id, encrypted_text, parseInt(this.state.threshold), this.state.transaction_name, ready_shares)
                    .then((result)=> {
                        //TODO: push to transaction with new transaction information
                        console.warn(JSON.stringify(result));
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
                    <View style={styles.textInputContainer}>
                        <Text>Threshold: {this.state.threshold}</Text>
                        <MKSlider
                            ref="sliderWithValue"
                            min={1}
                            max={this.state.group_member_list_length}
                            value={this.state.threshold}
                            trackSize={1}
                            style={styles.slider}
                            onChange={(threshold) => this.setState({threshold: threshold.toFixed(0)})}
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
                    <MKButton
                        backgroundColor={MKColor.Teal}
                        shadowRadius={2}
                        shadowOffset={{width:0, height:2}}
                        shadowOpacity={.7}
                        shadowColor="black"
                        style={LoginInputStyles.button}
                        onPress={this.clickToCreateTransaction}>
                        <Text pointerEvents="none"
                              style={{color: 'white', fontWeight: 'bold'}}>
                            Create Transaction
                        </Text>
                    </MKButton>

                </View>
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
    }
});

module.exports = TransactionCreation;