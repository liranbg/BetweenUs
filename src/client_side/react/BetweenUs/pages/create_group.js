import React, {View, Text, StyleSheet} from 'react-native'
var MK = require('react-native-material-kit');
var LoginInputStyles = require("../styles/email_password.js");
var Icon = require('react-native-vector-icons/Ionicons');
var ServerAPI = require('../api/server_interaction');
const { MKButton, MKColor,MKTextField } = MK;

var GroupCreation = React.createClass({

    getInitialState() {
        return( {
        })
    },
    componentDidMount: function() {

    },
    render(){
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Group Creation</Text>
                <View style={styles.container}>
                    <View style={styles.textInputContainer}>
                        <MKTextField
                            tintColor={'#86CDAD'}
                            textInputStyle={{color: '#86CDAD'}}
                            placeholder="Email"
                            style={styles.textInput}
                            value={this.state.email}
                            onChangeText={(email) => this.setState({email})}
                        />
                        <MKButton
                            style={styles.textInputLabel}
                            onPress={this.fetchGroupData}>
                            <Text>
                                <Icon name="person-add" size={30} color="#86CDAD" />
                            </Text>
                        </MKButton>

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
                                Create Group
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
    },
    title:{justifyContent: 'center', textAlign:'center', fontWeight:'bold', margin: 10, fontSize: 24},
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

module.exports = GroupCreation;