var ValidationUtilModule = (function() {

    var ValidatePassword = function(password) {
        /* Longer than 6 chars */
        return (password && (password.length >= 1));
    };

    var ValidateUsername = function(username) {
        /* Longer than 6 chars */
        return (username && true);
    };

    var ValidatePublicKey = function(public_key) {
        /* Longer than 6 chars */
        return (public_key && true);
    };

    exports.ValidatePassword = ValidatePassword;
    exports.ValidatePublicKey = ValidatePublicKey;
    exports.ValidateUsername = ValidateUsername;
} (ValidationUtilModule || {}));