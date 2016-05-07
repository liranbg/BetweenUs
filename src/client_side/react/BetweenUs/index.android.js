/**
 * Created by liran on 02/03/2016.
 */
var LoginScene = require('./pages/login');
var RegisterScene = require('./pages/register');
var JumpingNav = require('./components/JumpingNav');
import React, { Component } from 'react';
import {
    View,
    AppRegistry,
    Navigator,
    StyleSheet
} from 'react-native'


var BetweenUs = React.createClass({
    renderScene: function(route, nav) {
        var response;

        switch (route.id) {
            case 'login':
                response = <LoginScene navigator={nav} user_info={route.user_info}/>;
                break;
            case 'register':
                response = <RegisterScene navigator={nav} />;
                break;
            case 'logged_in':
                response = <JumpingNav navigator={nav} user_info={route.data}/>;
                break;
            default:
                response = <JumpingNav navigator={nav}/>;
        }
        return(
            <View style={styles.scene}>
                {response}
            </View>
        )
    },
    render() {
        return (
            <Navigator
                style={styles.scene}
                initialRoute={{ id: 'login' }}
                renderScene={this.renderScene}
            />
        )}

});
var styles = StyleSheet.create({
    scene: {
        flex: 1,
        backgroundColor: 'white'

    }
});

AppRegistry.registerComponent('BetweenUs', () => BetweenUs);
