import {Dimensions, View, Text, StyleSheet, ListView} from "react-native";
import React from 'react';
var MK = require('react-native-material-kit');
const { MKButton } = MK;
var Modal   = require('react-native-modalbox');
var deviceWidth = Dimensions.get('window').width;

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

var Groups = React.createClass({
    getInitialState() {
        return ( {
            is_show_key_modal_open:false,
            show_key_text:""
        })
    },
    componentDidMount: function() {

    },
    render(){
        let private_key;
        let public_key;
        if ((this.props.user_info.private_key)&& (public_key = this.props.user_info.public_key)){
            private_key = this.props.user_info.private_key.replaceAll("\n","");
            public_key = this.props.user_info.public_key.replaceAll("\n","");
        }
        return (
            <View style={styles.container}>
                <Text style={{justifyContent: 'center',  textAlign:'center', fontWeight:'bold', margin: 10, fontSize: 36}}>Settings</Text>
                <Text>Username: {this.props.user_info.user_email}</Text>
                <View style={{flexDirection:'row'}}>
                    <Text>Private key is {private_key === undefined? "not loaded":"loaded"} </Text>
                    <MKButton
                        shadowRadius={2}
                        shadowOffset={{width:0, height:2}}
                        shadowOpacity={.7}
                        shadowColor="black"
                        onPress={()=>{
                        this.setState({show_key_text:private_key, is_show_key_modal_open:!this.state.is_show_key_modal_open});
                        this.refs.show_key_modal.open();
                        }}>
                        {(private_key !== undefined)? <Text pointerEvents="none">(Click to see)</Text>:<View/>}
                    </MKButton>
                </View>
                <View style={{flexDirection:'row'}}>
                    <Text>Public key is {private_key === undefined? "not loaded":"loaded"} </Text>
                    <MKButton
                        shadowRadius={2}
                        shadowOffset={{width:0, height:2}}
                        shadowOpacity={.7}
                        shadowColor="black"
                        onPress={()=>{
                        this.setState({show_key_text:public_key, is_show_key_modal_open:!this.state.is_show_key_modal_open});
                        this.refs.show_key_modal.open();
                        }}>
                        {(public_key !== undefined)? <Text pointerEvents="none">(Click to see)</Text>:<View/>}
                    </MKButton>
                </View>
                <Modal backdrop={true} style={styles.modal_key_style} position={"center"} ref={"show_key_modal"} isOpen={this.state.is_show_key_modal_open}>
                    <View style={{alignItems: 'center'}}>
                    <MKButton
                        shadowRadius={2}
                        shadowOffset={{width:0, height:2}}
                        shadowOpacity={.7}
                        shadowColor="black"
                        onPress={()=>this.setState({is_show_key_modal_open:!this.state.is_show_key_modal_open})}>
                        <Text pointerEvents="none"
                              style={{color: '#0079FE', fontWeight: 'bold'}}>
                            Click to close
                        </Text>
                    </MKButton>
                    </View>
                    <Text>{this.state.show_key_text}</Text>
                </Modal>
            </View>
        );
    }
});

var styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    modal_key_style: {
        width: deviceWidth*0.8,
        height:300
    }

});

module.exports = Groups;
