var Promise = require('bluebird');

module.exports = function(condition, action) {
    var resolver = Promise.defer();

    var loop = function() {
        if (!condition()) return resolver.resolve();
        return Promise.resolve(action())
            .then(loop)
            .catch(function (e) {
                resolver.reject(e);
            });
    };
    setImmediate(loop);
    return resolver.promise;
};