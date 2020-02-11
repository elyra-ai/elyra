# Elyra Release Process

## Versioning

**Major** releases are made when the project is updated to a new major version of Jupyter Lab.

**Minor and Patch** releases are made based on the merging of major features or bug fixes and the demands of downstream projects.

## Release Cycle

The following release cycle is followed for Major version releases:

1. A new JupyterLab major version beta or rc is released.
1. An Elyra working branch (ex. `jupyterlab-X.0`) is created to update to the new version of Lab.
This branch is kept up to date with master and any necessary changes to support the new Lab version are committed here.
1. The new version of JupyterLab is released and any extensions Elyra is dependant on are updated to support the new release.
Contributions to those projects to update them to the latest release may be necessary.
1. Cut a new branch from master called `branch-vX` where `X` is the (previous) major version supported by master.
1. Merge the new version working branch into master.
1. Deprecate any prior `branch-vX` to the one created above.
Deprecation consists of a final minor or patch release of the branch followed by the end of future development on it.

## Branch Management

During regular development there are two activate branches:

* `master` contains latest code running on the most recent major release of JupyterLab.
The latest development is based on this branch, including any new pull requests.
* `branch-vX` contains code supporting the previous major version of JupyterLab.
Bug fixes specific to this version are merged here as well as any new code merged to `master` that can be [back-ported](#back-porting).

## Back-porting

Unless address an issue specific to `branch-vX` all development is done based on `master`.

When a PR is merged into master the committer merging the code should attempt to cherry-pick the new commit onto `branch-vX`.
If they encounter any conflicts the committer then makes a judgment call and either:
1. Fix the conflicts themselves and merges the commit. This would usually be done with minor conflicts.
2. Make a comment on the PR asking the creator to open a new PR against `branch-vX` addressing the conflicts.
