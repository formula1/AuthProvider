
var querystring = require("querystring");
var EventEmitter = require("events").EventEmitter;
window.cookieStorage = require("./CookieStore");

var ux = {
 popup: require("./user-experience/popup"),
 redirect: require("./user-experience/redirect")
};

var auth = {
 github: require("./auth-providers/github"),
};

var validauths = {};

function AuthProvider(identity){
  EventEmitter.call(this);
  this.config = validauths;
  this.accessRetriever = accessRetriever;
  this.uri_queue = [];
  this.is_authed = 0;
  Object.defineProperty(this,"isLoggedIn",{
    get:function(){
      return this.is_authed === 1;
    }
  });
  identity = identity?identity:{};
  this.storage = identity.storage||cookieStorage;
  this.identity = identity.identity || "global";
  for(var i in ux){
    ux[i].init.call(this,identity);
  }
  this.asAuthority = this.asAuthority.bind(this);
  setTimeout(this.parseURL.bind(this),1);
}

AuthProvider.prototype = Object.create(EventEmitter.prototype);
AuthProvider.prototype.constructor = AuthProvider;


AuthProvider.init = function(authorities){
  for(var i in authorities){
    if(!(i in auth)) throw new Error(i+" is not currently supported");
    if(!authorities[i].client_id) throw new Error(i+" needs a client id");
    if(!authorities[i].access_retriever) throw new Error(i+" needs an access_token provider");
  }
  validauths = authorities;
};


AuthProvider.prototype.parseURL = function(){
  this.info = this.storage.getItem(this.identity+"_authority");
//  this.access_token = this.storage.getItem(this.identity+"_access_token");
  if(!this.info){
    return this.fail("not expecting to login");
  }
  if(this.info.access_token){
    return this.finish();
  }
  var query = window.location.href;
  var temp = query.indexOf("?");
  if(temp === -1 ){
    return this.fail("no code");
  }
  query = query.substring(temp+1);
  query = querystring.parse(query);
  if(!query.code) return this.fail("no code");
  if(!query.state) return this.fail("no state");
  if(query.state.substring(0,this.identity.length) != this.identity){
    return this.fail("not me");
  }
  if(this.info.state != query.state){
    return this.fail("improper state");
  }
  if(ux[this.info.ux].code){
    ux[this.info.ux].code.call(this,query.code,function(){
      this.getAccess(query.code);
    });
  }
};

AuthProvider.prototype.getAccess = function(code){
  this.is_authed = 0;
  delete this.info.state;
  this[this.info.auth].accessRetriever(code,function(e,access_token){
    if(e){
      this.fail(e);
    }else{
      this.info.access_token = access_token;
      this.storage.setItem(this.identity+"_authority",JSON.stringify(this.info));
      this.finish();
    }
  }.bind(this));
};

AuthProvider.prototype.fail = function(e){
  var fail = function(){
    this.is_authed = -1;
    this.storage.removeItem(this.identity+"_authority");
    this.emit("error",e);
    this.runQueue();
  }.bind(this);
  if(ux[this.info.ux].error){
    return ux[this.info.ux].error.call(this,e,fail);
  }else{
    fail();
  }
};

AuthProvider.prototype.finish = function(){
  this.is_authed = 1;
  this.emit("login",this);
  this.runQueue();
};

AuthProvider.prototype.runQueue = function(){
  var l = this.uri_queue.length;
  while(l--){
    this.asAuthority.apply(void(0),this.uri_queue.shift());
  }
};

AuthProvider.prototype.asAuthority = function(uri,next){
  if(this.is_authed === -1){
    setTimeout(next.bind(next,uri),1);
    return;
  }
  if(this.is_authed === 0){
    this.uri_queue.push([uri,next]);
    return;
  }
  var query = uri.split("?");
  if(query.length === 1 ){
    query.push({});
  }else{
    query[1] = querystring.parse(query[1]);
  }
  query[1].access_token = this.info.access_token;
  query[1] = querystring.stringify(query[1]);
  setTimeout(next.bind(next,query.join("?")),1);
};

AuthProvider.prototype.login = function(authtype, uxtype){
  if(this.isLoggedIn){
    this.logout();
  }
  authtype = authtype||"github";
  uxtype = uxtype||"redirect";

  if(!(authtype in auth)) throw new Error("This auth type is not available");
  if(!(authtype in this.config)) throw new Error("You did not initialize this authtype");
  if(!(uxtype in ux)) throw new Error("This is not an available method for user experience");

  var state = this.identity+Date.now()+"_"+Math.random();
  this.info = {
    state: state,
    auth: authtype,
    ux: uxtype
  };
  this.storage.setItem(this.identity+"_authority", JSON.stringify(this.info));

  var location = auth[authtype].authLocation(
    this.config[authtype].clientid,
    state,
    document.location
  );
  var _this = this;
  ux[uxtype].tryToAuth.call(this,location,function(e,code){
    if(e) return _this.fail(e);
    _this.getAccess(code);
  });
};

AuthProvider.prototype.logout = function(){
  this.storage.removeItem(this.identity+"_authority");
  this.info = void(0);
  this.is_authed = -1;
  this.emit("logout");
};


module.exports = AuthProvider;
