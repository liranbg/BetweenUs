import React, {View, Text, StyleSheet, TouchableHighlight, ListView} from 'react-native'
var ServerAPI = require('../api/server_interaction');
var MK = require('react-native-material-kit');
const { MKButton } = MK;

var Groups = React.createClass({

    getInitialState() {
        var members_ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1.user_id !== r2.user_id});
        var transactions_ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1.transaction_id !== r2.transaction_id});
        var member_list = [
            {
                user_id:"",
                email:""
            }
        ];
        var transaction_list = [

        ];
        return( {
            group_name: "",
            group_id: "",
            user_info: this.props.user_info,
            members_list: members_ds.cloneWithRows(member_list),
            transactions_list: transactions_ds.cloneWithRows(transaction_list)
        })
    },
    componentDidMount: function() {
        if (this.props.data !== undefined)
        {
            this.setState(this.props.data);
            this.props.navigator.push({id:"transaction", data:{
                transaction_id: "549b28dde0a96df05e8d1426ad6e6aed",
                transaction_name: "Prototype Transaction"
            }});
            //this.fetchGroupData();
        }
    },
    fetchGroupData() {
        ServerAPI.FetchGroupData(this.props.data.group_id)
            .then((ResponseJSON) => {
                var members_ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1.user_id !== r2.user_id});
                var transactions_ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1.transaction_id !== r2.transaction_id});
                var list_of_participants = ResponseJSON.data.member_list;
                var creator = ResponseJSON.data.creator;
                creator.is_creator = true;
                list_of_participants.unshift(creator);
                this.setState(
                    {
                        members_list: members_ds.cloneWithRows(list_of_participants),
                        transactions_list: transactions_ds.cloneWithRows(ResponseJSON.data.transaction_list)
                    });
            }).catch((error) => {console.warn(error);});
    },
    PaintMembers(rowData) {
        return (
            <View style={{flexDirection: 'row'}}>
                <Text style={{flex:0.2, fontWeight:'bold', marginRight: 5}}>{rowData.email}</Text>
                <Text style={{flex:0.7, fontWeight:'bold', marginRight: 5}}>{rowData.user_id}</Text>
            </View>
        );
    },
    PaintTransactions(rowData) {
        var data = {
            transaction_id: rowData.transaction_id,
            transaction_name: rowData.transaction_name
        };
        return (
            <View style={{flexDirection: 'row'}}>
                <MKButton
                    shadowRadius={2}
                    shadowOffset={{width:0, height:2}}
                    shadowOpacity={.7}
                    shadowColor="black"
                    onPress={()=>{this.props.navigator.push({id:"transaction", data:data});}}>
                    <Text style={{flex:0.2, fontWeight:'bold', marginRight: 5}}>{rowData.transaction_name}</Text>
                    <Text style={{flex:0.8, fontWeight:'bold', marginRight: 5}}>{rowData.transaction_id}</Text>
                </MKButton>
            </View>
        );
    },
    render(){
        return (
            <View style={styles.container}>
                <Text style={{justifyContent: 'center', flex:1, textAlign:'center', fontWeight:'bold', margin: 10, fontSize: 24}}>Group {this.state.group_name}</Text>
                <Text>Member List</Text>
                <View style={{flexDirection: 'row'}}>
                    <Text style={{flex:0.2, fontWeight:'bold', marginRight: 5, fontSize: 12}}>Email</Text>
                    <Text style={{flex:0.8, fontWeight:'bold', marginRight: 5, fontSize: 12}}>User ID</Text>
                </View>
                <ListView
                    dataSource={this.state.members_list}
                    renderRow={this.PaintMembers}
                />
                <View style={{marginBottom:20}}/>
                <Text>Transactions List</Text>
                <View style={{flexDirection: 'row'}}>
                    <Text style={{flex:0.2, fontWeight:'bold', marginRight: 5, fontSize: 12}}>Name</Text>
                    <Text style={{flex:0.8, fontWeight:'bold', marginRight: 5, fontSize: 12}}>Transaction ID</Text>
                </View>
                <ListView
                    dataSource={this.state.transactions_list}
                    renderRow={this.PaintTransactions}
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
        flex: 1
    }
});

module.exports = Groups;