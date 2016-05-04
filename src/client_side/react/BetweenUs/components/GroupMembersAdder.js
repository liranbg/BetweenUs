import React, {Alert, View, Text, StyleSheet, ListView, TextInput} from 'react-native'
var MK = require('react-native-material-kit');
var LoginInputStyles = require("../styles/email_password.js");
var Icon = require('react-native-vector-icons/Ionicons');
var IconFontAwesome = require('react-native-vector-icons/FontAwesome');
var ServerAPI = require('../api/server_interaction');
const { MKButton, MKColor,MKTextField } = MK;

var GroupMembersAdderComponent = React.createClass({
    render(){
        var rightBTN;
        var isFocus = this.props.isFocus;
        var actionBTN;
        if (this.props.islast) {
            actionBTN = ()=>{this.props.onPress("add", this.props.data.ref)};
        }
        else {
            actionBTN = ()=>{};
            rightBTN =  <MKButton
                shadowRadius={2}
                shadowOffset={{width:0, height:2}}
                shadowOpacity={.7}
                shadowColor="black"
                style={styles.textInputLabel}
                onPress={()=>{
                    this.props.onPress("delete", this.props.data.ref)

                    }}>
                <Text>
                    <IconFontAwesome name='user-times' size={24} color="#CC0000" />
                </Text>
            </MKButton>
        }
        return (
            <View style={styles.textInputContainer}>
                <MKTextField
                    autoFocus={isFocus}
                    editable={this.props.islast}
                    tintColor={MKColor.Blue}
                    textInputStyle={{color: MKColor.LightBlue}}
                    placeholder="Email"
                    style={styles.textInput}
                    value={this.props.data.email}
                    onChangeText={(email) => this.props.data.setEmail(this.props.data.ref, email)}
                    onSubmitEditing={actionBTN}
                />
                {rightBTN}
            </View>
        )
    }
});
var GroupMembersAdder = React.createClass({
    getInitialState() {
        return( {
            amount: 0,
            component_list: [{ref:"GroupMembersAdderComponent-0", email:""}],
            requestingState:false
        })
    },
    componentWillReceiveProps: function(nextProps) {
        this.setState({
            data_list: nextProps.data_list || []
        });
    },
    componentWillMount() {
        this.dataSource = new ListView.DataSource({
            rowHasChanged: (row1, row2) => row1 !== row2
        });
    },
    getEmailForComponentId(componentId) {
        for (var i in this.state.component_list) {
            if (this.state.component_list[i].ref == componentId)
                return this.state.component_list[i].email;
        }
        return undefined;
    },
    getAllEmails() {
        var list_of_emails = [];
        this.state.component_list.map((value,index)=> {
            if (value.email != "") list_of_emails.push(value.email);
            return null;
        });
        return list_of_emails;
    },
    requestHandle(action, componentId){
        if (this.state.requestingState)
            return;
        this.setState({requestingState:true});
        if (action == "add") {
            var email = this.getEmailForComponentId(componentId);
            if (!email) {
                Alert.alert(
                    'Error',
                    "Please check your input",
                    [
                        {text: 'OK' ,  style: 'ok'}
                    ]
                );
                this.setState({requestingState:false});
                return;
            }
            if (!this.checkEmailInList(email)) {
                ServerAPI.checkUserExists(email)
                    .then((result)=> {if (result.success)
                    {
                        this.addMember();
                        this.setState({requestingState:false});
                    }})
                    .catch((error)=>{
                        if (error.error.toLowerCase() == "user not found.") {
                            Alert.alert(
                                'Error',
                                error.error + " Please check your input",
                                [
                                    {text: 'OK' ,  style: 'ok'}
                                ]
                            );
                            this.setState({requestingState:false});
                            return;
                        }
                    });
            }
            else {
                Alert.alert(
                    'Error',
                    "User is already added",
                    [
                        {text: 'OK' ,  style: 'ok'}
                    ]
                );
                this.setState({requestingState:false});
            }
        }
        else if (action == "delete") {
            this.removeMember(componentId);
            this.setState({requestingState:false});
        }
    },
    checkEmailInList(email) {
        //checking for 2 appearence of email in list.
        //why 2? because the component we are checking for, already contains this email
        var seen = false;
        for (var i in this.state.component_list) {
            if (this.state.component_list[i].email == email)
                if (seen)
                    return true;
                else
                    seen=true;
        }
        return false;
    },
    addMember() {
        var next_amount = this.state.amount + 1;
        this.setState(state => {
            state.component_list.push({ref:"GroupMembersAdderComponent-"+next_amount, email:""});
            return {component_list: state.component_list, amount: next_amount};
        });
    },
    removeMember(componentId) {
        // if (!email) return false;
        var component_index = -1;
        this.state.component_list.map((component, index)=>{
            if (component.ref == componentId) {
                component_index = index;
                return true;
            }});
        this.setState(state => {
            state.component_list.splice(component_index,1);
            return {component_list: state.component_list};
        });
        return true;
    },
    setEmail(componentId, email) {
        var component_index = -1;
        this.state.component_list.map((component, index)=>{
            if (component.ref == componentId) {
                component_index = index;
                return true;
            }});
        this.setState(state => {
            state.component_list[component_index].email = email;
            return {component_list: state.component_list};
        });
    },
    _renderGroupMembers(rowData, sectionID, rowID) {
        var setFocus = false;
        if ((rowID!= 0) && (rowID == this.state.component_list.length-1)) {
            setFocus = true;
        }

        return (<GroupMembersAdderComponent
            key={rowID}
            isFocus={setFocus}
            islast={ rowID == this.state.component_list.length-1}
            data={{ref:rowData.ref, email:rowData.email, setEmail:this.setEmail}}
            onPress={this.requestHandle}/>)
    },
    render(){
        var dataSource = this.dataSource.cloneWithRows(this.state.component_list);
        return (
            <View style={styles.container}>
                <ListView
                    dataSource={dataSource}
                    renderRow={this._renderGroupMembers}/>
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
        alignItems: 'center',
        marginBottom:4
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