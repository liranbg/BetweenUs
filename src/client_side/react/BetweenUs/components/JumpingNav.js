'use strict';
var Icon = require('react-native-vector-icons/Ionicons');
var AllGroupsScene = require('../pages/groups');
var GroupScene = require("../pages/group");
var TransactionScene = require("../pages/transaction");
//var GroupScene = require('../pages/group');
import React, {
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

var {height, width} = Dimensions.get('window');

var INITIAL_ROUTES = [
    {id: 'groups'},
    {id: 'transaction'},
    {id: 'group'},
    {id: 'notification'}
];

var JumpingNavBar = React.createClass({
    render() {
        var jump_to;
        var currentRoutes = this.props.navigator.getCurrentRoutes();
        return (
            <View style={styles.tabs}>
                <Icon style={{ borderColor:'black'}} size={36} name="ios-people" color="#4F8EF7"  onPress={()=>
                {
                for (var route_key in currentRoutes) {
                    if (currentRoutes[route_key].id == "groups") {
                    this.props.navigator.jumpTo(currentRoutes[route_key]);
                    return;
                    }
                }
                this.props.navigator.push({id:'groups'});
                }}/>
                <Icon style={{}}  size={36} name="android-notifications-none" color="#4F8EF7" onPress={()=>{
                for (var route_key in currentRoutes) {
                    if (currentRoutes[route_key].id == "notification") {
                    this.props.navigator.jumpTo(currentRoutes[route_key]);
                    return;
                    }
                }
                this.props.navigator.push({id:'notification'});
                }}/>
                <Icon style={{}}  size={36} name="android-notifications" color="#4F8EF7"  onPress={()=>{
                for (var route_key in currentRoutes) {
                    if (currentRoutes[route_key].id == "group") {
                    this.props.navigator.jumpTo(currentRoutes[route_key]);
                    return;
                    }
                }
                this.props.navigator.push({id:'group'});
                }}/>
            </View>
        );
    }
});

var JumpingNav = React.createClass({
    getInitialState() {
        return ({});
    },
    componentDidMount(){
        this.setState(this.props.user_info);
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
                response = (<AllGroupsScene navigator={nav} user_info={this.props.user_info}/>);
                break;
            case 'group':
                response = (<GroupScene data={route.data} user_info={this.props.user_info} navigator={nav}/>);
                break;
            case 'transaction':
                response = (<TransactionScene data={route.data} user_info={this.props.user_info} navigator={nav}/>);
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
                navigationBar={<JumpingNavBar
                 onTabIndex={(index) => {
                  this._navigator.jumpTo(ROUTE_STACK[index]);
                }}
                routeStack={INITIAL_ROUTES} />}
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