var SessionUtilModule = (function() {

    var InitUserSession = function(session_store, user_email, user_id) {
        session_store.user_session = { email: user_email, user_id: user_id };
    };

    var GetUserId = function(session_store) {
        if (session_store.hasOwnProperty('user_session') && session_store.user_session.hasOwnProperty('user_id')) {
            return session_store.user_session.user_id;
        }
        return null;
    };

    /*** GetUserEmail
     *
     * @param session_store session object, should have 'user_session.email' property in it.
     * @returns email string on success, null on failure.
     */
    var GetUserEmail = function(session_store) {
        /* Make sure session is initialized and has email property. if yes, return the email property, otherwise
         * return false. */
        if (session_store.hasOwnProperty('user_session') && session_store.user_session.hasOwnProperty('email')) {
            return session_store.user_session.email;
        }
        return null;
    };

    exports.InitUserSession = InitUserSession;
    exports.GetUserEmail = GetUserEmail;
    exports.GetUserId = GetUserId;

} (SessionUtilModule || {}));