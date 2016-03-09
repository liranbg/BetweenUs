import React, {View, Text, StyleSheet, TouchableHighlight, ListView} from 'react-native'
var GLOBAL = require('../env');
var Button = require('react-native-button');

var Transaction = React.createClass({

    getInitialState() {
        var members_ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1.user_id !== r2.user_id});
        var member_list = [
            {
                share:"",
                email:""
            }
        ];
        return( {
            transaction_id: "",
            transaction_name: "",
            threshold: "",
            initiator: {
                initiator_id: "",
                initiator_email: ""
            },
            group_data: {
                group_id:"",
                group_name:""
            },
            user_info: this.props.user_info,
            transaction_share_data: members_ds.cloneWithRows(member_list)
        })
    },
    componentDidMount: function() {
        if (this.props.data !== undefined)
        {
            this.setState({transaction_name: this.props.data.transaction_name,
            transaction_id: this.props.data.transaction_id});
            this.fetchTransactionData();
        }
    },
    fetchTransactionData() {
        fetch(GLOBAL.DB_SERVER + "/transactions/get_transaction?transaction_id=" + this.props.data.transaction_id,
            {
                method: 'GET',
                headers:
                {
                    'Accept': 'application/json'
                }
            })
            .then((response) => response.json())
            .then((ResponseJSON) => {
                this.setState(ResponseJSON.transaction_data);
            }).catch((error) => {
            console.warn(error);
        });
        this.fetchTransactionSharesData();
    },
    fetchTransactionSharesData() {
        fetch(GLOBAL.DB_SERVER + "/transactions/get_share_stash?transaction_id=" + this.props.data.transaction_id,
            {
                method: 'GET',
                headers:
                {
                    'Accept': 'application/json'
                }
            })
            .then((response) => response.json())
            .then((ResponseJSON) => {
                //console.warn(JSON.stringify(ResponseJSON.transaction_data));
                var members_ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1.user_id !== r2.user_id});
                this.setState({transaction_share_data: members_ds.cloneWithRows(ResponseJSON.transaction_data)});
            }).catch((error) => {
            console.warn(error);
        });
    },
    PaintMembers(rowData) {
        return (
            <View style={{flexDirection: 'row'}}>
                <Text style={{flex:0.2, fontWeight:'bold', marginRight: 5}}>{rowData.email}</Text>
                <Text style={{flex:0.7, fontWeight:'bold', marginRight: 5}}>{rowData.share?'Exists':'Missing'}</Text>
            </View>
        );
    },
    render(){
        return (
            <View style={styles.container}>
                <Text style={{justifyContent: 'center', flex:1, textAlign:'center', fontWeight:'bold', margin: 10, fontSize: 24}}>{this.state.transaction_name}</Text>
                <Text>Member List</Text>
                <View style={{flexDirection: 'row'}}>
                    <Text style={{flex:0.2, fontWeight:'bold', marginRight: 5, fontSize: 12}}>Email</Text>
                    <Text style={{flex:0.8, fontWeight:'bold', marginRight: 5, fontSize: 12}}>Share</Text>
                </View>
                <ListView
                    dataSource={this.state.transaction_share_data}
                    renderRow={this.PaintMembers}
                />
                <View style={{marginBottom:20}}/>
                <Button onPress={this.fetchTransactionData}>Get Data</Button>
            </View>
        );
    }
});


var styles = StyleSheet.create({
    container: {
        flex: 1
    }
});

module.exports = Transaction;