

module.exports = {
  name:"github",
  authLocation: function(client_id,state,redirect_uri){
    return "https://github.com/login/oauth/authorize" +
      "?client_id="+client_id +
      "&state="+state +
      "&redirect_uri="+redirect_uri;
  }
};
