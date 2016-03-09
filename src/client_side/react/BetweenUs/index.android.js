/**
 * Created by liran on 02/03/2016.
 */
var ErrorBox = require('./components/ErrorBox');
var LoginScene = require('./pages/login');
var RegisterScene = require('./pages/register');
var JumpingNav = require('./components/JumpingNav');

import React, {
    AppRegistry,
    Navigator,
    StyleSheet,
    Text,
    ScrollView,
    View,
    TextInput,
    TouchableHighlight,
    Image,
} from 'react-native'

var NavMenu = React.createClass({
    render() {
        return (
            <ScrollView style={styles.scene}>
                <Text style={styles.messageText}>{this.props.message}</Text>
                <NavButton
                    onPress={() => {
                        this.props.navigator.push({
                          message: 'Swipe right to dismiss',
                          sceneConfig: Navigator.SceneConfigs.FloatFromRight
                        });
                    }}
                    text="Float in from right"
                />
                <NavButton
                    onPress={() => {
            this.props.navigator.push({
              message: 'Swipe down to dismiss',
              sceneConfig: Navigator.SceneConfigs.FloatFromBottom
            });
          }}
                    text="Float in from bottom"
                />
                <NavButton
                    onPress={() => {
            this.props.navigator.pop();
          }}
                    text="Pop"
                />
                <NavButton
                    onPress={() => {
            this.props.navigator.popToTop();
          }}
                    text="Pop to top"
                />
                <NavButton
                    onPress={() => {
            this.props.navigator.push({ id: 'login' });
          }}
                    text="Navbar Example"
                />
            </ScrollView>
        );
    }
});


var BetweenUs = React.createClass({
    renderScene: function(route, nav) {
        switch (route.id) {
            case 'login':
                return <LoginScene navigator={nav} />;
            case 'register':
                return <RegisterScene navigator={nav} />;
            case 'logged_in':
                return <JumpingNav navigator={nav} />;
            default:
                return (
                    <JumpingNav navigator={nav}/>
                );
        }

    },
    render() {
        return (
            <Navigator
                initialRoute={{ id: 'login' }}
                renderScene={this.renderScene}
            />
        )}

});

var styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white'
    },
    messageText: {
        fontSize: 17,
        fontWeight: '500',
        padding: 15,
        marginTop: 50,
        marginLeft: 15
    },
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
    scene: {
        flex: 1,
        paddingTop: 20,
        backgroundColor: '#EAEAEA'
    }
});


AppRegistry.registerComponent('BetweenUs', () => BetweenUs);
