KSLITE = {};
var S = KSLITE;
var INIT = 0, LOADING = 1, LOADED = 2, ERROR = 3, ATTACHED = 4;
var mods = {}, rqmap = {}, spmap = {};
function declare(){
    var i, arg, args = arguments;
    var id, deps, fn, mod;
    for (i = 0; i < args.length; i++) {
        arg = args[i];
        if (typeof arg === "string") {
            id = arg;
        }
        else 
            if (typeof arg === "function") {
                deps = arg;
            }
            else 
                if (arg instanceof Array) {
                    fn = arg;
                }
    }
    if (mods[id] && mods[id].status > INIT) {
        return;
    }
    mod = {
        name: id,
        id: id,
        deps: deps,
        fn: fn,
        status: LOADED
    };
    mods[id] = mod;
}

function provide(modNames, callback){
    attachModes(modNames, function(){
        callback();
    });
}

function attachModes(modNames, callback){
    var i, asyncers = {};
    for (i = 0; i < modNames.length; i++) {
        asyncers[modNames[i]] = {
            f: attachMod,
            a: modNames[i]
        };
    }
    multiAsync(asyncers, callback);
}

function attachMod(modName, callback){
    var mod, requires;
    function attach(mod){
        if (mod.status != ATTACHED) {
            if (mod.fn) {
                //S.log("attach " + mod.name);
                mod.fn(S, S.require(mod.name));
            }
            else {
                //S.log("attach " + mod.name + " without expected attach fn!", "warn");
            }
            mod.status = ATTACHED;
        }
        callback();
    }
    function addRelies(mod){
        var i, modName, reqName, n;//rqmap,spmap
        function reg2Map(modName){
            rqmap[modName] = rqmap[modName] || {};
            spmap[modName] = spmap[modName] || {};
            return modName;
        }
        modName = reg2Map(mod.name);
        for (i = 0; i < mod.requires.length; i++) {
            reqName = reg2Map(mod.requires[i]);
            rqmap[modName][reqName] = 1;
            spmap[reqName][modName] = 1;
            for (n in spmap[modName]) {
                rqmap[n][reqName] = 1;
                spmap[reqName][n] = 1;
            }
        }
    }
    mod = mods[modName];
    if (mod && mod.status !== INIT) {
        requires = mod.requires;
        if (S.iA(requires) && requires.length > 0) {
            addRelies(mod);
            if (rqmap[modName][modName]) {
                throw new Error("Fatal Error,Loop Reqs:" + mod.name);
            }
            S.log(mod.name + " to req: " + requires);
            S._aMs(requires, function(){
                attach(mod);
            });
        }
        else {
            attach(mod);
        }
    }
    else {
        mod = {
            name: modName
        };
        S._lM(mod, function(){
            S._aM(modName, function(){
                attach(mods[modName]);
            });
        });
    }
}

function multiAsync(asyncers, callback){
    var ctx, k, hasAsyncer = false;
    function isAllComplete(){
        var k, ro = {};
        for (k in asyncers) {
            if (!asyncers[k].c) {
                return;
            }
            ro[k] = asyncers[k].r;
        }
        callback(ro);
    }
    for (k in asyncers) {
        hasAsyncer = true;
    }
    if (!hasAsyncer) {
        callback({});
    }
    for (k in asyncers) {
        (function(){
            var ao = asyncers[k];//{context:c,fn:f,args:a,result:r,iscomplete:c}
            ao.f.call((ao.c || this), ao.a, function(data){
                ao.r = data;
                ao.c = true;
                isAllComplete();
            });
        })();
    }
}

S.declare = declare;
exports.multiAsync = multiAsync;
