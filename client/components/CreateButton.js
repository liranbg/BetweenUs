import {StyleSheet} from 'react-native';
import React from 'react';
import ActionButton from 'react-native-action-button';
import Icon from 'react-native-vector-icons/MaterialIcons';


var CreateButton = React.createClass({
    getInitialState: function() {
        return {
            title: "" || this.props.title,
            onPress: undefined || this.props.onPress
        };
    },
    componentWillReceiveProps: function(nextProps) {
        this.setState({
            title: "" || nextProps.title,
            onPress: null || nextProps.onPress
        });
    },
    render() {
        return (
            <ActionButton position="right" buttonColor="rgba(231,76,60,1)">
                <ActionButton.Item buttonColor='#9b59b6' title={this.state.title} onPress={() => {if (this.state.onPress) this.state.onPress()}}>
                    <Icon name="create" style={styles.actionButtonIcon} />
                </ActionButton.Item>
            </ActionButton>
        );
    }
});


module.exports = CreateButton;

var styles = StyleSheet.create({
    actionButtonIcon: {
        fontSize: 20,
        height: 22,
        color: 'white'
    }
});