import {AsyncStorage, Image, Alert, View, Text, TextInput, StyleSheet, TouchableHighlight} from 'react-native'
import React, { Component } from 'react';
var LoginInputStyles = require("../styles/email_password.js");
import Icon from 'react-native-vector-icons/MaterialIcons';
var MK = require('react-native-material-kit');
var ServerAPI = require('../api/server_interaction');
var LoadingScreen = require('../components/LoadingSpinner');
var RSATools = require('../utils/rsa/index');
const { MKButton, MKColor, } = MK;

var Registration = React.createClass({
    getInitialState: function() {
        return {
            registrationState: 'idle',
            email: '',
            password: ''
        };
    },
    clickToRegister: function() {
        if ((this.refs['registerBTN'] !== undefined) && (this.refs['registerBTN'].state.disabled)) {
            return;
        }
        if ((this.state.email == "") || (this.state.password == "")) {
            Alert.alert(
                'Registration Error',
                "Please check your credentials",
                [
                    {text: 'OK' ,  style: 'ok'}
                ]
            );
            return;
        }
        this.setState({ registrationState: 'busy' });
        var keys_to_store;
        RSATools.GenerateKeys(2048)
            .then((keys) => {
                keys_to_store = keys;
                return ServerAPI.register(this.state.email, this.state.password,  keys_to_store["public"]);
            })
            .then((response) => {
                AsyncStorage.setItem("betweenus/private/"+this.state.email, keys_to_store["private"]);
                this.props.navigator.push({id: 'login', user_info: {email:this.state.email, password:this.state.password, loginState: 'idle'}});
            })
            .catch((error) => {
                AsyncStorage.removeItem("betweenus/private/"+this.state.email);
                Alert.alert(
                    'Registration Error',
                    error.error,
                    [
                        {text: 'OK' ,  style: 'ok'}
                    ]
                );
            })
            .finally((data) => {
                this.setState({ registrationState: 'idle' });
                this.refs['registerBTN'].setState({disabled:false});
            });
    },
    render(){
        return (
            <View style={styles.container}>
                <Text style={styles.welcome}>
                    Join Us!
                </Text>
                <View style={styles.welcomeImageContainer}>
                    <Image
                        source={require('../img/BetweenUsLogo.png')}
                        style={styles.welcomeImage}
                    />
                </View>
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
                        <Text style={styles.textInputLabel}><Icon name="lock" size={30} color="#4F8EF7" /></Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Password"
                            secureTextEntry={true}
                            onChangeText={(password) => this.setState({password})}
                            value={this.state.password}
                        />
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
                            disabled={false}
                            ref="registerBTN"
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
                <LoadingScreen isOpen={this.state.registrationState == 'busy'} text={"Registering..."}/>
            </View>
        );
    }
});

var styles = StyleSheet.create({
    container: {
        flex: 1
    },
    welcome: {
        fontSize: 36,
        textAlign: 'center',
        margin: 10
    },
    welcomeImageContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    welcomeImage: {
        width: 400,
        height: 200,
        margin: 2
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