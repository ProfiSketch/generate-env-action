# ProfiSketch: .env generator action

This action allows to generate necessary environment files for your projects from a PocketBase server. The server must contain `env` collection with necessary columns `name`, `services` (select type), `dev`, `qa`, `prod`. Also you can specify `is_deprecated` (boolean) and `comment` columns.

🚨 Beware that the action overwrites the contents of the files that are specified in the config!

Setup is done in three steps:

1. Add `CONFIG_SERVER_URL` variable to you repository secrets.

2. Add action to your workflow

```yaml
name: Workflow name

on: ...

jobs:
  job_name:
    runs-on: ...

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Generate environment files
        uses: ProfiSketch/generate-env-action@v0.0.4
        with:
          server_url: ${{ secrets.CONFIG_SERVER_URL }}
          env_name: dev
```

3. Configure env generation by creating `.github/env-config.json` file with the following content

```json
{
  "serviceName": "FE",

  "envTemplateFiles": [
    {
      "template": "foo/bar/example.env",
      "output": "foo/bar/.env"
    },
    {
      "template": "foo/buzz/example.env",
      "output": "foo/.env"
    }
  ],

  "plainFiles": [
    {
      "envVarName": "FOO_VAR_NAME_ON_CONFIG_SERVER",
      "output": "path/to/file.txt"
    },
    {
      "envVarName": "BAR_VAR_NAME_ON_CONFIG_SERVER",
      "output": "path/to/file.cert"
    }
  ]
}
```

## Config file description

There are several parts in example file above:

- `serviceName` -- name of the service from `services` column. The script will fetch the list of variables only with matching service name.

- `envTemplateFiles` -- this section allows you to substitute variables from your server into `template.env` files, similar workflow to `envsubst` program.

- `plainFiles` -- this section allows you to fill files with just a content of specified variable only (useful for certificates generation).

### Mapping syntax

By default the action will map the values of variables from config server based on `env_name` column that is specified in your workflow. But you can adjust this behavior by using `mapping` syntax.

For example, suppose you have variable `FOO` with `dev` value `VALUE1` and `prod` value `VALUE2`. If you use this action with `env_name: dev`, by default you will get `BAR=VALUE1` using the following in your `template.env` file

```env
BAR=${FOO}
```

But if you add

```env
BAR=${FOO;dev<-prod}
```

The resulting env file will contain `BAR=VALUE2` even when `env_name` is equal to `dev`.

### Specify path to config

You can specify the path to your `env-config.json` the following way

```yaml
# ...

- name: Generate environment files
  uses: ProfiSketch/generate-env-action@v0.0.4
  with:
    server_url: ${{ secrets.CONFIG_SERVER_URL }}
    env_name: dev
    config_path: ./your/path/here/config.json
```

## Action development

> First, you'll need to have a reasonably modern version of `node` handy. This won't work with versions older than 9, for instance.

Install the dependencies

```bash
$ npm ci
```

Build the typescript and package it for distribution

```bash
$ npm run build && npm run package
```

Run the tests :heavy_check_mark:

```bash
$ npm test

 PASS  ./index.test.js
  ✓ throws invalid number (3ms)
  ✓ wait 500 ms (504ms)
  ✓ test runs (95ms)

...
```

### Change action.yml

The action.yml defines the inputs and output for your action.

Update the action.yml with your name, description, inputs and outputs for your action.

See the [documentation](https://help.github.com/en/articles/metadata-syntax-for-github-actions)

### Change the Code

Most toolkit and CI/CD operations involve async operations so the action is run in an async function.

```javascript
import * as core from '@actions/core';
...

async function run() {
  try {
      ...
  }
  catch (error) {
    core.setFailed(error.message);
  }
}

run()
```

See the [toolkit documentation](https://github.com/actions/toolkit/blob/master/README.md#packages) for the various packages.

### Publish to a distribution branch

Actions are run from GitHub repos so we will checkin the packed dist folder.

Then run [ncc](https://github.com/zeit/ncc) and push the results:

```bash
$ npm run package
$ git add dist
$ git commit -a -m "prod dependencies"
$ git push origin releases/v1
```

Note: We recommend using the `--license` option for ncc, which will create a license file for all of the production node modules used in your project.

Your action is now published! :rocket:

See the [versioning documentation](https://github.com/actions/toolkit/blob/master/docs/action-versioning.md)

### Validate

You can now validate the action by referencing `./` in a workflow in your repo (see [test.yml](.github/workflows/test.yml))

```yaml
uses: ./
with:
  milliseconds: 1000
```

See the [actions tab](https://github.com/actions/typescript-action/actions) for runs of this action! :rocket:

### Usage:

After testing you can [create a v1 tag](https://github.com/actions/toolkit/blob/master/docs/action-versioning.md) to reference the stable and latest V1 action
