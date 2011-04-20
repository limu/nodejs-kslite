KSLITE = {};
var util = require("util");
var INIT = 0, LOADING = 1, LOADED = 2, ERROR = 3, ATTACHED = 4;
var mods = {}, rqmap = {}, spmap = {}, modExports = {};
var Config = {
    debug: true
};
function declare(){
    var i, arg, args = arguments;
    var id, deps, fn, mod;
    for (i = 0; i < args.length; i++) {
        arg = args[i];
        if (isString(arg)) {
            id = arg;
        }
        else 
            if (isFunction(arg)) {
                fn = arg;
            }
            else 
                if (isArray(arg)) {
                    deps = arg;
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
    attachMods(modNames, function(){
        callback(ksRequire);
    });
}

function ksRequireParent(names){
    var i, namesArr = names.split("-"), o = modExports;
    for (i = 0; i < namesArr.length; i++) {
        o[namesArr[i]] = o[namesArr[i]] || {};
        o = o[namesArr[i]];
    }
    return o;
}

function ksRequire(modName){
    var modRoot = ksRequireParent(modName);
    modRoot.exports = modRoot.exports || {};
    return modRoot.exports;
}

function attachMods(modNames, callback){
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
    var mod = mods[modName], deps;
    function _attach(mod){
        if (mod.status != ATTACHED) {
            if (mod.fn) {
                log("attach " + mod.name);
                mod.fn(ksRequire, ksRequire(mod.name), ksRequireParent(mod.name));
            }
            else {
                log("attach " + mod.name + " without expected attach fn!", "warn");
            }
            mod.status = ATTACHED;
        }
        callback();
    }
    function _addRelies(mod){
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
    if (mod && mod.status !== INIT) {
        deps = mod.deps;
        if (isArray(deps) && deps.length > 0) {
            _addRelies(mod);
            if (rqmap[modName][modName]) {
                throw new Error("Fatal Error,Loop Reqs:" + mod.name);
            }
            log(mod.name + " to req: " + requires);
            attachMods(deps, function(){
                _attach(mod);
            });
        }
        else {
            _attach(mod);
        }
    }
    else {
        loadMod(modName, function(){
            attachMod(modName, function(){
                _attach(mods[modName]);
            });
        });
    }
}

function loadMod(modName, callback){
    var path = getModPath(modName);
    require(path);
    callback();
}

function getModPath(modName){
    var path = modeName.split("-").join("/");
    return path;
}

//exports object 
//"path", "log", "getScript", "substitute",
//"clone", "mix", "multiAsync", "extend", 
//"iA", "iF", "iPO", "iS"
function path(s, callback){
    log("There isn't 'path' implement yet,callback directly");//todo
    callback();
}

function log(msg, cat, src){
    if (Config.debug) {
        console[cat && console[cat] ? cat : 'log'](">>>>>>>>" + msg);
    }
}

function getScript(url, success, charset, expando){
    log("There isn't 'getScript' implement yet,callback directly");//todo
    success();
}

function substitute(str, o, regexp, multiSubstitute){
    if (!isString(str) || !isPlainObject(o)) {
        return str;
    }
    return str.replace(regexp || (/\\?\{([^{}]+)\}/g), function(match, name){
        if (match.charAt(0) === '\\') {
            return match.slice(1);
        }
        return (o[name] !== undefined) ? o[name] : (multiSubstitute ? match : "");
    });
}

function isString(s){
    return (typeof(s) === "string");
}

function isArray(a){
    return (a instanceof Array);
}

function isFunction(a){
    return (typeof(a) === "function");
}

function isPlainObject(o){
    return (typeof(o) === "object");
}

function mix(r, s, ov, wl){
    if (!s || !r) {
        return r;
    }
    if (ov === undefined) {
        ov = true;
    }
    var i, p, l;
    if (wl && (l = wl.length)) {
        for (i = 0; i < l; i++) {
            p = wl[i];
            if (p in s) {
                if (ov || !(p in r)) {
                    r[p] = s[p];
                }
            }
        }
    }
    else {
        for (p in s) {
            if (ov || !(p in r)) {
                r[p] = s[p];
            }
        }
    }
    return r;
}

function extend(r, s, px, sx){
    if (!s || !r) {
        return r;
    }
    var OP = Object.prototype, _O = function(o){
        function __F(){
        }
        __F.prototype = o;
        return new __F();
    }, sp = s.prototype, rp = _O(sp);
    r.prototype = rp;
    rp.constructor = r;
    r.superclass = sp;
    if (s !== Object && sp.constructor === OP.constructor) {
        sp.constructor = s;
    }
    if (px) {
        mix(rp, px);
    }
    if (sx) {
        mix(r, sx);
    }
    return r;
}

function clone(o){
    var ret = o, b, k;
    if (o && ((b = isArray(o)) || isPlainObject(o))) {
        ret = b ? [] : {};
        for (k in o) {
            if (o.hasOwnProperty(k)) {
                ret[k] = clone(o[k]);
            }
        }
    }
    return ret;
}

function multiAsync(asyncers, callback){
    var ctx, k, hasAsyncer = false;
    function _isAllComplete(){
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
                _isAllComplete();
            });
        })();
    }
}

//main
function _init(){
    mix(KSLITE, {
        declare: declare,
        provide: provide
    });
    mix(exports, {
        multiAsync: multiAsync,
        iA: isArray,
        iS: isString,
        iF: isFunction,
        iPO: isPlainObject,
        mix: mix,
        extend: extend,
        clone: clone,
        substitute: substitute,
        log: log,
        getScript: getScript,
        path: path
    });
}

_init();
