import React, {View, Text, StyleSheet, TouchableHighlight, ListView} from 'react-native'
var ServerAPI = require('../api/server_interaction');
var MK = require('react-native-material-kit');
const { MKButton } = MK;

var Groups = React.createClass({

    getInitialState() {
        var ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
        var groups = [
            {
                group_id: "",
                group_name: "",
                transaction_length: "",
                members_length: ""
            }
        ];
        return ( {
            user_info: this.props.user_info,
            dataSource: ds.cloneWithRows(groups)
        })
    },
    componentDidMount: function() {
        this.fetchGroupData();
    },
    fetchGroupData: function() {
        ServerAPI.GetGroups()
            .then((ResponseJSON) => {
                var ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
                this.setState({dataSource: ds.cloneWithRows(ResponseJSON.groups)});
            }).catch((error) => {
            console.warn(error);
        });
    },
    AddGroupRow(rowData) {
        //<Text style={{flex:0.6, fontWeight:'bold', marginRight: 5}}>{rowData.group_id}</Text>
        //<Text style={{flex:0.1, fontWeight:'bold', marginRight: 5}}>{rowData.transaction_length}</Text>
        var data = {group_id:rowData._id, group_name:rowData.group_name};
        return (
            <View style={{flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor:'#AFBDC4', marginBottom: 10}}>
                <MKButton
                    shadowRadius={2}
                    shadowOffset={{width:0, height:2}}
                    shadowOpacity={.7}
                    shadowColor="black"
                    onPress={()=>{this.props.navigator.push({id:"group", data:data});}}>
                    <Text style={{flex:1, fontWeight:'bold', marginRight: 5, fontSize:24}}>{rowData.group_name} </Text>
                </MKButton>
            </View>
        );
    },
    render(){
        return (
            <View style={styles.container}>
                <Text style={{justifyContent: 'center',  textAlign:'center', fontWeight:'bold', margin: 10, fontSize: 36}}>My Groups</Text>
                <ListView
                    dataSource={this.state.dataSource}
                    renderRow={this.AddGroupRow}
                />
                <MKButton
                    shadowRadius={2}
                    shadowOffset={{width:0, height:2}}
                    shadowOpacity={.7}
                    shadowColor="black"
                    onPress={this.fetchGroupData}>
                    <Text pointerEvents="none"
                          style={{color: '#0079FE', fontWeight: 'bold'}}>
                        Fetch Data
                    </Text>
                </MKButton>

            </View>
        );
    }
});

var styles = StyleSheet.create({
    container: {
        backgroundColor: 'white'
    },
});

module.exports = Groups;
