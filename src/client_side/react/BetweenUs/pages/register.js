import React, {View, Text, TextInput, StyleSheet, TouchableHighlight} from 'react-native'
var LoginInputStyles = require("../styles/email_password.js");
var Icon = require('react-native-vector-icons/Ionicons');
var MK = require('react-native-material-kit');
var ServerAPI = require('../api/server_interaction');
const { MKButton, MKColor, } = MK;

var Registration = React.createClass({
    getInitialState: function() {
        return {
            registrationState: 'idle',
            email: 'alice',
            password: '1'
        };
    },
    clickToRegister: function() {
        this.setState({ loginState: 'busy' });
        this.props.navigator.push({id: 'login',user_info: {email:this.state.email, password:this.state.password, loginState: 'idle'}});
        ServerAPI.register(this.state.email, this.state.password, "1")
            .then((response) => {
                this.props.navigator.push({id: 'login',user_info: {email:this.state.email, password:this.state.password, loginState: 'idle'}});

            })
            .catch((error) => {
                console.error(JSON.stringify(error));
            });
        // fetch(GLOBAL.DB_SERVER + "/users/register_user", {
        //     method: 'POST',
        //     headers: {
        //         'Accept': 'application/json',
        //         'Content-Type': 'application/json'
        //     },
        //     body: JSON.stringify({
        //         email: this.state.email,
        //         password: this.state.password,
        //         public_key: "1" //TODO: Add public key generator
        //     })
        // })
        //     .then((response) => response.json())
        //
        //     .then((ResponseJSON) => {
        //
        //     }).catch((error) => {
        //     console.warn(error);
        // });
    },
    render(){
        return (
            <View>
                <Text style={{justifyContent: 'center', flex:1, textAlign:'center', fontWeight:'bold', margin: 10, fontSize: 36}}>Join Us!</Text>
                <View style={styles.container}>
                    <View style={styles.textInputContainer}>
                        <Text style={styles.textInputLabel}><Icon name="email" size={30} color="#4F8EF7" /></Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Email"
                            onChangeText={(email) => this.setState({email})}
                            value={this.state.email}
                        />
                    </View>
                    <View style={styles.textInputContainer}>
                        <Text style={styles.textInputLabel}><Icon name="locked" size={30} color="#4F8EF7" /></Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Password"
                            secureTextEntry={true}
                            onChangeText={(password) => this.setState({password})}
                            value={this.state.password}
                        />
                    </View>
                </View>
                <View style={LoginInputStyles.row}>
                    <MKButton
                        backgroundColor={MKColor.Teal}
                        shadowRadius={2}
                        shadowOffset={{width:0, height:2}}
                        shadowOpacity={.7}
                        shadowColor="black"
                        onPress={this.props.navigator.pop}
                        style={LoginInputStyles.button}
                    >
                        <Text pointerEvents="none"
                              style={{color: 'white', fontWeight: 'bold'}}>
                            Cancel
                        </Text>
                    </MKButton>
                    <MKButton
                        backgroundColor={MKColor.Teal}
                        shadowRadius={2}
                        shadowOffset={{width:0, height:2}}
                        shadowOpacity={.7}
                        shadowColor="black"
                        onPress={this.clickToRegister}
                        style={LoginInputStyles.button}
                    >
                        <Text pointerEvents="none"
                              style={{color: 'white', fontWeight: 'bold'}}>
                            Register
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
    textInputContainer: {
        flexDirection: 'row',
        flex: 1,
        alignItems: 'center'
    },
    textInputLabel: {
        flex: 0.1

    },
    textInput:{
        flex: 0.9

    }
});

module.exports = Registration;