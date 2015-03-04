
var querystring = require("querystring");
var EventEmitter = require("events").EventEmitter;
window.cookieStorage = require("./CookieStore");

function AuthProvider(client_id,accessRetriever,options){
  EventEmitter.call(this);
  this.client_id = client_id;
  this.accessRetriever = accessRetriever;
  this.uri_queue = [];
  this.is_authed = 0;
  Object.defineProperty(this,"isLoggedIn",{
    get:function(){
      return this.is_authed === 1;
    }
  });
  options = options?options:{};
  this.storage = options.storage||cookieStorage;
  this.identity = options.identity || "global";
  this.origin = options.origin || window.location.host;

  this.asAuthority = this.asAuthority.bind(this);
  setTimeout(this.parseURL.bind(this),1);
}

AuthProvider.prototype = Object.create(EventEmitter.prototype);
AuthProvider.prototype.constructor = AuthProvider;

AuthProvider.prototype.parseURL = function(){
  this.access_token = this.storage.getItem(this.identity+"_access_token");
  if(this.access_token){
    this.is_authed = 1;
    this.runQueue();
    return;
  }
  var query = window.location.href;
  var temp = query.indexOf("?");
  if(temp === -1 ){
    this.fail("no code");
    return;
  }
  query = query.substring(temp+1);
  query = querystring.parse(query);
  if(!query.code) return this.fail("no code");
  if(!query.state) return this.fail("no state");
  if(query.state.substring(0,this.identity.length) != this.identity){
    return this.fail("not me");
  }
  if(this.storage.getItem(this.identity+"_state") != query.state){
    return this.fail("improper state");
  }
  if(window.opener){
    try{
      window.opener.postMessage(query.code,this.origin);
    }catch(e){
      console.log("window probably doesn't exist anymore");
    }
    window.close();
    return;
  }
  this.getAccess(query.code);
};

AuthProvider.prototype.fail = function(e){
  this.is_authed = -1;
  if(window.opener){
    try{
      window.opener.postMessage("failure-"+e,this.origin);
    }catch(err){
      console.log("window probably doesn't exist anymore");
    }
    window.close();
  }
  this.emit("parse-error",e);
  this.runQueue();
};

AuthProvider.prototype.getAccess = function(code){
  this.is_authed = 0;
  this.storage.removeItem(this.identity+"_state");
  this.accessRetriever(code,function(e,access_token){
    if(e){
      this.is_authed = -1;
      return this.emit("access-error", e);
    }else{
      this.access_token = access_token;
      this.storage.setItem(this.identity+"_access_token",access_token);
      is_authed = 1;
      this.emit("access-success",this);
    }
    this.runQueue();
  }.bind(this));
};

AuthProvider.prototype.runQueue = function(){
  var l = this.uri_queue.length;
  while(l--){
    this.asAuthority.apply(void(0),this.uri_queue.shift());
  }
};

AuthProvider.prototype.asAuthority = function(uri,next){
  if(this.is_authed === -1) return next(uri);
  if(this.is_authed === 0) return this.uri_queue.push([uri,next]);
  var query = uri.split("?");
  if(query.length === 1 ){
    query.push({});
  }else{
    query[1] = querystring.parse(query[1]);
  }
  query[1].access_token = this.access_token;
  query[1] = querystring.stringify(query[1]);
  next(query.join("?"));
};

AuthProvider.prototype.logout = function(){
  this.storage.removeItem(this.identity+"_access_token");
  this.access_token = void(0);
  this.is_authed = -1;
};

AuthProvider.prototype.login = function(type){
  type = type||"redirect";
  var state = this.identity+Date.now()+"_"+Math.random();
  this.storage.setItem(this.identity+"_state", state);
  var location = "https://github.com/login/oauth/authorize" +
    "?client_id="+config.cid +
    "&state="+state +
    "&redirect_uri="+document.location;

  if(type == "redirect"){
    window.location.href = location;
    return;
  }
  if(type == "popup"){
    this.is_authed = 0;
    var popup = window.open(location);
    popup.addEventListener("message", function(event){
      if(event.origin != this.origin) return;
      if(event.data.substring(0,7) == "failure"){
        this.is_authed = -1;
        return;
      }
      this.getAccess(event.data);
    }, false);
    return;
  }
};

module.exports = AuthProvider;
