'use strict';
var React = require('react-native');
var {View, Text, StyleSheet, Dimensions} = React;
var {height, width} = Dimensions.get('window');
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
                <View style={styles.modalComponentBox}>
                    <Text style={styles.headline}>{this.props.headline}</Text>
                    <View stlye={styles.modalSpinner}>
                        <MKSpinner style={styles.spinner}/>
                        <Text style={styles.text_field}>{this.props.text}</Text>
                    </View>
                </View>

            </Modal>
        );
    }
});

module.exports = LoadingBox;

var styles = StyleSheet.create({
    modal: {
        justifyContent: 'center',
        alignItems: 'center',
        height: 150,
        width: width*0.8,

    },
    modalComponentBox: {
        margin:10,
        flex:1,

    },
    modalSpinner: {

    },
    spinner: {
        width: 60,
        height: 60
    },
    headline:{
        fontSize: 18,
        marginBottom: 15
    },
    text_field:{

    },
});