# Welcome to Outbreak Science Rapid PREreview!

## What is it?
Outbreak Science Rapid PREreview is an **open source platform and a web extension to facilitate the rapid assessment of preprints during public health crises**. The platform allows any researcher with an ORCID iD to provide a quick high-level evaluation of preprints via a series of questions to assess the originality and soundness of the research findings. Aggregated data from these reviews is visualized to allow readers to identify the most relevant information. This tool has the capacity to be transformative for on-the-ground health workers, researchers, public health agencies, and the public, as it can quickly unlock key scientific information during an outbreak of infectious diseases.

## Our team
Outbreak Science Rapid PREreview is a project born from the collaboration of PREreview and Outbreak Science.

[PREreview](https://v2.prereview.org) is an open project fiscally sponsored by the non-profit organization Code for Science & Society. PREreview's mission is to increase diversity in the scholarly peer review process by empowering all researchers to engage with preprint reviews.

[Outbreak Science](https://outbreasci.org) is a non-profit organization aimed at advancing the science of outbreak response, in particular by supporting early and open dissemination of data, code, and analytical results.


## Funding
This collaborative project is mainly funded by the [Wellcome Trust Open Research Fund](https://wellcome.ac.uk/funding/schemes/open-research-fund), but has also received support from the Mozilla Foundation.


## Information about this repository

[![CircleCI](https://circleci.com/gh/PREreview/rapid-prereview.svg?style=svg&circle-token=40b07ebe214d49722b30d628f483734cff70ee52)](https://circleci.com/gh/PREreview/rapid-prereview)

[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

Rapid PREreview focuses on providing the best infrastructure to request /
provide / analyze feedback (structured reviews) on _existing_ preprints relevant
to the outbreak community.

The feedback should be of use to:
1. the outbreak community (academics)
2. workers, editors, journalists (visualization etc.)

Rapid PREreview does _not_ focus on:
- coordinating research effort / data analysis / calling for research during
  emergency situations
- becoming / being a preprint server

**NOTE: this project is under active development and is currently not accepting
contributions.** Thanks for taking an interest. Feel free to star/watch the
repository and we will remove this notice once we have processes and
documentation in place to allow people to collaborate productively.

**[Join PREreview Slack
Channel](https://join.slack.com/t/prereview/shared_invite/enQtMzYwMjQzMTk3ODMxLTZhOWQ5M2FmMTY5OTYzZDNhNDg2ZDdhODE2Y2Y4MTVjY2U0OWRiZTA5ZjM3MWM1ZTY0N2E1ODYyNWM1NTc2NDg)**


## Development

### Dependencies

run:

```sh
npm install
```

### Redis

Be sure that redis is running on the default port (6379).
For convenience you can run: `npm run redis`.

### Database (CouchDB 2.x + Clouseau + Dreyfus)

The simplest way to get that up and running locally is to use the
`cloudant-developer` docker container. To do so follow the instruction on:
https://hub.docker.com/r/ibmcom/cloudant-developer/

After installing docker run:

```sh
docker pull ibmcom/cloudant-developer
```

To start the container run:

```sh
docker run --detach --volume cloudant:/srv --name cloudant-developer --publish 5984:80 --hostname cloudant.dev ibmcom/cloudant-developer
```

The cloudant dashboard will be available at http://127.0.0.1:5984/dashboard.html

To restart the container after quiting Docker, run:
```sh
docker restart cloudant-developer
```

To stop the container and remove any previous one run:
```sh
docker rm `docker ps --no-trunc -aq` -f
```

To view the logs run:
```sh
docker logs cloudant-developer
```

### App

Once cloudant and redis are running run:

```sh
npm run init
```

to setup the databases.

To seed the app with some data run:

```sh
npm run seed
```

After, run:

```sh
npm start
```

and visit [http://127.0.0.1:3000/](http://127.0.0.1:3000/)

### Storybook (components playground)

run:

```sh
npm run storybook
```

and visit [http://127.0.0.1:3030/](http://127.0.0.1:3030/).

To add stories, add a file that ends with `.stories.js` in the `./src/components` directory.


### Web extension

#### Development

##### Chrome

1. Run `npm run extension:watch` that will build and watch the extension in the
   `extension` directory. ! DO NOT EDIT THE FILES THERE or do not tack them on
   git, with the exception of `manifest.json`, `fonts/`, `icons/` and
   `popup.html`.
2. Navigate to `chrome://extensions/`, be sure to toggle the "developer mode",
   click on "load unpacked" and select the content of the `extension` directory.


##### Firefox

1. Run `npm run extension:watch-firefox` that will build and watch the extension in the
   `extension` directory. ! DO NOT EDIT THE FILES THERE or do not tack them on
   git, with the exception of `manifest.json`, `fonts/`, `icons/` and
   `popup.html`.
2. Navigate to `about:debugging`, and click on "Load Temporary Add-on" and
   select the `extension/manifest.json` file.


#### Production

##### Chrome

1. Run `npm install`
2. Set the `version` property of the `extension/manifest.json` file
3. Run `npm run extension:build`
4. Run `npm run extension:pack`
5. Upload the created `extension.zip` file to the Chrome web store

##### Firefox

1. Run `npm install`
2. Set the `version` property of the `extension/manifest.json` file
3. Run `npm run extension:build-firefox`
4. Run `npm run extension:pack-firefox`
5. Upload the created `extension-firefox.zip` file to the Firefox web store


### Tests

Once cloudant and redis are running run:

```sh
npm test
```

### Deployments

We use Azure and IBM Cloudant.

#### Architecture

We use [Azure App Service](https://docs.microsoft.com/en-us/azure/app-service/) and run 2 apps:
- `rapid-prereview` for the web server
- `rapid-prereview-service` for a process that takes care of:
  - maintaining our search index (listening to CouchDB changes feed)
  - updating the "trending" score of preprints with reviews or requests for
    reviews on a periodical interval

These 2 apps are run on the same service plan (`rapid-prereview-service-plan`).

The databases are hosted on IBM Cloudant (CouchDB) and are composed of 3
databases:
- `rapid-prereview-docs` (public) storing the roles, reviews and requests for reviews
- `rapid-prereview-users` (private) storing all the user data (and the links user <-> role)
- `rapid-prereview-index` (private) storing the preprint with reviews or request for
  reviews search index

We use [Azure Cache for
Redis](https://docs.microsoft.com/en-us/azure/azure-cache-for-redis/) to store:
- session data
- cached data for the payload of the public API.

#### Process

##### Cloudant

Be aware that all the following will source the production environment variables
(see the Azure section below for information to get them)

1. Run `npm run cloudant:init` to create the databases and push the design documents
2. Run `npm run cloudant:set-security` to secure the databases
3. Run `npm run cloudant:get-security` to verify the [security
object](https://cloud.ibm.com/docs/services/Cloudant/offerings?topic=cloudant-authorization)

To seed the production database (for demos **only**) run: `npm run cloudant:seed`
(!! note that this performs a hard reset and delete all data in the databases
before seeding).

##### Azure

1. Install Azure CLI (see
   https://docs.microsoft.com/en-us/cli/azure/?view=azure-cli-latest)
2. Run `az login` to login to the CLI
3. Get the private files not checked in to GitHub: `./get-private.sh` (if you
   later update those files, run `./put-private.sh` to upload them back)
4. Run `npm run build` (after having run `npm install`)
5. Run `./deploy-app.sh` to deploy the app and `./deploy-service.sh` to deploy the service

To see the logs, run `./log-app.sh` or `./log-service.sh`. We use
[pino](https://getpino.io/) for logging.

Apps can be restarted with `./restart-app.sh` and `./restart-service.sh`.

To reset the redis cache run: `npm run azure:reset-cache`. Be aware that this
will source the production environment variables.

To reset all redis data (including sessions) run: `npm run azure:reset-redis`. Be
aware that this will source the production environment variables.

Some basic info about the service health can be found at https://rapid-prereview-service.azurewebsites.net/
