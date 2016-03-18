var ErrorUtilModule = (function() {

    var error_db = {
        not_logged_in: {
            http_code: 401,
            message: "You are not allowed to perform this action. try logging in first."
        },
        request_missing_parameters: {
            http_code: 404,
            message: "Request has missing paramters."
        }
    }
    /***
     *
     * @param res
     * @returns {password|any|boolean}
     * @constructor
     */
    var ReturnPrivilegeError = function(res) {
        res.status(error_db.not_logged_in.http_code).json({success: false, message: error_db.not_logged_in.message});
    };

    /***
     *
     * @param res
     * @constructor
     */
    var ReturnRequestMissingParamteres = function(res) {
        res.status(error_db.request_missing_parameters.http_code).json({success: false, message: error_db.request_missing_parameters.message});
    }
    exports.ReturnNotLoggedInError = ReturnPrivilegeError;
    exports.ReturnRequestMissingParamteres = ReturnRequestMissingParamteres;
} (ErrorUtilModule || {}));