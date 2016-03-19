const
    express = require('express'),
    session = require('express-session'),
    body_parser = require('body-parser'),
    logger = require('morgan'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    cors = require('cors'),
    database_interface = require('./cloudant_interaction'),
    users = require('./routes/users'),
    groups = require('./routes/groups'),
    transactions = require('./routes/transactions'),
    notifications = require('./routes/notifications');


var app = express();

app.use(logger('dev'));

app.use(cors({credentials: true, origin: true}));

// Initialize Session */

app.use(session({secret: 'ArbitraryStringToUseAsSession', resave: true, saveUninitialized: true}));


app.use(body_parser.json());
app.use(body_parser.urlencoded({extended: false}));

app.use(cookieParser());

app.use('/users', users);
app.use('/groups', groups);
app.use('/transactions', transactions);
app.use('/notifications', notifications);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500).json({
            success: false,
            error: err.message
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500).json({
        success: false,
        error: err.message
    });
});

var server = app.listen(3000, function () {
    var host = "localhost";
    var port = server.address().port;
    console.log('BetweenUs is up & listening at http://%s:%s', host, port);
});


module.exports = app;