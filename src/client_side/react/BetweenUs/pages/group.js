import React, {View, Text, StyleSheet, TouchableHighlight} from 'react-native'
var ServerAPI = require('../api/server_interaction');
var TransactionsSlider = require('../components/TransactionsSlider');
var CreateTransactionButton = require('../components/CreateTransactionButton');
var MK = require('react-native-material-kit');
const { MKButton } = MK;

var Groups = React.createClass({

    getInitialState() {
        return( {
            group_name: "",
            group_id: "",
            user_info: this.props.user_info,
            members_list: [],
            transaction_list: []
        })
    },
    componentDidMount: function() {
        if (this.props.data !== undefined) {
            console.warn(JSON.stringify(this.props.data));
            this.setState(this.props.data);
        }
    },
    fetchGroupData() {
        ServerAPI.FetchGroupData(this.props.data.group.group_id)
            .then((ResponseJSON) => {
                var list_of_participants = ResponseJSON.data.member_list;
                var creator = ResponseJSON.data.creator;
                creator.is_creator = true;
                list_of_participants.unshift(creator);
                this.setState(
                    {
                        members_list: list_of_participants,
                        transaction_list: ResponseJSON.data.transaction_list
                    });
            }).catch((error) => {console.warn(error);});
    },
    fetchTransactionThenShow(transaction_id) {
        Promise.all([
                ServerAPI.fetchTransactionData(transaction_id),
                ServerAPI.fetchTransactionSharesData(transaction_id)
            ])
            .then((all)=> {
                var data = all[0].transaction;
                var member_list = [];
                var count_for_threshold = 0;
                for (var i = 0; i < all[1].transaction_data.length; ++i) {
                    if (all[1].transaction_data[i].user_id != this.state.user_info.user_id) {
                        if (all[1].transaction_data[i].share_status == "own_stash")
                            count_for_threshold++;
                        member_list.push(all[1].transaction_data[i]);
                    }
                }
                return {
                    transaction: {
                        id: data.id,
                        name: data.transaction_name,
                        threshold: data.threshold,
                        initiator: {
                            id: data.initiator.initiator_id,
                            email: data.initiator.initiator_email
                        },
                        group: {
                            id:data.group_id,
                            name:data.my_stash
                        },
                        data: {
                            type:data.cipher_meta_data.type,
                            content:data.cipher_meta_data.data
                        },
                        members_list: data.members_list,
                        my_stash_id: "",
                        can_decrypt: count_for_threshold >= data.threshold,
                        transaction_shares_data: member_list
                    }

                }})
            .then((data)=> {
                this.props.navigator.push({id:"transaction", data:data});
            })
            .catch((error) => {
                console.warn(error);
            });
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
                <Text style={{justifyContent: 'center', textAlign:'center', fontWeight:'bold', margin: 10, fontSize: 24}}>Group {this.state.group_name}</Text>
                <Text>Transactions</Text>
                <TransactionsSlider data={{transaction_list:this.state.transaction_list, fetchTransactionThenShow:this.fetchTransactionThenShow}}/>
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
                <View style={{flex:1, alignSelf:'stretch'}}><CreateTransactionButton/></View>
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