'use strict';
import React from 'react';
import {View, Text, StyleSheet, Dimensions} from 'react-native';
import {
    MKSpinner,
} from 'react-native-material-kit';
var {width} = Dimensions.get('window');
var Modal   = require('react-native-modalbox');

var LoadingBox = React.createClass({
    getInitialState: function() {
        return {
            isLoading:true
        };
    },
    componentDidMount() {
    },
    finished() {
        this.setState({isLoading:false})
    },
    render(){
        return (
            <Modal
                animationDuration={0}
                backdropOpacity={0.2}
                // backdropElement={}
                backdropPressToClose={false}
                swipeToClose={false}
                isOpen={this.props.isOpen}
                style={styles.modal}
                position={"center"}
                ref={"loadingModal"}
                isLoading={this.state.isLoading}
            >
                <View style={styles.modalHeadLine}>
                    <Text style={styles.headline}>{this.props.headline}</Text>
                </View>
                <View style={styles.modalSpinner}>
                    <MKSpinner style={styles.spinner}/>
                    <Text style={styles.text_field}>{this.props.text}</Text>
                </View>
            </Modal>
        );
    }
});

module.exports = LoadingBox;

var styles = StyleSheet.create({
    modal: {
        height: 150,
        width: width*0.8
    },
    modalHeadLine: {
        margin:5,
        paddingLeft:5
    },
    headline:{
        fontSize: 18,
        marginBottom: 15,
        marginTop: 5
    },
    modalSpinner: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center'
    },
    spinner: {
        width: 70,
        height: 70,
        marginRight: 20
    },
    text_field:{
    }
});