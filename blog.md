# CI/CD Auth0 Rules

Auth0 has a authentication processing pipeline that cna be extended by adding custom Javascript that can be edited in the Auth0 console.

I'm not a big fan of editing code in consoles. It's too hard to test and there is no clear way to track changes to the code. Either what is running doesn't match what is in source control or there is nothing in source control.

## Setup the config

### Setup the Auth0 application

Auth0 has an extension that will set this up, that's the easiest way to get the Auth0 part of the CI/CD working.
To install this

- Navigate to the extensions panel
- Click on the deploy cli extension
- Agree to install it and allow it access to the required scopes.

This will create a new Auth0 Application that will have access to modify the whole tenant using the `Auth0 Management API` that is set up by default on the tenant.

## Using the deploy cli in an action

The config can be put together as a `json` file. The minimum needed is the `AUTH0_DOMAIN`, `AUTH0_CLIENT_SECRET`, and `AUTH0_CLIENT_ID`. I've added the `AUTH0_ALLOW_DELETE` property and set it to true so tht it will remove any rules stored in Auth0 that aren't present in the repo.

To my file I've used this `##` notation that allows me to pass in the values for the parameters as environment variables. More info on replacement mappings [in the Auth0 documentation](https://auth0.com/docs/extensions/deploy-cli-tool/environment-variables-and-keyword-mappings).

```json
{
  "AUTH0_DOMAIN": "##AUTH0_DOMAIN##",
  "AUTH0_CLIENT_SECRET": "##AUTH0_CLIENT_SECRET##",
  "AUTH0_CLIENT_ID": "##AUTH0_CLIENT_ID##",
  "AUTH0_ALLOW_DELETE": true
}
```

# Configuring the rules

## The Rule code

Each rule consists of exactly one function which is run within the Auth0 web task environment (NodeJS 12). The out of the ordinary thing is that it has to be just a single function. When a sample rule is created in the console it looks like this

```javascript
function (user, context, callback) {
  // Ok there is more code here in the sample but you get the idea.
}
```

This is still hard to test. What I want to do is write unit tests that can make me more comfortable about continuously delivering to production.

To make this work with a test framework like jest the function needs to be exported. The Web Task environment is rather specific about how this works. It does not work with ex modules, nor does it expose the global `module` property.

The work around is to wrap the code in an anonymous immediately executed function that returns the rule function if `module` doesn't exist and exports the function if it does.

```javascript
(() => {
  function rule(user, context, callback) {
    // TODO: implement your rule
  }
  if (module) {
    module.exports = rule;
  } else {
    return rule;
  }
})(); // no semicolon
```

In this block it's worth noting that the last line has no semicolon. Having a semicolon here causes the Auth0 rule to throw an error.

With this in place the code can be imported in to a Jest test so that I can be more confident that the code running as part of the authentication flow actually works.

## The config

There is more than just code that is required to configure the rules. The following YAML file configures the `rules/sampleRule.js` to be run as the first rule after a user has successfully logged in and configures a secret that will be passed through as an environment variable. This YAML file can include as much or as little of the tenants configuration as needed. In this case I'm keeping this deployment to only updating the rules as they have their own change cycle that is separate to the rest of the tenants configuration.

```yaml
rules:
  - name: sampleRule
    script: ./rules/sampleRule.js
    stage: login_success
    enabled: true
    order: 1
rulesConfigs:
  - key: "Shhh_Secret"
    value: "##SECRET_IN_ENV_VARIABLES##"
```

# Import the rules into the Tenant

## Test locally

The first step is to check that this configuration works. The Auth0 deploy cli is an NPM package and can be run through installing it locally, globally, or by using npx.

The config that I have set up above uses the `##` notation to inject environment variables into the configuration so to run that command some values need to be Auth0 console. Grab the config values for the `auth0-deploy-cli` application that the Auth0 extension created. And set the as environment variables named `AUTH0_DOMAIN`, `AUTH0_CLIENT_SECRET`, and `AUTH0_CLIENT_ID`.
![The image of the Application]()

Add the config into the environment variables and run the import statement e.g. `npx a0deploy import -c ./config.json -i ./src/tenant.yaml`.

I tested that this was working by reviewing the code in the Auth0 console to see that it's the same code that was deployed.

With this complete I have the ability to deploy code to the rules without having to copy it into the console. It's a good step forward. The next thing to do is get this happening automatically when the code is pushed into version control.

## Run in Github Actions

To do automated Continuous Integration and Continuous Deployment I used Github Actions. I've split the action into two jobs. One that runs tests that will run on every push and one that actually deploys the code to Auth0. This second one runs only when code is committed to the `main` branch, allowing me to do development on feature branches and only deploy to the live environment when code is complete.

`npx a0deploy import -c ./config.json -i ./src/tenant.yaml`
