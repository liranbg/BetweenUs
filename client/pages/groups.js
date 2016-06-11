import {Dimensions, View, Text, StyleSheet, TouchableHighlight, ListView} from "react-native";
import React, { Component } from 'react';
var Modal   = require('react-native-modalbox');
var ServerAPI = require('../api/server_interaction');
var CreateButton = require('../components/CreateButton');
var MK = require('react-native-material-kit');
const { MKButton } = MK;
var GroupsSlider = require('../components/GroupsSlider');
var LoadingScreen = require('../components/LoadingSpinner');


var Groups = React.createClass({
    getInitialState() {
        return ( {
            member_list_modal: {
                isOpen: false,
                members: [],
                index: -1
            },
            user_info: this.props.user_info,
            is_loading_group: false,
            groups: []
        })
    },
    componentDidMount: function() {
        this.fetchMyGroupListData();
    },
    fetchMyGroupListData: function() {
        ServerAPI.GetGroups()
            .then((ResponseJSON) => {
                this.setState({groups: ResponseJSON.groups});
            }).catch((error) => {
        });
    },
    fetchGroupThenShow: function(group_id) {
        if (this.state.is_loading_group) {
            return;
        }
        this.setState({is_loading_group:true});
        ServerAPI.FetchGroupData(group_id)
            .then((response)=>{
                this.props.navigator.push({id:"group", data:response});
            })
            .catch((error) => {console.warn(error);})
            .finally((done)=> {
                this.setState({is_loading_group:false});
            });
    },
    showMemberListModal(group_id) {
        ServerAPI.FetchGroupData(group_id)
            .then((response)=>{
                this.setState({member_list_modal:{isOpen:true,index:group_id,members:response.member_list}});
                this.refs.member_list_modal.open();
            });
    },
    closeMemberListModal() {
        this.setState({member_list_modal: {isOpen:!this.state.member_list_modal.isOpen, index:-1, members:[]}});
    },
    render(){
        return (
            <View style={styles.container}>
                <Text style={{justifyContent: 'center',  textAlign:'center', fontWeight:'bold', margin: 10, fontSize: 36}}>My Groups</Text>
                <GroupsSlider data={{groups:this.state.groups,fetchGroupThenShow:this.fetchGroupThenShow}} btnCMD={[this.showMemberListModal]}/>
                <Modal backdrop={true} style={styles.member_list_modal} position={"center"} ref={"member_list_modal"} isOpen={this.state.member_list_modal.isOpen}>
                    {
                        this.state.member_list_modal.members.map(index => {
                            return <Text key={index.email}>{index.email}</Text>
                        })
                    }
                    <MKButton
                        shadowRadius={2}
                        shadowOffset={{width:0, height:2}}
                        shadowOpacity={.7}
                        shadowColor="black"
                        onPress={()=>this.closeMemberListModal()}>
                        <Text pointerEvents="none"
                              style={{color: '#0079FE', fontWeight: 'bold'}}>
                            Close ({this.state.member_list_modal.isOpen ? "true" : "false"})
                        </Text>
                    </MKButton>
                </Modal>
                <View style={{alignItems:'center'}}>
                    <MKButton
                        shadowRadius={2}
                        shadowOffset={{width:0, height:2}}
                        shadowOpacity={.7}
                        shadowColor="black"
                        onPress={this.fetchMyGroupListData}>
                        <Text pointerEvents="none"
                              style={{color: '#0079FE', fontWeight: 'bold'}}>
                            Fetch Data
                        </Text>
                    </MKButton>
                </View>
                <CreateButton title="Create Group" onPress={()=>{
                this.props.navigator.push({id:"create_group", data:{}})
                }}/>
                <LoadingScreen isOpen={this.state.is_loading_group} headline="Please wait..." text={"Fetching group\'s data..."}/>
            </View>
        );
    }
});

var styles = StyleSheet.create({
    container: {
        flex: 1,
        // flexDirection:'column',
    },
    member_list_modal: {
        justifyContent: 'center',
        alignItems: 'center',
        height: 300,
        width: 300
    },

});

module.exports = Groups;
