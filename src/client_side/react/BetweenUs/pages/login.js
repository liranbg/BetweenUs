'use strict';
import React, {Alert, View, Text, StyleSheet, TouchableHighlight, Image, TextInput,ScrollView} from 'react-native'
var LoginInputStyles = require("../styles/email_password.js");
var Icon = require('react-native-vector-icons/Ionicons');
var MK = require('react-native-material-kit');
var ServerAPI = require('../api/server_interaction');
var LoadingScreen = require('../components/LoadingSpinner');


const { MKButton, MKColor,MKTextField } = MK;

var LogIn = React.createClass({
    getInitialState() {
        return {
            loginState: 'idle',
            email: 'bob',
            password: '1'
        };
    },
    componentDidMount () {
        if (this.props.user_info != undefined) {
            this.setState({
                loginState: 'idle',
                email: this.props.user_info.email,
                password: this.props.user_info.password
            });
        }
    },
    clickToRegister() {
        this.props.navigator.push({id: 'register'});
    },
    clickToLogIn() {
        if ((this.refs['loginBTN'] !== undefined) && (this.refs['loginBTN'].state.disabled)) {
            return;
        }
        this.refs['loginBTN'].setState({disabled:true});
        this.setState({ loginState: 'busy' });
        ServerAPI.login(this.state.email,this.state.password)
            .then((response) => {
                this.setState({
                    loginState: 'success',
                    groups:response.data.groups,
                    user_id:response.data._id
                });
                this.props.navigator.push({id: 'logged_in', data:{groups:response.data.groups,user_id:response.data._id}});
            })
            .catch((err)=>{
                Alert.alert(
                    'Login Error',
                    err.message,
                    [
                        {text: 'OK' ,  style: 'ok'}
                    ]
                );
            })
            .finally((data) => {
                this.setState({ loginState: 'idle' });
                this.refs['loginBTN'].setState({disabled:false});
            });
    },
    render(){
        return (
            <View style={styles.container}>
                <View style={styles.welcomeImageContainer}>
                    <Image
                        source={require('../img/BetweenUsLogo.png')}
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
                            disabled={false}
                            ref="loginBTN"
                            backgroundColor={MKColor.Teal}
                            shadowRadius={2}
                            shadowOffset={{width:0, height:2}}
                            shadowOpacity={.7}
                            shadowColor="black"
                            style={LoginInputStyles.button}
                            onPress={this.clickToLogIn}>
                            <Text pointerEvents="none"
                                  style={{color: 'white', fontWeight: 'bold'}}>
                                Login
                            </Text>
                        </MKButton>
                    </View>
                </View>
                <LoadingScreen isOpen={this.state.loginState == 'busy'} text={"Logging in..."}/>
            </View>
        );
    }
});

var styles = StyleSheet.create({
    container: {
        flex: 1
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