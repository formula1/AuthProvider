# AuthProvider

### Forenote

This is meant to be built with browserify. It has a dependency on the node/iojs environment, specificly 
querystring and events. I can also build a standalone package however, I prefer the idea of my repo being packaged
with others that use similar dependencies than as a standalone.

### Usage

#### Constructing a User

`var user = new AuthProvider(github_clientid, access_codeRetriever, options)`

Where

* github_clientid - Is your github app client id
* access_codeRetriever - `function(code,next){ next(error,access_token)};` How you implement it isn't up to me.
* options - Additional options

Options can be

* storage - a storage that has a similar API to localStorage. Defaults to cookieStore which is also in the package
* identity - if for some reason you want multiple users to be considered existant on the same page, 
you will want to provide an identiy. One reason could be to have different users connected via gamepad api making
calls as different people. Another could be using a browser as a host. Your purposes are up to you.
* origin - This made to popups to ensure that those calls are from a place you specify.


#### Logging in a user

`user.login(type)`

* type - can be "redirect", "popup" or will default to "redirect.
If redirect, will redirect the page. If popup, will create a popup.

#### Logging out a user

`user.logout()`

This basically just deletes what ever is in the local storage, access token and sets the state to -1

#### Checking if user is logged in

`user.isLoggedIn === true`

