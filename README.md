# QuinCI

QuinCI is a self-hosted, minimal GitHub CI server that runs scripts in response to GitHub webhook events.

It is an alternative to complex, monolithic CI servers like Jenkins. Instead of providing a runner architecture, loggers, a plugin system, and pipelines... it just runs script files. If your CI needs are not very complex, QuinCI may be easier to set up and debug than Jenkins.

## Installation and Setup

### Create scripts for QuinCI to run

QuinCI expects to find two executable files in your repo: `quinci/master` and `quinci/pull-request`. Create these in your repo before installing QuinCI, or else your builds will fail.

`quinci/master` will be run for every commit added to master, and `quinci/pull-request` will be run for every pull request.

The scripts can do whatever you want. Here's an example `quinci/master` script that runs tests and then deploys the code:

```sh
#!/bin/sh
yarn test
yarn deploy
```

And here's an example `qunci/pull-request` script that just runs the tests (without deploying):

```sh
#!/bin/sh
yarn test
```

Make sure to make these files executable:

```sh
chmod +x quinci/master
chmod +x quinci/pull-request
```

### Create GitHub App

QuinCI is used as a [GitHub App](https://developer.github.com/apps/). Because it's self-hosted, the webhook URL and authentication details will vary, so you need to create a custom GitHub App for your QuinCI server. You can [create a new GitHub App here](https://github.com/settings/apps/new).

* **Name** the app whatever you want
* **Description** is optional
* **Homepage URL** needs to be filled in but it doesn't matter what it is
* **User authorization callback URL** needs to be filled in but it doesn't matter what it is
* Leave **Setup URL** blank
* For the **Webhook URL**, use a public URL that you will run QuinCI on, eg `http://mydomain.com:7777/`. You can use [ngrok](https://ngrok.com/) to expose a URL to your local box for testing. Also, you can change this later without re-creating the GitHub App.
* You have to have a **Webhook secret**. Generate something random. You'll need to include it when running QuinCI on your server, so keep it somewhere.

Your app needs these permissions:

* **Repository contents**: Read only
* **Issues**: Read & write
* **Pull requests**: Read & write
* **Commit statuses**: Read & write

Everything else can be "No access".

Subscribe to these events:

* **Commit comment**
* **Push**
* **Issue comment**
* **Pull request**

You don't need to subscribe to anything else.

### Get GitHub App ID

After creating your GitHub App, go to its page under "GitHub Apps" in [GitHub Developer settings](https://github.com/settings/apps) and copy its ID from the "About" section. You'll need this when running QuinCI on your server.

### Generate Private Key

From your GitHub App page, generate a private key and download it (It'll be a `.pem` file). You'll need to use it when running QuinCI on your server, so keep it somewhere.

### Configure your repo to use the GitHub App

Go to your App's page in [GitHub Developer settings](https://github.com/settings/apps) and click "Install app" to install your Github App onto your repo.

### Run QuinCI on your server

* You need [Node.js](https://nodejs.org/en/) 8.11.1 or higher to run QuinCI.
* Install the QuinCI client on your server: `npm i -g quinci`
* Copy the `.pem` private key you downloaded earlier somewhere on your server
* Make a text file and put your webhook secret in it, and put this file somewhere on your server
* Run `quinci` with the following command line switches:

```
Options:
  --port                 Port to run the HTTP server on     [required] [default: 7777]
  --app-id               GitHub App ID                                      [required]
  --app-cert             Path to the GitHub App's private key pem file      [required]
  --webhook-secret-file  Path to a text file containing your Webhook secret [required]
```

So for example:

```sh
quinci --port 8080 --app-id 12345 --app-cert secrets/quinci.private-key.pem --webhook-secret-file secrets/webhook-secret.txt
```

This will run QuinCI in the current directory.

## Usage

QuinCI runs "jobs" when certain "events" occur. A job is an executable file that lives in your repo in the `quinci` folder. An event is something that can happen on GitHub, like a commit being added to master, or a Pull Request being opened.

Here's a list of the events QuinCI reacts to, and what job it will run for each event:

| Event                                  | Job      |
| -------------------------------------- | -------- |
| Commit pushed to or merged into master | `master` |

When you push a commit to master or merge a PR into master, QuinCI will run the `master` job on your repo. To do so, it:

* Clones your repo
* Checks out the commit you just pushed
* Marks the commit status as "pending"
* Runs `./quinci/master` inside your repo

* If `./quinci/master` exits with a nonzero status code, QuinCI will mark the commit status as "failure" and leave a comment on the commit with information about the failure.
* If `./quinci/master` exits with a status code of zero, QuinCI will mark the commit status as "success".

| Event                                 | Job            |
| ------------------------------------- | -------------- |
| PR opened, or new commits added to PR | `pull-request` |

When you open a Pull Request or push new commits onto a PR, QuinCI will run the `pull-request` job on your repo. To do so, it:

* Clones your repo
* Checks out the commit you just pushed or opened a PR for
* Marks the commit status as "pending"
* Runs `./quinci/pull-request` inside your repo

QuinCI will post a comment when it starts running the job, and another comment when it has finished the job, which will include the results of the build.

* If `./quinci/pull-request` exits with a nonzero status code, QuinCI will mark the commit status as "failure" and leave a comment on the PR indicating the job failed.
* If `./quinci/pull-request` exits with a status code of zero, QuinCI will mark the commit status as "success" and leave a comment on the PR indicating the job succeeded.

| Event                                    | Job            |
| ---------------------------------------- | -------------- |
| Comment with special phrase posted on PR | `pull-request` |

In any PR, you can leave a comment with the phrase "QuinCI run" or "QuinCI test", and QuinCI will re-run the `pull-request` job.

The phrase only needs to match `/quin+c[eyi]+.* (?:run|test)/i`, so you can write "Mr. Quincy, please test the code again, if you wouldn't mind" and it will work, too.

| Event                                        | Job    |
| -------------------------------------------- | ------ |
| Comment with special phrase posted on commit | varies |

On any commit, you can leave a comment with the phrase "QuinCI run master" or "QuinCI run pull-request" to run the `master` or `pull-request` jobs on that commit.

The phrase only needs to match `/quin+c[eyi]+.* run ([\w.-]+)/i`, so you can write "Quinncey, could you please run master" and it will work, too.

You can also use this to run custom jobs; for example, if you create the file `quinci/deploy` in your repo, you can comment "QuinCI run deploy" on a commit, and QuinCI will clone the repo, check out the commit, and run `./quinci/deploy`.

## Troubleshooting

* QuinCI uses the [debug](https://www.npmjs.com/package/debug) module to log debugging information. To view debug logs while running, set the environment variable `DEBUG` to `quinci:*`.
* QuinCI clones repos into directories created in the `jobs` directory relative to where `quinci` is run. If QuinCI is not behaving, you can `cd` into one of those directories to run the scripts yourself.
* When running a job, QuinCI writes all log output to `quinci-log.txt` in the job folder.
* QuinCI's `jobs` directory is not automatically pruned; you may want to set up a cron script to do this.

## License

MIT
