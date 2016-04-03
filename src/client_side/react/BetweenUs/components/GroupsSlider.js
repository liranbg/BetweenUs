var React = require('react-native');
var Swipeout = require('react-native-swipeout');
var Icon = require('react-native-vector-icons/Ionicons');
var {
    Alert,
    StyleSheet,
    ScrollView,
    View,
    Text,
} = React;

var MemberSlider = React.createClass({
    getInitialState: function() {
        return {
            values: this.props.data.members_list
        };
    },
    componentWillReceiveProps: function(nextProps) {
        this.setState({
            values: nextProps.data.members_list
        });
    },
    _buttonRequestShare: function(requester) {
        return {
            // text: 'request',
            backgroundColor: '',
            component: (
                <View style={styles.scrollButton}>
                    <Icon style={{borderColor:'black'}} size={28} name="pull-request" color="#2980B9"/>
                    <Text style={{fontSize: 10}}>Request</Text>
                </View>
            ),
            onPress: ()=>{
                this.props.data.request_share(requester);
            }
        }
    },
    _renderRow: function(value, index) {
        var icon_name, icon_color;
        if (value.share) {
            icon_color= '#2ECC71';
            icon_name="android-checkmark-circle";
        }
        else {
            icon_color= '#E74C3C';
            icon_name="minus-circled"
        }
        return (
            <View style={styles.row} key={index}>
                <Swipeout autoClose={true} right={[this._buttonRequestShare(value.user_id)]} backgroundColor={'#EAEAEA'}>
                    <View style={{flexDirection: 'row',alignItems: 'center'}}>
                        <View style={styles.shareExistsIcon}>
                            <Icon size={28} name={icon_name} color={icon_color}/>
                        </View>
                        <Text>{value.email}</Text>
                    </View>
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

module.exports = MemberSlider;