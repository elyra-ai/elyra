# Changelog

## 2.2.4 (4/26/2021)

- Move cos_secret parameter into original cos category [1624](https://github.com/elyra-ai/elyra/pull/1624)
- Add cos_secret option to runtime metadata configuration [1529](https://github.com/elyra-ai/elyra/pull/1529)
- Update Makefile to simplify publishing container [1623](https://github.com/elyra-ai/elyra/pull/1623)

## 2.2.3 (4/26/2021)

- Update airflow-notebook version to v0.0.7 [1619](https://github.com/elyra-ai/elyra/pull/1619)
- Expose user_namespace parameter in Airflow runtime schema [1545](https://github.com/elyra-ai/elyra/pull/1545)
- Allow secure connections to s3 object storage [1616](https://github.com/elyra-ai/elyra/pull/1616)
- Only allow for KFP Notebook patche releases
- Display message when no code snippet or tag is defined [1603](https://github.com/elyra-ai/elyra/pull/1603)
- Update submit button labels and dialog [1598](https://github.com/elyra-ai/elyra/pull/1598)
- Use unittest mock module to avoid flake8 failure [1607](https://github.com/elyra-ai/elyra/pull/1607)

## 2.2.2 (4/19/2021)

- Adds material ui dependency to ui-components package [1567](https://github.com/elyra-ai/elyra/pull/1567)
- Fix Elyra version when creating kf-notebook docker image [1523](https://github.com/elyra-ai/elyra/pull/1523)
- Fix dependency suggestion in submit notebook dialog [1510](https://github.com/elyra-ai/elyra/pull/1510)
- Pin the testutils and filebrowser version [1541](https://github.com/elyra-ai/elyra/pull/1541)
- Update Jupyterlab-git extension to v0.30.0 [1582](https://github.com/elyra-ai/elyra/pull/1582)

## 2.2.1 (3/31/2021)

- Update KFP Notebook to 0.22.0
- Pin flake8 dependency to avoid trans-dependency conflict
- Fix default node properties when using submit button [1508](https://github.com/elyra-ai/elyra/pull/1508)
- Update build scripts to publish new R editor

## 2.2.0 (3/31/2021)

High level enhancements
- R Editor with the ability to run R scripts from JupyterLab UI
- Add CLI tool for running and submitting pipelines
- Add Elyra image compatible with Kubeflow notebook launcher
- Brought up JupyterHub and Binder support after issues with their latest releases 

Other enhancements and bug fixes
- Add R Editor - [1435](https://github.com/elyra-ai/elyra/pull/1435)
- Pin version range of autopep8 due to version conflict - [1504](https://github.com/elyra-ai/elyra/pull/1504)
- Remove obsolete parameter on build-server make task - [1503](https://github.com/elyra-ai/elyra/pull/1503)
- Update Release Notes formatting (changelog.md)
- Update lint auto-fix suggestions
- Update build tools version on GitHub Actions CI script
- Fix submit button submitting most recent file - [1501](https://github.com/elyra-ai/elyra/pull/1501)
- Fix pipeline node properties dark mode - [1487](https://github.com/elyra-ai/elyra/pull/1487)
- Add elyra-pipeline cli tool - [1246](https://github.com/elyra-ai/elyra/pull/1246)
- Fix pipeline node properties overriding wrong node property - [1492](https://github.com/elyra-ai/elyra/pull/1492)
- Update KFP Notebook to 0.21.0 - [1494](https://github.com/elyra-ai/elyra/pull/1494)
- Add Elyra image compatible with Kubeflow notebook launcher - [1466](https://github.com/elyra-ai/elyra/pull/1466)
- Fixed css scrollbar bug in pipeline node properties - [1484](https://github.com/elyra-ai/elyra/pull/1484)
- Add inputs for resource usage in submit notebook/script - [1483](https://github.com/elyra-ai/elyra/pull/1483)
- Refactor script processors, include brief detail on generic errors - [1485](https://github.com/elyra-ai/elyra/pull/1485)
- Fix container image build command - [1488](https://github.com/elyra-ai/elyra/pull/1488)
- Replace outdated reference to docker-image target - [1489](https://github.com/elyra-ai/elyra/pull/1489)
- Provides better error messages for KFP namespace errors - [1469](https://github.com/elyra-ai/elyra/pull/1469)
- Use node labels instead of filename as operation names - [1468](https://github.com/elyra-ai/elyra/pull/1468)
- Enable extensions as both Notebook/Jupyter Server extensions - [1476](https://github.com/elyra-ai/elyra/pull/1476)
- Use pip legacy resolver to fix binder build - [1456](https://github.com/elyra-ai/elyra/pull/1456)
- Update remaining notebook imports to jupyter_server - [1471](https://github.com/elyra-ai/elyra/pull/1471)
- Remove close button from pipeline node properties editor - [1465](https://github.com/elyra-ai/elyra/pull/1465)
- Add offical logos for Python and R - [1452](https://github.com/elyra-ai/elyra/pull/1452)
- Created RuntimeImagesWidget for customized UI - [1461](https://github.com/elyra-ai/elyra/pull/1461)
- Add schema_name parameter to CLI runtime config examples - [1462](https://github.com/elyra-ai/elyra/pull/1462)
- Fix pipeline properties css bug in Safari - [1449](https://github.com/elyra-ai/elyra/pull/1449)
- Fix properties editor node deletion bug - [1459](https://github.com/elyra-ai/elyra/pull/1459)
- Remove empty values from pipeline node properties - [1463](https://github.com/elyra-ai/elyra/pull/1463)
- Update Binder release information to 2.1.0 - [1454](https://github.com/elyra-ai/elyra/pull/1454)
- Fix code quality Issues reported by analysis tool - [1432](https://github.com/elyra-ai/elyra/pull/1432)
- Add default / placeholder to dropdown field in metadata editor - [1443](https://github.com/elyra-ai/elyra/pull/1443)
- Expose error details on Python node local execution - [1411](https://github.com/elyra-ai/elyra/pull/1411)
- Fix css issues after upgrading to Canvas 10.2.0 - [1451](https://github.com/elyra-ai/elyra/pull/1451)
- Enable support for adding R Script to Pipeline - [1418](https://github.com/elyra-ai/elyra/pull/1418)
- Fix Material UI style specificity issues in Metadata Editor - [1434](https://github.com/elyra-ai/elyra/pull/1434)
- Properly remove string array from pipeline node properties - [1447](https://github.com/elyra-ai/elyra/pull/1447)
- Update release docs with steps to update docker images

## 2.1.0 (3/15/2021)

High level enhancements
- Support for running pipelines on Apache Airflow 1.x runtimes
- Elyra and Apache Airflow tutorial
- Support for submitting Python Scripts as batch jobs
- Enhanced Pipeline Editor node properties ui (now as a right side panel)
- Enhanced metadata editor UI
- Documentation refresh

Other enhancements and bug fixes

- Propagate operation input/output in sorted way [1427](https://github.com/elyra-ai/elyra/pull/1427)
- Update error dialog message when no runtimes configured [1423](https://github.com/elyra-ai/elyra/pull/1423)
- Remove error label when user fixes invalid metadata field [1402](https://github.com/elyra-ai/elyra/pull/1402)
- Fix css alignment in add runtimes dropdown [1425](https://github.com/elyra-ai/elyra/pull/1425)
- Add pytest suite for airflow processor [1317](https://github.com/elyra-ai/elyra/pull/1317)
- Handle no runtimes configured on run/export/submit  [1404](https://github.com/elyra-ai/elyra/pull/1404)
- Update resource validation to check for null values [1413](https://github.com/elyra-ai/elyra/pull/1413)
- Add GitHub link to Runtimes UI [1410](https://github.com/elyra-ai/elyra/pull/1410)
- Use absolute path when exporting Airflow DAG to local file [1415](https://github.com/elyra-ai/elyra/pull/1415)
- Validate node resource requests for zero or negative values [1394](https://github.com/elyra-ai/elyra/pull/1394)
- Add warning before submitting modified notebook/script [1385](https://github.com/elyra-ai/elyra/pull/1385)
- Add reference documentation link to MetadataEditor [1386](https://github.com/elyra-ai/elyra/pull/1386)
- Fix pipeline error message not updating [1406](https://github.com/elyra-ai/elyra/pull/1406)
- Add reference to Apache Airflow tutorial to documentation [1310](https://github.com/elyra-ai/elyra/pull/1310)
- Update to canvas version 10.1.0 [1378](https://github.com/elyra-ai/elyra/pull/1378)
- Improve error handling when pipeline export pushes artifacts to COS [1377](https://github.com/elyra-ai/elyra/pull/1377)
- Update runtime configuration documentation topic [1393](https://github.com/elyra-ai/elyra/pull/1393)
- Add PyYAML version range based on kfp-tekton requirements [1392](https://github.com/elyra-ai/elyra/pull/1392)
- Fix dark mode for metadata editor UI [1369](https://github.com/elyra-ai/elyra/pull/1369)
- Add additional property for pipeline submission response [1364](https://github.com/elyra-ai/elyra/pull/1364)
- Include object storage requirement in Apache Airflow configuration guide
- Update Apache Airflow deployment documentation [1367](https://github.com/elyra-ai/elyra/pull/1367)
- Update release script to support release candidate [1365](https://github.com/elyra-ai/elyra/pull/1365)
- Update Tornado to release 6.1.0 [1272](https://github.com/elyra-ai/elyra/pull/1272)
- Add support for multiple schemas in Metadata Editor [1327](https://github.com/elyra-ai/elyra/pull/1327)
- Expose Github exceptions in a more user-friendly way [1366](https://github.com/elyra-ai/elyra/pull/1366)
- Update documentation with new Submit script feature [1357](https://github.com/elyra-ai/elyra/pull/1357)
- Formalize titles and descriptions in runtime schemas [1352](https://github.com/elyra-ai/elyra/pull/1352)
- Switch to using Material UI in metadata editor [1293](https://github.com/elyra-ai/elyra/pull/1293)
- Update Runtime configuration topic in the docs [1353](https://github.com/elyra-ai/elyra/pull/1353)
- Add support for submitting scripts as pipeline [1330](https://github.com/elyra-ai/elyra/pull/1330)
- Add pipeline source annotations to container ops [1331](https://github.com/elyra-ai/elyra/pull/1331)
- Refresh Apache Airflow configuration documentation [1311](https://github.com/elyra-ai/elyra/pull/1311)
- Add placeholder values to runtime configuration metadata [1345](https://github.com/elyra-ai/elyra/pull/1345)
- Group metadata tags with name and description [1347](https://github.com/elyra-ai/elyra/pull/1347)
- Update links in extension tracker documentation [1348](https://github.com/elyra-ai/elyra/pull/1348)
- Refactor Apache Airflow github functions to the utility module [1316](https://github.com/elyra-ai/elyra/pull/1316)
- Handle default field on metadata editor
- Add default url for github api endpoint
- Update KFP Notebook to 0.20.0 [1344](https://github.com/elyra-ai/elyra/pull/1344)
- Fix invalid documentation references [1342](https://github.com/elyra-ai/elyra/pull/1342)
- Honor default values for missing metadata properties [1336](https://github.com/elyra-ai/elyra/pull/1336)
- Tweak runtime metadata definitions for Airflow and Kubeflow [1296](https://github.com/elyra-ai/elyra/pull/1296)
- Improve pipeline node properties dark theme [1328](https://github.com/elyra-ai/elyra/pull/1328)
- Add support for K8s pod labels and annotations for KFP [1284](https://github.com/elyra-ai/elyra/pull/1284)
- Fix issues causing false circular dependency during validation [1309](https://github.com/elyra-ai/elyra/pull/1309)
- Properly propagate runtime info when submitting notebook [1306](https://github.com/elyra-ai/elyra/pull/1306)
- Update runtime image metadata configuration documentation [1283](https://github.com/elyra-ai/elyra/pull/1283)
- Add ability to include image pull policy with runtime image - [1279](https://github.com/elyra-ai/elyra/pull/1279)
- Add tags to Apache Airflow metadata schema [1294](https://github.com/elyra-ai/elyra/pull/1294)
- Update developer workflow documentation [1288](https://github.com/elyra-ai/elyra/pull/1288)
- Experimental support of Airflow as a pipeline runtime [490](https://github.com/elyra-ai/elyra/pull/490)
- Fix watch mode by including source files in the package [1269](https://github.com/elyra-ai/elyra/pull/1269)
- Properly propagate namespace on exported Python DSL [1275](https://github.com/elyra-ai/elyra/pull/1275)
- Update  KFP to 1.3.0 and KFP-Tekton to 0.6.0 [1276](https://github.com/elyra-ai/elyra/pull/1276)
- Fix dark theme for properties panel [1262](https://github.com/elyra-ai/elyra/pull/1262)
- Add details on how to determine workflow engine type
- Update docs to clarify definition of public registry [1258](https://github.com/elyra-ai/elyra/pull/1258)
- Refresh Elyra 2.x installation instructions [1255](https://github.com/elyra-ai/elyra/pull/1255)
- Document how to create/publish Elyra release [1247](https://github.com/elyra-ai/elyra/pull/1247)

## 2.0.1 (1/27/2021)

- Update to kfp-tekton 0.5.1rc1
- Update NBFormat to release 5.1.2

## 2.0.0 (1/26/2021)

High level enhancements
- Add support for JupyterLab 3.x 
- Add new Language Server Protocol (LSP) capabilities
- Add support for Kubeflow Pipelines using Argo and Tekton engines
- Publishing Elyra images to both docker.io and quay.io  
- Multiple updates to overall documentation
- Increased test coverage

Other enhancements and bug fixes

- Add support for running pipelines on Argo and Tekton [#1239](https://github.com/elyra-ai/elyra/pull/1239)
- Add support for pipeline node level resource configuration [#1203](https://github.com/elyra-ai/elyra/pull/1203)
- Update KFP Notebook to 0.18.0
- Rename application package to services [#1231](https://github.com/elyra-ai/elyra/pull/1231)
- Use kernel display name on Python editor dropdown [#1224](https://github.com/elyra-ai/elyra/pull/1224)
- Reenable git extension support [#1202](https://github.com/elyra-ai/elyra/pull/1202)
- Re-add support for showing resource utilization on status bar [#1204](https://github.com/elyra-ai/elyra/pull/1204)
- Replace pipeline node properties dialog with side pane [#1084](https://github.com/elyra-ai/elyra/pull/1084)
- Add 'Save as code snippet' from editor selection [#1186](https://github.com/elyra-ai/elyra/pull/1186)
- Add jupyterlab-lsp 3.0.0 integration [#1176](https://github.com/elyra-ai/elyra/pull/1176) [#1184](https://github.com/elyra-ai/elyra/pull/1184)
- Update to Jupyter Server 1.2.0 [#1178](https://github.com/elyra-ai/elyra/pull/1178)
- Update KFP Notebook to 0.17.0 and KFP 1.1.2 [#1162](https://github.com/elyra-ai/elyra/pull/1162)
- Update release script with publish option [#1151](https://github.com/elyra-ai/elyra/pull/1151)
- Update KFP Notebook to 0.16.0
- Enables removal of optiona metadata fields [#1155](https://github.com/elyra-ai/elyra/pull/1155)
- Set minio python package dependency to version <7 [#1143](https://github.com/elyra-ai/elyra/pull/1143) 
- Enable display of metrics and metadata in KFP UI [#1054](https://github.com/elyra-ai/elyra/pull/1054)
- Enable Elyra image to auto-start JupyterLab
- Update to JupyterHub SingleUser 0.10.6 docker image
- Upgrade KFP to version 1.1.0 [#1104](https://github.com/elyra-ai/elyra/pull/1104)
- Update Jupyter Client minimum version to 6.1.7 [#1099](https://github.com/elyra-ai/elyra/pull/1099)
- Add support to JupyterLab 3.0 RC [#1063](https://github.com/elyra-ai/elyra/pull/1063)
- Attribute Elyra copyright notice to Elyra authors [#1097](https://github.com/elyra-ai/elyra/pull/1097)
- Properly handle references to missing schema files [#1096](https://github.com/elyra-ai/elyra/pull/1096)
- Multiple enhancements to stabilize CI tests on GitHub actions slower environments
- Enhance pipeline circular reference detection [#1080](https://github.com/elyra-ai/elyra/pull/1080)
- Update Elyra Canvas to release 9.2.1 [#1082](https://github.com/elyra-ai/elyra/pull/1082)
- Implements "Add to Pipeline" context menu for py files [#1079](https://github.com/elyra-ai/elyra/pull/1079)
- Create a dropzone component for Pipeline Editor [#1062](https://github.com/elyra-ai/elyra/pull/1062)
- Update NodeJS to version 12.18 on CI environment
- Update Cypress to version 5.6.0

## 1.5.3 (1/12/2021)

- Update Elyra deployment documentation for Open Data Hub [#1182](https://github.com/elyra-ai/elyra/pull/1182)
- Remove 'enzime' dependency on Pipeline Editor tests [#1169](https://github.com/elyra-ai/elyra/pull/1169)

## 1.5.2 (12/14/2020)

- Update KFP Notebook to release v0.17.0
- Update KFP to release 1.1.2
- Add link to GitHub discussion forum to docs [#1150](https://github.com/elyra-ai/elyra/pull/1150)
- Add "getting help" section to documentation [#1100](https://github.com/elyra-ai/elyra/pull/1100)
- Update the metrics visualization content [#1156](https://github.com/elyra-ai/elyra/pull/1156)
- Add visualization recipe to documentation [#1057](https://github.com/elyra-ai/elyra/pull/1057)
- Enables removal of optiona metadata fields [#1155](https://github.com/elyra-ai/elyra/pull/1155)

## 1.5.1 (12/11/2020)

- Update KFP Notebook to release v0.16.0
- Update release script with publish option

## 1.5.0 (12/10/2020)

- Update KFP Notebook to 0.15.0 release
- Enable display of metrics and metadata in KFP UI [#1054](https://github.com/elyra-ai/elyra/pull/1054)
- Renames docker-image build target to container-image [#1141](https://github.com/elyra-ai/elyra/pull/1141)
- Set minio python package dependency to version <7  [#1143](https://github.com/elyra-ai/elyra/pull/1143)
- Upgrade KFP to version 1.1.0 [#1104](https://github.com/elyra-ai/elyra/pull/1104)

## 1.4.2 (12/04/2020)

- Enable Elyra image to auto-start JupyterLab
- Update to JupyterHub SingleUser 0.10.6 docker image [#1135](https://github.com/elyra-ai/elyra/pull/1135)
- Remove workdir setting from Elyra docker image [#1135](https://github.com/elyra-ai/elyra/pull/1135)
- Build both docker.io and quay.io tagged images [#1135](https://github.com/elyra-ai/elyra/pull/1135)
- Update Jupyter Client minimum version to 6.1.7  [#1099](https://github.com/elyra-ai/elyra/pull/1099)
- Properly handle references to missing schema files [#1096](https://github.com/elyra-ai/elyra/pull/1096)
- Support namespace configuration when using dex with kfp [#1081](https://github.com/elyra-ai/elyra/pull/1081)
- Update canvas version [#1082](https://github.com/elyra-ai/elyra/pull/1082)

## 1.4.1 (11/14/2020)

- Use JupyterLab SessionManager to execute Python scripts [#1071](https://github.com/elyra-ai/elyra/pull/1071) 
- Update to JupyterLab-git 0.23.1 [#1065](https://github.com/elyra-ai/elyra/pull/1065)
- Ensure local notebook nodes use local env [#1061](https://github.com/elyra-ai/elyra/pull/1061)
- Code Snippet drag and drop feature [#1043](https://github.com/elyra-ai/elyra/pull/1043)

## 1.4.0 (11/09/2020)

- Add the ability to search/filter to the metadata explorer [#985](https://github.com/elyra-ai/elyra/pull/985)
- Update documentation on containers and public container registries [#1039](https://github.com/elyra-ai/elyra/pull/1039)
- Flow kernel name to Jupyter Enterprise Gateway [#1031](https://github.com/elyra-ai/elyra/pull/1031)
- Add tags and descriptions to default runtime images [#1023](https://github.com/elyra-ai/elyra/pull/1023)
- Propagate local env when running local python node [#1047](https://github.com/elyra-ai/elyra/pull/1047)
- Fix variable formatting in jinja template used by export [#1027](https://github.com/elyra-ai/elyra/pull/1027)
- Update JupyterLab Git extension to version 0.22.3 [#1017](https://github.com/elyra-ai/elyra/pull/1017)
- Build source distro for individual extensions [#1018](https://github.com/elyra-ai/elyra/pull/1018)
- Update UI integration tests to use non-standard port [#1024](https://github.com/elyra-ai/elyra/pull/1024)
- Update install docs on how to install individual extensions [#1009](https://github.com/elyra-ai/elyra/pull/1009)

## 1.3.3 (10/23/2020)

- Package extension dependencies with Elyra single extension wheel [#998](https://github.com/elyra-ai/elyra/pull/998)

## 1.3.2 (10/23/2020)

- Update release to build 'elyra-server' before 'elyra'  [#997](https://github.com/elyra-ai/elyra/pull/997)

## 1.3.1 (10/23/2020)

- Fix deployment of individual Elyra extensions  [#996](https://github.com/elyra-ai/elyra/pull/996)

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
