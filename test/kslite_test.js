var kslite = require("../src/kslite");
var util = require("util");
KSLITE.declare("test", [], function(require, exports, exportsParent){
    exports.test = true;
});
console.log("-------------KSLITE-------------");
console.log(util.inspect(KSLITE, false, null));
console.log("-------------KSLITE-------------");
console.log("-------------kslite-------------");
console.log(util.inspect(kslite, false, null));
console.log("-------------kslite-------------");
console.log("-------------test begin-------------");
KSLITE.provide(['test'], function(require){
    var test = require("test");
    console.log(test.test);
});
