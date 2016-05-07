import React from 'react';
import {View, Alert, Text,ScrollView, StyleSheet, TouchableOpacity, Dimensions} from 'react-native'
var Swipeout = require('react-native-swipeout');
var Icon = require('react-native-vector-icons/Ionicons');

var GroupsSlider = React.createClass({
    getInitialState: function() {
        return {
            groups: this.props.data.groups,
            btnCMD: []
        };
    },
    componentWillReceiveProps: function(nextProps) {
        this.setState({
            groups: nextProps.data.groups,
            btnCMD: nextProps.btnCMD
        });
    },
    _buttonsGroups: function(index) {
        return [{
            backgroundColor: '',
            component: (
                <View style={styles.scrollButton}>
                    <Icon style={{borderColor:'black'}} size={28} name="information" color="#2980B9"/>
                    <Text style={{fontSize: 10}}>Members</Text>
                </View>
            ),
            onPress: ()=>{
                // console.warn(typeof );
                if (this.state.btnCMD.length) {
                    this.state.btnCMD[0](index); //show member list. first in list
                }
            }
        }]
    },
    _renderRow: function(value, index) {
        return (
            <View style={styles.row} key={index}>
                <Swipeout autoClose={true} right={this._buttonsGroups(value._id)} backgroundColor={'#EAEAEA'}>
                    <TouchableOpacity onPress={()=>this.props.data.fetchGroupThenShow(value._id)}>
                        <View style={{flexDirection: 'row',alignItems: 'center'}}>
                            <View style={styles.shareExistsIcon}>
                                <Icon size={28} name="ios-people" color="#247BA0"/>
                            </View>
                            <View style={{flexDirection: 'column'}}>
                                <View>
                                    <Text style={{fontSize: 20}}>{value.group_name}</Text>
                                </View>
                                <View style={{flexDirection: 'row'}}>
                                    <Text style={{fontSize: 11}}>Members: {value.member_list.length+1},</Text>
                                    <View style={{marginRight: 3}}/>
                                    <Text style={{fontSize: 11}}>Transactions: {value.transaction_list.length}</Text>
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                </Swipeout>
            </View>
        )
    },
    render: function() {
        return (
            <View style={styles.container}>
                <ScrollView style={styles.outerScroll}>
                    {this.state.groups.map(this._renderRow, this)}
                </ScrollView>
            </View>
        );
    }
});
var styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column'
    },
    outerScroll: {
        flex: 1,
        flexDirection: 'column'
    },
    row: {
        borderColor: '#d6d7da',
        borderWidth: 2,
        flex: 1,
        height: 50,
        marginTop: 2,
        marginBottom: 2,
    },
    scrollButton: {
        height: 45,
        flexDirection: 'column',
        backgroundColor: '#EAEAEA',
        alignItems: 'center',
        justifyContent: 'center'
    },
    shareExistsIcon: {
        height: 45,
        marginRight:5,
        marginLeft:5,
        backgroundColor: '#EAEAEA',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start'
    }
});

module.exports = GroupsSlider;