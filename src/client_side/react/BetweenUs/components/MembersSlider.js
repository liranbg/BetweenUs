var React = require('react-native');
var Swipeout = require('react-native-swipeout');
var Icon = require('react-native-vector-icons/Ionicons');
var {
    Alert,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
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
    _approveShareButton(member) {
        var request_status = "";
        var request_status_color = "";
        if (member.pending_request) {
            request_status = "Approve";
            request_status_color = "#2ECC71";
            return (
                <TouchableOpacity onPress={()=>{this.props.data.approve_share(member.user_id)}} style={styles.scrollButton}>
                    <Icon style={{borderColor:'black'}} size={28} name="ios-checkmark" color={request_status_color}/>
                    <Text style={{fontSize: 10, fontWeight: 'bold'}}>{request_status}</Text>
                </TouchableOpacity>
            );
        }
    },
    _requestShareButton(member) {
        var request_status = "";
        var request_status_color = "";
        if (member.share_status == "missing") {
            request_status = "Request";
            request_status_color = "#2980B9";
            return (
                <TouchableOpacity onPress={()=>{this.props.data.request_share(member.user_id)}} style={styles.scrollButton}>
                    <Icon style={{borderColor:'black'}} size={28} name="pull-request" color={request_status_color}/>
                    <Text style={{fontSize: 10, fontWeight: 'bold'}}>{request_status}</Text>
                </TouchableOpacity>
            );
        }
        else if (member.share_status == "pending")
        {
            request_status = "Requested";
            request_status_color = "#6D6875";
            return (
                <TouchableOpacity onPress={()=>{}} style={styles.scrollButton}>
                    <Icon style={{borderColor:'black'}} size={28} name="pull-request" color={request_status_color}/>
                    <Text style={{fontSize: 10, fontWeight: 'bold'}}>{request_status}</Text>
                </TouchableOpacity>
            );
        }
    },
    _renderRow: function(value, index) {
        var icon_name, icon_color;
        if (value.share_status == "own_stash") {
            icon_color = '#2ECC71';
            icon_name ="android-checkmark-circle";
        }
        else if (value.share_status == "committed") {
            icon_color = '#2ECC71';
            icon_name = "paper-airplane";
        }
        else if (value.share_status == "missing") {
            icon_color = '#E74C3C';
            icon_name ="minus-circled"
        }
        else if (value.share_status == "pending") {
            icon_color = '#E74C3C';
            icon_name = "load-a"
        }
        return (
            <View style={styles.row} key={index}>
                <View style={{flexDirection: 'row',alignItems: 'center'}}>
                    <View style={styles.shareExistsIcon}>
                         <Icon size={28} name={icon_name} color={icon_color}/>
                    </View>
                    <Text style={{flex: 1}}>{value.email}</Text>
                    <View style={styles.scrollButtons}>
                        {this._approveShareButton(value)}
                        {this._requestShareButton(value)}
                    </View>
                </View>
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
    scrollButtons: {
        flexDirection: 'row',
        height: 45
    },
    scrollButton: {
        flexDirection: 'column',
        backgroundColor: '#EAEAEA',
        alignItems: 'center',
        justifyContent: 'space-around',
        marginRight:10

    },
    shareExistsIcon: {
        height: 45,
        marginLeft:10,
        marginRight:10,
        backgroundColor: '#EAEAEA',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start'
    }
});

module.exports = MemberSlider;