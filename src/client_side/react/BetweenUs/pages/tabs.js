'use strict';

var React = require('react-native');
var LoginScreen = require("./login.js");
var RegisterScreen = require("./register.js");
var Groups = require("./groups.js");

var GLOBAL = require('../env');
var {View, Text, StyleSheet,ScrollView} = React;

//{this.props.name === "_profile" &&
//<Button onPress={Actions.pop}>{console.log(this.props)} asd</Button>
//}
//{this.props.name === "groups" &&
//<Button onPress={Actions.tab2_2}>next screen for tab2_1</Button>
//}
//<Button onPress={Actions.pop}>Back</Button>
//<Button onPress={Actions.tab1}>Switch to tab1</Button>
//<Button onPress={Actions.tab2}>Switch to tab2</Button>
//<Button onPress={Actions.tab3}>Switch to tab3</Button>
//<Button onPress={Actions.tab4}>Switch to tab4</Button>
//<Button onPress={Actions.tab5}>Switch to tab5</Button>
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