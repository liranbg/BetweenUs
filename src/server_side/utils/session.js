var SessionUtilModule = (function() {

    var InitUserSession = function(session_store, user_email, user_id) {
        session_store.user_session = { email: user_email, user_id: user_id };
    };

    var GetUserId = function(session_store) {
        return session_store.user_session.user_id;
    };

    exports.InitUserSession = InitUserSession;
    exports.GetUserId = GetUserId;

} (SessionUtilModule || {}));