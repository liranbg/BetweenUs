'use strict';

import React, {StyleSheet} from 'react-native';
import ActionButton from 'react-native-action-button';
import Icon from 'react-native-vector-icons/Ionicons';


var CreateGroupButton = React.createClass({
    render() {
        return (
            <ActionButton position="right" buttonColor="rgba(231,76,60,1)">
                <ActionButton.Item buttonColor='#9b59b6' title="Create Transaction" onPress={() => console.warn("notes tapped!")}>
                    <Icon name="android-create" style={styles.actionButtonIcon} />
                </ActionButton.Item>
            </ActionButton>
        );
    }
});


module.exports = CreateGroupButton;

var styles = StyleSheet.create({
    actionButtonIcon: {
        fontSize: 20,
        height: 22,
        color: 'white'
    }
});