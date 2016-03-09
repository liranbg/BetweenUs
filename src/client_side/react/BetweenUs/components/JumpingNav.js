'use strict';
var Icon = require('react-native-vector-icons/Ionicons');
var AllGroupsScene = require('../pages/groups');
var GroupScene = require("../pages/group");
var TransactionScene = require("../pages/transaction");
//var GroupScene = require('../pages/group');
import React, {    BackAndroid,Navigator, StyleSheet, ScrollView, Text, TouchableHighlight, View} from 'react-native';


var INITIAL_ROUTES = [
    {id: 'groups'},
    {id: 'group'},
    {id: 'transaction'},
    {id: 'a'}

];

var JumpingNavBar = React.createClass({
    render() {
        return (
            <View style={styles.tabs}>
                <Icon style={{flex:0.3, borderColor:'black'}} size={36} name="ios-people" color="#4F8EF7"  onPress={()=>{
                this.props.navigator.jumpTo(INITIAL_ROUTES[0]);
                }}/>
                <View/>
                <Icon style={{flex:0.3}}  size={36} name="settings" color="#4F8EF7" onPress={()=>{
                this.props.navigator.jumpTo(INITIAL_ROUTES[1]);
                }}/>
                <View/>
                <Icon style={{flex:0.3}}  size={36} name="ios-compose" color="#4F8EF7"  onPress={()=>{
                this.props.navigator.jumpTo(INITIAL_ROUTES[2]);
                }}/>
                <View/>

            </View>
        );
    }
});



var JumpingNav = React.createClass({
    getInitialState() {
        return( {
        })
    },
    componentDidMount(){
        BackAndroid.addEventListener('hardwareBackPress', () => {
            if (this._navigator) {
                this._navigator.pop();
                return true;
            }
            return false;
        });
    },
    renderScene: function(route, nav) {
        var response;
        switch (route.id) {
            case 'groups':
                response = (<AllGroupsScene navigator={nav}/>);
                break;
            case 'group':
                response = (<GroupScene data={route.data} navigator={nav}/>);
                break;
            case 'transaction':
                response = (<TransactionScene data={route.data} navigator={nav}/>);
                break;
            default:
                response = (<Text>Default</Text>);
                break;
        }
        return (
            <ScrollView style={styles.scene}>
                {response}
            </ScrollView>
        );
    },
    render: function() {
        return (
            <Navigator
                style={styles.container}
                initialRoute={INITIAL_ROUTES[0]}
                initialRouteStack={INITIAL_ROUTES}
                ref={(navigator) => {
                  this._navigator = navigator;
                }}
                renderScene={this.renderScene}
                configureScene={(route) => {
                    if (route.sceneConfig) {
                        return route.sceneConfig;
                    }
                    return Navigator.SceneConfigs.FloatFromRight;
                }}
                navigationBar={
                    <JumpingNavBar
                    routeStack={INITIAL_ROUTES}
                    />
                }
            />

        );
    }
});

var styles = StyleSheet.create({
    button: {
        backgroundColor: 'white',
        padding: 15,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#CDCDCD'
    },
    buttonText: {
        fontSize: 17,
        fontWeight: '500'
    },
    appContainer: {
        overflow: 'hidden',
        backgroundColor: '#dddddd',
        flex: 1
    },
    messageText: {
        fontSize: 17,
        fontWeight: '500',
        padding: 15,
        marginTop: 50,
        marginLeft: 15
    },
    scene: {
        flex: 1,
        paddingTop: 20,
        backgroundColor: 'white'

    },
    tabs: {
        height: 45,
        backgroundColor: '#EAEAEA',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center'
    }
});

module.exports = JumpingNav;