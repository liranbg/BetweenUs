import React, {Dimensions, View, Text, StyleSheet, TouchableHighlight, ListView} from "react-native";
var ServerAPI = require('../api/server_interaction');
var CreateButton = require('../components/CreateButton');
var MK = require('react-native-material-kit');
const { MKButton } = MK;

var GroupsSlider = require('../components/GroupsSlider');

var {height, width} = Dimensions.get('window');


var Groups = React.createClass({
    getInitialState() {
        return ( {
            user_info: this.props.user_info,
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
        
        ServerAPI.FetchGroupData(group_id)
            .then((ResponseJSON) => {
                var creator = ResponseJSON.data.creator;
                creator.is_creator = true;
                ResponseJSON.data.member_list.unshift(creator);
                ResponseJSON.data.group_id=ResponseJSON.data.id;
                delete ResponseJSON.data.id;
                this.props.navigator.push({id:"group", data:ResponseJSON.data});
            }).catch((error) => {console.warn(error);});
    },
    AddGroupRow(rowData) {
        var data = {group_id:rowData._id, group_name:rowData.group_name};
        return (
            <View style={{flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor:'#AFBDC4', marginBottom: 10}}>
                <MKButton
                    shadowRadius={2}
                    shadowOffset={{width:0, height:2}}
                    shadowOpacity={.7}
                    shadowColor="black"
                    onPress={()=>this.fetchGroupDataAndShow(data)}>
                    <Text style={{flex:1, fontWeight:'bold', marginRight: 5, fontSize:24}}>{rowData.group_name} </Text>
                </MKButton>
            </View>
        );
    },
    render(){
        return (
            <View style={styles.container}>
                <Text style={{justifyContent: 'center',  textAlign:'center', fontWeight:'bold', margin: 10, fontSize: 36}}>My Groups</Text>
                <GroupsSlider data={{groups:this.state.groups,fetchGroupThenShow:this.fetchGroupThenShow}}/>
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
                <CreateButton title="Create Group" onPress={()=>{console.warn("create group");}}/>
            </View>
        );
    }
});

var styles = StyleSheet.create({
    container: {
        flex: 1,
        // flexDirection:'column',
    }
});

module.exports = Groups;
