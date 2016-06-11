var betweenus = require("./api/betweenus");

exports.testCombineSharesNotEnoughShares = function(test) {
    /* Test hardcoded data */
    var share_text = "This text is going to be split up and reconstruced using Shamir Secret Sharing",
        share_amount = getRandomInt(15,50),
        share_threshold = getRandomInt(3, share_amount - 1);
    var shares = betweenus.MakeShares(share_text, share_amount, share_threshold, 0);
    var current_shares = [];
    for (var i = 0 ; i < (share_threshold - 1) ; i++) {
        current_shares.push(JSON.parse(shares[i]));
        var result = betweenus.CombineShares(current_shares);
        if (result == share_text) {
            break;
        }
    }
    test.ok(result != share_text, "Resolved secret text with " + (current_shares.length) + " shares, " +
        "while threshold is:" + share_threshold + " and share amount is: " + share_amount);
    test.done();
};

exports.testCombineSharesExactShares = function(test) {
    /* Test hardcoded data */
    var share_text = "This text is going to be split up and reconstruced using Shamir Secret Sharing",
        share_amount = getRandomInt(15,50),
        share_threshold = getRandomInt(3, share_amount - 1);
    var shares = betweenus.MakeShares(share_text, share_amount, share_threshold, 0);
    var current_shares = [];
    for (var i = 0 ; current_shares.length != (share_threshold) ; i++) {
        current_shares.push(JSON.parse(shares[i]));
    }
    var result = betweenus.CombineShares(current_shares);
    test.ok(result == share_text, "Resolved text didn't match the original text.");
    test.done();
};

/*
 exports.testCombineSharesMoreThanEnoughShares = function(test) {

 }
 exports.aaa = function(test) {
 test.expect(1);
 test.ok(true, "this assertion should pass");
 test.done();
 };

 exports.testSomethingElse = function(test) {
 test.ok(false, "this assertion should fail");
 test.done();
 };
 */

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}