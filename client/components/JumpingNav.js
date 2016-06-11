'use strict';
import Icon from 'react-native-vector-icons/MaterialIcons';
var AllGroupsScene = require('../pages/groups');
var GroupScene = require("../pages/group");
var TransactionScene = require("../pages/transaction");
var GroupCreation = require("../pages/create_group");
var TransactionCreation = require("../pages/create_transaction");
var Settings = require("../pages/settings");
import React from 'react';
import {
    BackAndroid,
    Navigator,
    StyleSheet,
    ScrollView,
    Text,
    ToolbarAndroid,
    TouchableHighlight,
    View,
    Dimensions
} from "react-native";

var INITIAL_ROUTES = [
    {id: 'groups'},
    {id: 'transaction'},
    {id: 'group'},
    {id: 'notification'},
    {id: 'create_group'},
    {id: 'create_transaction'}
];

var JumpingNavBar = React.createClass({
    render() {
        var currentRoutes = this.props.navigator.getCurrentRoutes();
        return (
            <View style={styles.tabs}>
                <Icon style={{ borderColor:'black'}} size={36} name="group" color="#4F8EF7"  onPress={()=>
                {
                for (var route_key in currentRoutes) {
                    if (currentRoutes[route_key].id == "groups") {
                    this.props.navigator.jumpTo(currentRoutes[route_key]);
                    return;
                    }
                }
                this.props.navigator.push({id:'groups'});
                }}/>
                <Icon style={{ borderColor:'black'}} size={36} name="settings" color="#4F8EF7"  onPress={()=>
                {
                for (var route_key in currentRoutes) {
                    if (currentRoutes[route_key].id == "settings") {
                    this.props.navigator.jumpTo(currentRoutes[route_key]);
                    return;
                    }
                }
                this.props.navigator.push({id:'settings'});
                }}/>

            </View>
        );
    }
});

var JumpingNav = React.createClass({
    getInitialState() {
        return ({
        });
    },
    componentDidMount(){
        this.setState(this.props.user_info);
        BackAndroid.addEventListener('hardwareBackPress', () => {
            if (this._navigator.getCurrentRoutes().length > 1) {
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
                response = (<AllGroupsScene user_info={this.props.user_info} navigator={nav}/>);
                break;
            case 'settings':
                response = (<Settings data={route.data} user_info={this.props.user_info} navigator={nav}/>);
                break;
            case 'group':
                response = (<GroupScene data={route.data} user_info={this.props.user_info} navigator={nav}/>);
                break;
            case 'transaction':
                response = (<TransactionScene data={route.data} user_info={this.props.user_info} navigator={nav}/>);
                break;
            case 'create_group':
                response = (<GroupCreation data={route.data} user_info={this.props.user_info} navigator={nav}/>);
                break;
            case 'create_transaction':
                response = (<TransactionCreation data={route.data} user_info={this.props.user_info} navigator={nav}/>);
                break;
            default:
                response = (<Text>Default</Text>);
                break;
        }
        return (
            <View style={styles.scene}>
                {response}
            </View>
        );
    },
    render: function() {
        return (
            <Navigator
                style={styles.scene}
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
                navigationBar={<JumpingNavBar routeStack={INITIAL_ROUTES}/>}
            />

        );
    }
});

var styles = StyleSheet.create({
    scene: {
        flex: 1,

        // paddingTop: 20,
        backgroundColor: 'white',

    },
    tabs: {
        height: 45,
        backgroundColor: '#EAEAEA',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around'

    }
});

module.exports = JumpingNav;