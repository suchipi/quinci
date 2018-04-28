# dumb-ci

This is a dead-simple GitHub CI application that watches for events on GitHub and pulls and runs a shell script when they occur.

I made it because I spent a day debugging why Jenkins was killing my processes randomly and got frustrated at how complex it all was. I wanted something really barebones so that it would be easier to debug.

## Installation and Setup

### Create scripts for Dumb CI to run

Dumb CI expects to find two executable files in your repo: `dumb-ci/master` and `dumb-ci/pull-request`. Create these in your repo before installing Dumb CI (or else your builds will fail).

Here's an example `master`:

```sh
#!/bin/sh
yarn test
yarn deploy
```

And an example `pull-request`:

```sh
#!/bin/sh
yarn test
```

Make sure to make these files executable:

```sh
chmod +x master
chmod +x pull-request
```

### Create GitHub App

Dumb CI is a [GitHub App](https://developer.github.com/apps/). Because it's up to you where it will run, you need to create the app yourself. You can [create a new GitHub App here](https://github.com/settings/apps/new).

* Name the app whatever you want
* Description is optional
* Homepage URL needs to be filled in but it doesn't matter what it is
* User authorization callback URL needs to be filled in but it doesn't matter what it is
* Leave Setup URL blank
* For the Webhook URL, use a public URL that you will run `dumb-ci` on, eg `http://mydomain.com:7777/`. You can use [ngrok](https://ngrok.com/) to expose a URL to your local box for testing.
* You have to have a Webhook secret. Generate something random. You'll need to include it when running Dumb CI on your server, so keep it somewhere.
* Generate a private key and download it (It'll be a `.pem` file). You'll need to use it when running Dumb CI on your server, so keep it somewhere.

Your app needs these permissions:

* Repository contents: Read only
* Issues: Read & write
* Pull requests: Read & write
* Commit statuses: Read & write

Everything else can be "No access".

Subscribe to these events:

* Commit comment
* Push
* Issue comment
* Pull request

You don't need to subscribe to anything else.

### Get GitHub App ID

After creating your GitHub App, go to its page under "GitHub Apps" in [GitHub Developer settings](https://github.com/settings/apps) and copy its ID from the "About" section. You'll need this when running Dumb CI on your server.

### Configure your repo to use the GitHub App

Go to your App's page in [GitHub Developer settings](https://github.com/settings/apps) and click

### Run Dumb CI on your server

* You need a modern version of node to run Dumb CI.
* Install the Dumb CI client on your server

```sh
npm i -g dumb-ci
# OR
yarn global add dumb-ci
```

* Copy the `.pem` private key you downloaded earlier somewhere on your server
* Make a text file and put your webhook secret in it, and put this file somewhere on your server
* Run `dumb-ci` with the following command line switches:

```
Options:
  --port               Port to run the HTTP server on     [required] [default: 7777]
  --app-id              GitHub App ID                                      [required]
  --app-cert            Path to the GitHub App's private key pem file      [required]
  --webhook-secret-file  Path to a text file containing your Webhook secret [required]
```

So for example:

```sh
dumb-ci --port 8080 --app-id 12345 --app-cert secrets/dumb-ci.private-key.pem --webhook-secret-file secrets/webhook-secret.txt
```

This will run Dumb CI in the current directory.

## Usage

Dumb CI will create or use a `jobs` folder where it does all of its work, relative to where you run `dumb-ci`.

* Whenever you push to master, your server running `dumb-ci` will clone your repo and execute the file `dumb-ci/master` from your repo. If the script fails, it will comment on the commit, including the log output or the script.
* Whenever you open a PR or update a PR's commits, your server running `dumb-ci` will clone your repo and execute the file `dumb-ci/pull-request`. It will add a comment to the PR when it starts running and when it finishes, including log output and whether the script succeeded.
* On any commit, you can add a comment saying "Dumb CI run master" to run `dumb-ci/master`. You can also say "Dumb CI run pull-request" to run `dumb-ci/pull-request`, or "Dumb CI run my-custom-script.sh" to run `dumb-ci/my-custom-script.sh`. Your server will run the script and post a comment on the commit when it starts running and when it finishes.
* On a pull request, you can add a comment saying "Dumb CI run" or "Dumb CI test" to run (or re-run) `dumb-ci/pull-request`.
* The jobs that `dumb-ci` executes inherit all environment variables from `dumb-ci` itself, so you can use environment variables on your server and reference them in your scripts.

## Troubleshooting

* Dumb CI uses the [debug](https://www.npmjs.com/package/debug) module to log debugging information. To view debug logs while running, set the environment variable `DEBUG` to `dumb-ci:*`.
* Dumb CI does not clean up after running jobs; this is so you can go in and debug if something is not working right. All jobs are run in the `jobs` directory relative to where you run `dumb-ci`. You may wish to create a cron script to clean these up periodically.
* When running a job, Dumb CI writes all log output to `dumb-ci-log.txt` in the job folder.

## License

MIT
