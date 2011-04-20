var kslite = require("../src/kslite");
var util = require("util");
console.log("-------------KSLITE-------------");
console.log(util.inspect(KSLITE, false, null));
console.log("-------------KSLITE-------------");
console.log("-------------kslite-------------");
console.log(util.inspect(kslite, false, null));
console.log("-------------kslite-------------");
console.log("-------------test begin-------------");
KSLITE.provide(['test_mod-1'], function(require){
    var mod = require("test_mod-1");
    console.log(mod.modname);
});
