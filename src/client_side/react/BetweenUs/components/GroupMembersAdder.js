import React, {View, Text, StyleSheet} from 'react-native'
var MK = require('react-native-material-kit');
var LoginInputStyles = require("../styles/email_password.js");
var Icon = require('react-native-vector-icons/Ionicons');
var ServerAPI = require('../api/server_interaction');
const { MKButton, MKColor,MKTextField } = MK;

var GroupMembersAdderComponent = React.createClass({
    getInitialState() {
        return( {
            email:""
        })
    },
    render(){
        return (
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
                    onPress={()=>{
                    var response = this.props.onPress(this.state.email);
                    }}>
                    <Text>
                        <Icon name="person-add" size={30} color="#86CDAD" />
                    </Text>
                </MKButton>
            </View>
        )
    }
});


var GroupMembersAdder = React.createClass({
    getInitialState() {
        return( {
            amount:1,
            data_list: [""],
            component_list: [<GroupMembersAdderComponent onPress={this.addMember}/>,<GroupMembersAdderComponent onPress={this.addMember}/>]
        })
    },
    componentWillReceiveProps: function(nextProps) {
        this.setState({
            data_list: nextProps.data_list || []
        });
    },
    componentDidMount: function() {

    },
    addMember(email) {
        this.state.data_list.map((email_in_list)=>{
            if (email_in_list == email) {
                return "exists";
            }
        });
        this.state.data_list.push(email);
        var component;
        component = React.createElement(GroupMembersAdderComponent,{onPress:this.addMember});
        this.state.component_list.push(component);
        this.setState({}); //call to update screen. no need to put object inside
        return "added";
    },
    render(){
        return (
            <View style={styles.container}>
                <Text>{this.state.component_list.length}</Text>
                {
                    this.state.component_list.map((member,index)=>{
                        return <View key={index}>{member}</View>;
                        // return <View key={index}>{member}</View>;
                    })
                }

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
        flex: 0.8,
        marginRight: 20

    }
});

module.exports = GroupMembersAdder;