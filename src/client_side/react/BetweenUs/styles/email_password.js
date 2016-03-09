import React, { StyleSheet } from 'react-native'


var styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
        //marginBottom: 15
    },
    button: {
        flex:0.3,
        height:45,
        margin: 10,
        justifyContent: 'center',
        alignItems: 'center'
    },
    loginButtonBackground: {
        flex: 1,
        height: 40
    },
    loginButtonLabel: {
        color: 'white'
    }
});

module.exports = styles;