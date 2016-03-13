'use strict';
import React, {View, Text, StyleSheet, TouchableHighlight, Image, TextInput,ScrollView} from 'react-native'
var LoginInputStyles = require("../styles/email_password.js");
var Icon = require('react-native-vector-icons/Ionicons');
var MK = require('react-native-material-kit');
var ServerAPI = require('../api/server_interaction');
const { MKButton, MKColor,MKTextField } = MK;

var LogIn = React.createClass({
    getInitialState: function() {
        if (this.props.user_info != undefined) {
            return this.props.user_info
        }
        return {
            loginState: 'idle',
            email: 'alice',
            password: '1'
        };
    },
    componentDidMount: function() {
        //ECECED
        //E8E8E9
        //this.clickToLogIn();
    },
    clickToRegister: function() {
        this.props.navigator.push({id: 'register'});
    },
    clickToLogIn: function() {
        this.setState({ loginState: 'busy' });
        ServerAPI.Login(this.state.email,this.state.password).then((ResponseJSON) => {
            this.setState({
                loginState: 'success',
                groups:ResponseJSON.data.groups,
                user_id:ResponseJSON.data._id
            });
            this.props.navigator.push({id: 'logged_in'});
        });
    },
    render(){
        return (
            <View style={styles.container}>
                <Text style={styles.welcome}>
                    BetweenUs
                </Text>
                <View style={styles.welcomeImageContainer}>
                    <Image
                        source={{uri: 'http://facebook.github.io/react/img/logo_og.png'}}
                        style={styles.welcomeImage}
                    />
                </View>
                <View style={styles.container}>
                    <View style={styles.textInputContainer}>
                        <Text style={styles.textInputLabel}>
                            <Icon name="email" size={30} color="#4F8EF7" />
                        </Text>
                        <MKTextField
                            tintColor={MKColor.Blue}
                            textInputStyle={{color: MKColor.LightBlue}}
                            placeholder="Email"
                            style={styles.textInput}
                            value={this.state.email}
                            onChangeText={(email) => this.setState({email})}
                        />
                    </View>
                    <View style={styles.textInputContainer}>
                        <Text style={styles.textInputLabel}><Icon name="locked" size={30} color="#4F8EF7" /></Text>
                        <MKTextField
                            tintColor={MKColor.Blue}
                            secureTextEntry={true}
                            textInputStyle={{color: MKColor.LightBlue}}
                            placeholder="Password"
                            style={styles.textInput}
                            value={this.state.password}
                            onChangeText={(password) => this.setState({password})}
                        />
                    </View>
                    <View style={LoginInputStyles.row}>
                        <MKButton
                            backgroundColor={MKColor.Teal}
                            shadowRadius={2}
                            shadowOffset={{width:0, height:2}}
                            shadowOpacity={.7}
                            shadowColor="black"
                            style={LoginInputStyles.button}
                            onPress={this.clickToRegister}>
                            <Text pointerEvents="none"
                                  style={{color: 'white', fontWeight: 'bold'}}>
                                Register
                            </Text>
                        </MKButton>
                        <MKButton
                            backgroundColor={MKColor.Teal}
                            shadowRadius={2}
                            shadowOffset={{width:0, height:2}}
                            shadowOpacity={.7}
                            shadowColor="black"
                            style={LoginInputStyles.button}
                            onPress={this.clickToLogIn}
                        >
                            <Text pointerEvents="none"
                                  style={{color: 'white', fontWeight: 'bold'}}>
                                Login
                            </Text>
                        </MKButton>
                    </View>

                </View>
            </View>
        );
    }
});

var styles = StyleSheet.create({
    container: {
        flex: 1
        // backgroundColor: '#F5FCFF',
    },
    welcomeImageContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    welcomeImage: {
        width: 200,
        height: 200,
        margin: 5
    },
    welcome: {
        fontSize: 36,
        textAlign: 'center',
        margin: 10
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
        flex: 0.8,
        marginRight: 20

    }
});

module.exports = LogIn;