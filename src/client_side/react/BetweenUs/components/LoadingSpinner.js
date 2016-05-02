'use strict';
var React = require('react-native');
var {Text, StyleSheet} = React;
var Modal   = require('react-native-modalbox');
import {
    MKSpinner,
} from 'react-native-material-kit';


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
                animationDuration={400}
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
                <MKSpinner style={styles.spinner}/>
                <Text style={styles.text_field}>{this.props.text}</Text>
            </Modal>
        );
    }
});

module.exports = LoadingBox;

var styles = StyleSheet.create({
    modal: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.8)',
        height: 150,
        width: 150
    },
    spinner: {
        width: 90,
        height: 90
    },
    text_field:{
    },
    background: {
        flex: 1,
        justifyContent: 'center'
    }
});