'use strict';

var React = require('react-native');
var LoginScreen = require("./login.js");
var RegisterScreen = require("./register.js");
var Groups = require("./groups.js");
var {View, Text, StyleSheet,ScrollView} = React;


var TabView = React.createClass({
    getInitialState() {
        return({
            user_info: this.props.user_info
        })
    },
    render(){
        return (
            <View style={styles.container}>
                <Text>{this.props.name}</Text>
                <ScrollView style={{flex: 1}}
                            automaticallyAdjustContentInsets={false}
                            scrollEventThrottle={200}>
                    {this.props.name === "_login" &&
                    <LoginScreen />
                    }
                    {this.props.name === "_register" &&
                    <RegisterScreen />
                    }
                    {this.props.name === "all_groups"  &&
                    <Groups user_info={this.state.user_info}/>
                    }
                    {this.props.name === "show_group"  &&
                    <Text>Group!</Text>
                    }
                </ScrollView>
            </View>
        );
    }
});

var styles = StyleSheet.create({
    container: {
        flex: 1

    }
});

module.exports = TabView;