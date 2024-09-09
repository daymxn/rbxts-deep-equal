# Contributing

Any and all contributions are entirely welcomed! Before you contribute though, there are
some things you should know.

> [!NOTE]
> Making public contributions to this repo means you accept the [LICENSE](LICENSE) agreement and you're contributing code that also respects the [LICENSE](LICENSE) agreement.

## Getting started

Make sure you've given the the [API Reference](api/deep-equal.d.ts) a read before moving forward, such that you understand the design behind **deep-equal**.

### Building

Use the `build` command to build the source files.

```sh
npm run build
```

Or `watch` to watch the source files.

```sh
npm run watch
```

### Running Tests

Start a watch for the test place.

```sh
npm run dev
```

Serve `test.project.json` with rojo and link with an empty base plate in roblox studio.

Finally, use the shortcut `ctrl` + `:` with the [Test EZ Companion](https://github.com/tacheometry/testez-companion) plugin
to run the tests.

## Making changes

To make changes, clone the repo to your local disk.

`git clone git@github.com:daymxn/rbxts-deep-equal.git`

Then, checkout to a new feature branch labeled in the following format.

`git checkout -b NAME-CATEGORY-FEATURE`

Where `NAME` is your *firstLast* name or your *github* username. `CATEGORY` is something like; feature or bugfix.
And `FEATURE` is the title of the new feature (or bug) you're contributing for.

After you've made changes to your local branch, and you want to submit, you can open a Pull Request (PR)
via the [GitHub web panel](https://github.com/daymxn/rbxts-deep-equal/compare).

### Code Formatting

Code in this repo is formatted according to eslint and prettier. You can use the attached `.vscode` folder for automatically formatting on file save, or you can manually run either via the command line with the `format` or `lint` scripts:

```sh
npm run format
```

### Changesets

We use [changesets](https://github.com/changesets/changesets) for our release notes and version bumping.

When submitting a change that should be apart of a release, you
can run the `change` script.

```sh
npm run change
```

It will prompt you with options for setting the message and version type.

#### Additional Commands

Output [to stdout] a summary of the pending changes for a release.

```sh
npm run change:status
```

Export the pending changes to a `changes.json` file at the root directory.

```sh
npm run change:export
```

### Releasing

To invoke a release, you'll need to pull the `main` branch
and run the `release:version` command.

```sh
npm run release:version
```

This will automatically bump the releasing projects.

After merging these changes back into `main`, you can move forward
with the actual publishing.

```sh
npm run release
```

This will publish the releasing projects to npm, with the generated changelogs.

The last step will be pushing the release tags back to the repo.

```sh
npm run release:tags
```
