var React = require('react-native');
var Swipeout = require('react-native-swipeout');
var Icon = require('react-native-vector-icons/Ionicons');
var {
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    View,
    Text,
} = React;

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
    _buttonTransaction: function() {
        return {
            backgroundColor: '',
            component: (
                <View style={styles.scrollButton}>
                    <Icon style={{borderColor:'black'}} size={28} name="pull-request" color="#2980B9"/>
                    <Text style={{fontSize: 10}}>Settings</Text>
                </View>
            ),
            onPress: null
        }
    },
    _renderRow: function(value, index) {
        return (
            <View style={styles.row} key={index}>
                <Swipeout autoClose={true} right={[this._buttonTransaction()]} backgroundColor={'#EAEAEA'}>
                    <TouchableOpacity onPress={()=>this.props.data.fetchTransactionThenShow(value.transaction_id)}>
                        <View style={{flexDirection: 'row',alignItems: 'center'}}>
                            <View style={styles.shareExistsIcon}>
                                <Icon size={28} name='social-freebsd-devil' color='#2980B9'/>
                            </View>
                            <View style={{flexDirection: 'column'}}>
                                <View>
                                    <Text style={{fontSize: 20}}>{value.transaction_name}</Text>
                                </View>
                                <View style={{flexDirection: 'row'}}>
                                    <Text style={{fontSize: 11}}>Threshold: {value.threshold} ,</Text>
                                    <View style={{marginRight: 3}}/>
                                    <Text style={{fontSize: 11}}>Last updated: 1/1/2007</Text>
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                </Swipeout>
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
        borderColor: '#d6d7da',
        borderWidth: 2,
        flex: 1,
        height: 50,
        marginTop: 2,
        marginBottom: 2,
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