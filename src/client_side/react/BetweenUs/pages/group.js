import React, {View, Text, StyleSheet, TouchableHighlight, ScrollView} from 'react-native'
var ServerAPI = require('../api/server_interaction');
var TransactionsSlider = require('../components/TransactionsSlider');
var CreateButton = require('../components/CreateButton');
var MK = require('react-native-material-kit');
const { MKButton } = MK;

var Groups = React.createClass({

    getInitialState() {
        return( {
            group_name: "",
            group_id: "",
            user_info: this.props.user_info,
            member_list: [],
            transaction_list: []
        })
    },
    componentDidMount: function() {
        if (this.props.data !== undefined) {
            this.setState(this.props.data);
        }
    },
    fetchGroupData() {
        ServerAPI.FetchGroupData(this.state.group_id)
            .then((response) => {
                this.setState(response);
            }).catch((error) => {console.warn(error);});
    },
    fetchTransactionThenShow(transaction_id) {
        Promise.all([
                ServerAPI.fetchTransactionData(transaction_id),
                ServerAPI.fetchTransactionSharesData(transaction_id),
                ServerAPI.fetchTransactionsNotifications(transaction_id)
            ])
            .then((all)=> {
                var data = all[0].transaction;
                var i;
                var member_list = [];
                var count_for_threshold = 0;
                for (i = 0; i < all[1].transaction_data.length; ++i) {
                    if (all[1].transaction_data[i].share) {
                        count_for_threshold++;
                    }
                    member_list.push(all[1].transaction_data[i]);
                }
                for (i = 0; i < all[2].length; ++i) {
                    if (all[2][i].status == "pending") {
                        for (var j = 0; j < member_list.length; ++j) {
                            if (member_list[j].user_id == all[2][i].sender.user_id)
                            {
                                member_list[j].pending_request = all[2][i];
                                break;
                            }
                        }
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
    render(){
        return (
            <View style={styles.container}>
                <Text style={{justifyContent: 'center', textAlign:'center', fontWeight:'bold', margin: 10, fontSize: 24}}>Group {this.state.group_name}</Text>
                <Text>Transactions</Text>
                <ScrollView>
                    <TransactionsSlider data={{transaction_list:this.state.transaction_list, fetchTransactionThenShow:this.fetchTransactionThenShow}}/>
                </ScrollView>
                <View style={{alignItems:'center'}}>
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
                <CreateButton title="Create Transaction" onPress={()=>{
                this.props.navigator.push({id:"create_transaction", data:{group_id:this.state.group_id, group_member_list_length:this.state.member_list.length}})
                }}/>
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