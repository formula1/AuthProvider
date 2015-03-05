

module.exports = {
  name:"github",
  authLocation: function(client_id,state,redirect_uri){
    return "https://github.com/login/oauth/authorize" +
      "?client_id="+encodeURIComponent(client_id) +
      "&state="+encodeURIComponent(state)+
      "&redirect_uri="+encodeURIComponent(redirect_uri);
  }
};
