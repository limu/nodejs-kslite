var kslite = require("../src/kslite");
var util = require("util");
KSLITE.declare("test", [], function(){});
console.log("-------------KSLITE-------------");
console.log(util.inspect(KSLITE, false, null));
console.log("-------------kslite-------------");
console.log(util.inspect(kslite, false, null));
