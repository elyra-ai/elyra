# Changelog

## 1.3.0 (10/22/2020)

- Use `python3` when executing local python operations [#992](https://github.com/elyra-ai/elyra/pull/992)
- Integrate with `nbresuse` to display local resource usage on status bar [#987](https://github.com/elyra-ai/elyra/pull/987)
- Enable local pipeline executions when server uses Enterprise Gateway [#983](https://github.com/elyra-ai/elyra/pull/983)
- Sort list of runtime images retrieved from service [#982](https://github.com/elyra-ai/elyra/pull/982)
- Update to Elyra Canvas 9.1.6 [#986](https://github.com/elyra-ai/elyra/pull/986)
- Increased test coverage [#886](https://github.com/elyra-ai/elyra/pull/886) [#751](https://github.com/elyra-ai/elyra/pull/751) [#940](https://github.com/elyra-ai/elyra/pull/940)
- Update Binder build config to enable cloning git repos from ui [#963](https://github.com/elyra-ai/elyra/pull/963)
- Automate the release of independent Elyra package [#973](https://github.com/elyra-ai/elyra/pull/973)
- Add common format for pipeline process logging [#950](https://github.com/elyra-ai/elyra/pull/950)
- Add help icon to launcher [#968](https://github.com/elyra-ai/elyra/pull/968)
- Multiple updates to documentation [#979](https://github.com/elyra-ai/elyra/pull/979) [#947](https://github.com/elyra-ai/elyra/pull/947) [#949](https://github.com/elyra-ai/elyra/pull/949) [#945](https://github.com/elyra-ai/elyra/pull/945)
- Add exported file location to response dialog [#967](https://github.com/elyra-ai/elyra/pull/967)

## 1.2.1 (09/23/2020)

- Fix dependency install in Elyra docker image [#941](https://github.com/elyra-ai/elyra/pull/941)
- Remove elyra build area to reduce image size [#942](https://github.com/elyra-ai/elyra/pull/942)

## 1.2.0 (09/22/2020)

- Add support for Python Script node on pipelines [#722](https://github.com/elyra-ai/elyra/pull/722)
- Update papermill transient dependencies on docker build [#923](https://github.com/elyra-ai/elyra/pull/923)
- Document OpenShift deployment [#929](https://github.com/elyra-ai/elyra/pull/929)
- Document how to "bring-your-own" runtime image [#915](https://github.com/elyra-ai/elyra/pull/915)
- Update JupyterLab Git to release 0.21.1 [#922](https://github.com/elyra-ai/elyra/pull/922)
- Add support for deploying Elyra on Red Hat Open Data Hub [#918](https://github.com/elyra-ai/elyra/pull/918)
- Add JupyterLab commands for existing metadata UIs [#906](https://github.com/elyra-ai/elyra/pull/906)
- Add tutorials on how to use Elyra [#909](https://github.com/elyra-ai/elyra/pull/909)
- Update default runtime images [#908](https://github.com/elyra-ai/elyra/pull/908)
- Update install documentation on how to run Elyra from docker [#907](https://github.com/elyra-ai/elyra/pull/907)
- Add JSON UI and optional sort for metadata widget [#877](https://github.com/elyra-ai/elyra/pull/877)

## 1.1.0 (08/26/2020)

- Add support to run pipelines in-place locally [#860](https://github.com/elyra-ai/elyra/pull/860)
- Enable pipeline submission to DEX protected Kubeflow Pipeline environment [#866](https://github.com/elyra-ai/elyra/pull/866)
- Add support for adding files to pipelines using the file browser context menu [#882](https://github.com/elyra-ai/elyra/pull/882)
- Enable adding dependencies in pipeline node properties [#881](https://github.com/elyra-ai/elyra/pull/881)
- Enable updating associated node file from pipeline node properties [#867](https://github.com/elyra-ai/elyra/pull/867)
- Add notebook existence validation to Pipeline Editor [#860](https://github.com/elyra-ai/elyra/pull/860)
- Add initial support for supernodes in Pipeline Editor [#818](https://github.com/elyra-ai/elyra/pull/818)
- Add jest unit tests to Pipeline Editor [#818](https://github.com/elyra-ai/elyra/pull/818)
- Include Python related kernels on Python Editor [#875](https://github.com/elyra-ai/elyra/pull/875)
- Add command to palette to open Runtime Images UI [#835](https://github.com/elyra-ai/elyra/pull/835)
- Add support for grouping metadata fields in metadata editor [#871](https://github.com/elyra-ai/elyra/pull/871)
- Confirm metadata editor reload with unsaved changes [#853](https://github.com/elyra-ai/elyra/pull/853)
- Multiple enhancements and bug-fixes to metadata service [#840](https://github.com/elyra-ai/elyra/pull/840) [#841](https://github.com/elyra-ai/elyra/pull/841) [#866](https://github.com/elyra-ai/elyra/pull/866)
- Add support for installing Elyra using conda [#891](https://github.com/elyra-ai/elyra/pull/891)

## 1.0.1 (08/19/2020)

- Add Elyra source distribution to PyPi in support for conda [#876](https://github.com/elyra-ai/elyra/pull/876)

## 1.0.0 (08/05/2020)

- Notebook Pipelines visual editor
- Ability to run notebooks as batch jobs
- Reusable Code Snippets
- Hybrid runtime support (based on [Jupyter Enterprise Gateway](https://github.com/jupyter/enterprise_gateway))
- Python script execution capabilities within the editor
- Python script navigation using auto-generated outlines using Table of Contents
- Notebook navigation using auto-generated Table of Contents
- Notebook versioning based on Git integration
- Reusable configuration and editor for runtimes
- JupyterHub Support
- Ability to try Elyra from Binder
- Ability to try Elyra locally using Docker

## 1.0.0rc3 (08/01/2020)

- Update KFP Notebook to 0.11.0 release
- Tolerate Notebook 6.1.0 release
- Add custom Elyra launcher [#782](https://github.com/elyra-ai/elyra/issues/782)
- Update to Elyra Canvas 9.0.3 [#788](https://github.com/elyra-ai/elyra/issues/788) [#794](https://github.com/elyra-ai/elyra/issues/794) [#797](https://github.com/elyra-ai/elyra/issues/797) 

## 1.0.0rc2 (07/25/2020)

- Update KFP Notebook to 0.10.3 release
- Remove `cos_secure` requirement from Runtimes metadata [#774](https://github.com/elyra-ai/elyra/issues/774)
- Add indicator for invalid node properties [#752](https://github.com/elyra-ai/elyra/issues/752)
- Add error message on attempt to create circular references [#744](https://github.com/elyra-ai/elyra/issues/744)
- Migrate to the Elyra Canvas 8.0.32  [#758](https://github.com/elyra-ai/elyra/issues/758)
- Fix CLI output when no instances and json is requested  [#764](https://github.com/elyra-ai/elyra/issues/764)
- Update notebook node to allow multiple input links  [#759](https://github.com/elyra-ai/elyra/issues/759)

## 1.0.0rc1 (07/15/2020)

- Update KFP Notebook to 0.10.2 release
- Disable toolbar buttons on empty pipeline editor [#741](https://github.com/elyra-ai/elyra/issues/741)
- Remove escape when inserting markdown snippet to markdown file [#749](https://github.com/elyra-ai/elyra/issues/749)
- Fix code snippet deletion bug [#748](https://github.com/elyra-ai/elyra/issues/748)
- Allow code editor to be resized [#729](https://github.com/elyra-ai/elyra/issues/729)
- Add support for metadata instance classes [#725](https://github.com/elyra-ai/elyra/issues/725)
- Enable CLI JSON output for script consumption [#746](https://github.com/elyra-ai/elyra/issues/746)

## 1.0.0rc0 (07/08/2020)

- Rename python-runner to python-editor [#721](https://github.com/elyra-ai/elyra/issues/721)
- Add support for JupyterLab Dark theme [#706](https://github.com/elyra-ai/elyra/issues/706)
- Improve dependency management and archive generation [#702](https://github.com/elyra-ai/elyra/issues/702)
- Properly set pipeline version on new pipelines [#698](https://github.com/elyra-ai/elyra/issues/698)
- Make pipeline process and export asynchronous [#695](https://github.com/elyra-ai/elyra/issues/695)
- Use absolute form of export path when exporting pipelines [#690](https://github.com/elyra-ai/elyra/issues/690)
- Validate pipeline and export submission dialogs [#684](https://github.com/elyra-ai/elyra/issues/684)
- Create metadata editor [#589](https://github.com/elyra-ai/elyra/issues/589)

Note: Pipeline nodes that currently do not list any dependencies but have 'Include Subdirectories' enabled, 
will not have the intended result. Instead, those node properties must be updated to include '\*' in the dependencies list.
However, use of '\*' with 'Include Subdirectories' is not recommended and finer grained dependency lists should be utilized.

Note: With the rename of the `python-runner` extension, we suggest uninstalling previous versions of Elyra before updating it.
