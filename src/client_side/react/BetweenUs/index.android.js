/**
 * Created by liran on 02/03/2016.
 */
var LoginScene = require('./pages/login');
var RegisterScene = require('./pages/register');
var JumpingNav = require('./components/JumpingNav');
import React, {
    AppRegistry,
    Navigator,
    StyleSheet
} from 'react-native'


var BetweenUs = React.createClass({
    renderScene: function(route, nav) {
        switch (route.id) {
            case 'login':
                return <LoginScene navigator={nav} />;
            case 'register':
                return <RegisterScene navigator={nav} />;
            case 'logged_in':
                return <JumpingNav navigator={nav} user_info={route.data}/>;
            default:
                return (
                    <JumpingNav navigator={nav}/>
                );
        }
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
