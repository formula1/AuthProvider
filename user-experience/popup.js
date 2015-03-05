

var popupSizes = function(){
  var dim = {};
  var documentElement = document.documentElement;
  // Multi Screen Popup Positioning (http://stackoverflow.com/a/16861050)
  // Credit: http://www.xtf.dk/2011/08/center-new-popup-window-even-on.html
  // Fixes dual-screen position Most browsers Firefox
  var dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : screen.left;
  var dualScreenTop = window.screenTop !== undefined ? window.screenTop : screen.top;
  dim.width = window.innerWidth || documentElement.clientWidth || screen.width;
  dim.height = window.innerHeight || documentElement.clientHeight || screen.height;
  dim.left = ((dim.width - windowWidth) / 2) + dualScreenLeft;
  dim.top = ((dim.height - windowHeight) / 2) + dualScreenTop;
  return dim;
};


module.exports = {
  initialize: function(identity){
    this.origin = identity.origin || window.location.host;
  },
  error: function(err,next){
    if(!window.opener) return next();
    try{
      window.opener.postMessage("failure"+err,this.origin);
    }catch(e){
      console.log("window probably doesn't exist anymore");
    }
    window.close();
  },
  code: function(code,next){
    try{
      window.opener.postMessage(query.code,this.origin);
    }catch(e){
      console.log("window probably doesn't exist anymore");
    }
    window.close();
  },
  tryToAuth: function(uri,next){
    this.is_authed = 0;
    var dim = popupSizes();
    var popup = window.open(
      location,
      "_blank",
      "resizeable=true"+
      ",height=" + dim.height +
      ",width=" + dim.width +
      ",left=" + dim.left +
      ",top=" + dim.top
    );
    popup.addEventListener("message", function(event){
      if(event.origin != this.origin) return;
      if(event.data.substring(0,7) == "failure"){
        return next(event.data.substring(7));
      }
      next(void(0),event.data);
    }, false);
  }
};
