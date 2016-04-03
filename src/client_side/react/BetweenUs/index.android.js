/**
 * Created by liran on 02/03/2016.
 */
var LoginScene = require('./pages/login');
var RegisterScene = require('./pages/register');
var JumpingNav = require('./components/JumpingNav');
import React, {
    AppRegistry,
    Navigator
} from 'react-native'


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


AppRegistry.registerComponent('BetweenUs', () => BetweenUs);
