# AuthProvider

### Forenote

This is meant to be built with browserify. It has a dependency on the node/iojs environment, specificly querystring and events. I can also build a standalone package however, I prefer the idea of my repo being packaged with others that use similar dependencies than as a standalone.

### Usage

#### Initializing

```
AuthProvider.init({
  github:{
    client_id:YOUR_CLIENT_ID,
    access_retriever:function(code,next){
      //get the access code
      next(error,accesscode);
    }
  }
})
```
* github_clientid - Is your github app client id
* access_retriever - How you implement it isn't up to me. You can call your server or another persons.

#### Constructing a User

`var user = new AuthProvider(options)`

Options can be

* storage - a storage that has a similar API to localStorage. Defaults to cookieStore which is also in the package
* identity - if for some reason you want multiple users to be considered existant on the same page, you will want to provide an identiy. One reason could be to have different users connected via gamepad api making calls as different people. Another could be using a browser as a host. Your purposes are up to you.
* origin - This ensures popups are more secure.


#### Logging in a user

`user.login(authority_type, ux_type)`

* authority_type is a string that is a valid auth type for which you have provided credentials for
* defaults to "github"

* ux_type - can be "redirect", "popup" or will default to "redirect".
* If redirect, will redirect the page.
* If popup, will create a popup.

#### Logging out a user

`user.logout()`

This basically just deletes what ever is in the local storage, access token and sets the state to -1

#### Checking if user is logged in

`user.isLoggedIn === true`

#### Making a request as a user

`user.asAuthority(url, next)`

* url - is a valid url, or just has a "?" and valid parameters after.
* next - the callback that will recieve the uri

Its important to note

* This doesn't make ajax calls, just parses the url and adds its access_token to it if it has one
* It will **always** return a url. The url returned may or may not have an access token.
* If the user is not authorized, it will just return the uri back
* If the user is in the process of authorization, it will put the request in a queue until it has finished, then the url provided will either be above or below.
* If the user is authorized, it will return the uri with the access token
* The next function will always be delayed. Whether its by 1 millisecond or until authorization is completed
* its best used as `user.asAuthority(url, function(url){ request(url, funciton(data){ dostuff }) })`
* I may include promise support

#### Listening for a login

`user.on('login',function(){})`

Its implemented in this manner to support redirects.

#### Listening for a logout

`user.on('logout',function(){})`

Its implemented in this manner to keep a familiar api.

#### Listening for an error

`user.on('error',function(err){})`

Its implemented in this manner to keep a familiar api.
