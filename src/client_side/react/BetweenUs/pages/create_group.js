import React, {Alert, View, Text, StyleSheet} from 'react-native'
var MK = require('react-native-material-kit');
var LoginInputStyles = require("../styles/email_password.js");
var GroupMembersAdder = require('../components/GroupMembersAdder');
var Icon = require('react-native-vector-icons/Ionicons');
var ServerAPI = require('../api/server_interaction');
var LoadingScreen = require('../components/LoadingSpinner');
const { MKButton, MKColor,MKTextField } = MK;

var GroupCreation = React.createClass({

    getInitialState() {
        return( {
            group_name:"",
            is_creating_group: false
        })
    },
    clickToCreateGroup () {
        if (this.state.group_name == "") {
            this.refs['group_name_input'].focus();
            return;
        }
        else if (this.refs.GroupMembersAdder.getAllEmails().length < 3) {
            Alert.alert(
                'Group creatoin error',
                "You must provide at least 2 unique members (not including you)",
                [
                    {text: 'OK' ,  style: 'ok'}
                ]
            );
            return;
        }
        else if (this.state.is_creating_group) {
            return;
        }
        this.setState({is_creating_group:true});
        ServerAPI.createGroup(this.state.group_name,this.refs.GroupMembersAdder.getAllEmails() )
            .then((response) => {
                this.props.navigator.replace({id:"group", data:response});
            })
            .catch((error)=> console.warn(JSON.stringify(error)))
            .finally((done) => {
                this.setState({is_creating_group:false});
            })
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
                            placeholder="Group Name"
                            ref="group_name_input"
                            style={styles.textInput}
                            value={this.state.group_name}
                            onChangeText={(group_name) => this.setState({group_name})}
                        />
                    </View>
                    <Text>Members list</Text>
                    <GroupMembersAdder ref="GroupMembersAdder"/>
                    <MKButton
                        backgroundColor={MKColor.Teal}
                        shadowRadius={2}
                        shadowOffset={{width:0, height:2}}
                        shadowOpacity={.7}
                        shadowColor="black"
                        style={LoginInputStyles.button}
                        onPress={this.clickToCreateGroup}>
                        <Text pointerEvents="none"
                              style={{color: 'white', fontWeight: 'bold'}}>
                            Create Group
                        </Text>
                    </MKButton>

                </View>
                <LoadingScreen isOpen={this.state.is_creating_group} headline="Please wait while" text={"Creating a group for you :)"}/>
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
        marginRight: 20

    }
});

module.exports = GroupCreation;