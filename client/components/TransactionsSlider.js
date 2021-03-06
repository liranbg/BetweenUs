var React = require('react');
import {TouchableOpacity, StyleSheet, ScrollView, View, Text} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

var TransactionsSlider = React.createClass({
    getInitialState: function() {
        return {
            values: this.props.data.transaction_list
        };
    },
    componentWillReceiveProps: function(nextProps) {
        this.setState({
            values: nextProps.data.transaction_list
        });
    },
    _renderRow: function(value, index) {
        return (
            <View style={styles.row} key={index}>
                <TouchableOpacity onPress={()=>this.props.data.fetchTransactionThenShow(value.transaction_id)}>
                <View style={{flexDirection: 'row',alignItems: 'center'}}>
                    <View style={styles.shareExistsIcon}>
                        <Icon size={28} name='label' color='#2980B9'/>
                    </View>
                    <View style={styles.scrollButtons} style={{flexDirection: 'column'}}>
                        <View>
                            <Text style={{fontSize: 20}}>{value.transaction_name}</Text>
                        </View>
                        <View style={{flexDirection: 'row'}}>
                            <Text style={{fontSize: 11}}>Threshold: {value.threshold}</Text>
                        </View>
                    </View>
                </View>
                </TouchableOpacity>
            </View>
        )
    },
    render: function() {
        return (
            <View style={styles.container}>
                <ScrollView style={styles.outerScroll}>
                    {this.state.values.map(this._renderRow, this)}
                </ScrollView>
            </View>
        );
    }
});
var styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column'
    },
    outerScroll: {
        flex: 1,
        flexDirection: 'column'
    },
    row: {
        backgroundColor: '#EAEAEA',
        borderColor: '#d6d7da',
        borderWidth: 2,
        flex: 1,
        height: 50,
        marginTop: 2,
        marginBottom: 2
    },
    scrollButton: {
        height: 45,
        flexDirection: 'column',
        backgroundColor: '#EAEAEA',
        alignItems: 'center',
        justifyContent: 'center'
    },
    shareExistsIcon: {
        height: 45,
        marginRight:10,
        backgroundColor: '#EAEAEA',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start'
    }
});

module.exports = TransactionsSlider;