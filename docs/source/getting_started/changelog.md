# Changelog

## Release 3.4.0rc1 - 12/16/2021

- Update pipeline editor package to 1.5.0 - [#2367](https://github.com/elyra-ai/elyra/pull/2367)
- Fix runtime property display in pipeline editor UI - [#2363](https://github.com/elyra-ai/elyra/pull/2363)
- Set default value for kfp component property - [#2365](https://github.com/elyra-ai/elyra/pull/2365)

## Release 3.4.0rc0 - 12/15/2021

- Update pipeline editor package to 1.5.0rc1 - [#2364](https://github.com/elyra-ai/elyra/pull/2364)
- Allow Kubeflow node inputValues to consume outputPath outputs - [#2350](https://github.com/elyra-ai/elyra/pull/2350)
- Enforce authentication type constraints in KFP RTCs - [#2356](https://github.com/elyra-ai/elyra/pull/2356)
- Add explicit support for COS authentication types to runtime configurations - [#2354](https://github.com/elyra-ai/elyra/pull/2354)
- Catch cloud storage connectivity issues before processing pipeline - [#2362](https://github.com/elyra-ai/elyra/pull/2362)
- Fix KUBERNETES_SERVICE_ACCOUNT_TOKEN auth - [#2358](https://github.com/elyra-ai/elyra/pull/2358)
- Fix version references in installation documentation - [#2359](https://github.com/elyra-ai/elyra/pull/2359)
- Enable async component cache updates using SingletonConfigurable - [#2349](https://github.com/elyra-ai/elyra/pull/2349)
- Fix code snippet language check - [#2346](https://github.com/elyra-ai/elyra/pull/2346)
- Add support for AWS IRSA - [#2335](https://github.com/elyra-ai/elyra/pull/2335)
- Rework docker image build - [#2344](https://github.com/elyra-ai/elyra/pull/2344)
- Add Elyra 3.3 blog post to resources topic - [#2351](https://github.com/elyra-ai/elyra/pull/2351)
- Fix typo in Kubeflow auth type setting name - [#2353](https://github.com/elyra-ai/elyra/pull/2353)
- Re-add integration test for runtime specific components in the palette - [#2340](https://github.com/elyra-ai/elyra/pull/2340)
- Add resources topic to overview - [#2345](https://github.com/elyra-ai/elyra/pull/2345)
- Update Setup.py to Fix KFP requirements - [#2342](https://github.com/elyra-ai/elyra/pull/2342)
- Add catalog type information to DAG for custom components - [#2336](https://github.com/elyra-ai/elyra/pull/2336)

## Release 3.3.0 - 12/03/2021


## Release 3.3.0rc2 - 12/01/2021

- Update release script - [#2334](https://github.com/elyra-ai/elyra/pull/2334)
- Update pipeline-editor version to 1.4 - [#2331](https://github.com/elyra-ai/elyra/pull/2331)
- Reintroduce error handling for pipeline export - [#2333](https://github.com/elyra-ai/elyra/pull/2333)
- Fix export file type options for KFP platform - [#2327](https://github.com/elyra-ai/elyra/pull/2327)
- support operators with type hints - [#2316](https://github.com/elyra-ai/elyra/pull/2316)
- Fix component catalog UI sorting - [#2330](https://github.com/elyra-ai/elyra/pull/2330)

## Release 3.3.0rc1 - 11/30/2021

- Update pipeline version to 6 and pin versions - [#2321](https://github.com/elyra-ai/elyra/pull/2321)
- Set the default xcom_push for Airflow operators - [#2313](https://github.com/elyra-ai/elyra/pull/2313)
- Fix export dialog title for generic pipelines - [#2320](https://github.com/elyra-ai/elyra/pull/2320)
- Add error to Troubleshooting guide when on z shell - [#2326](https://github.com/elyra-ai/elyra/pull/2326)
- Fix typo in overview documentation - [#2325](https://github.com/elyra-ai/elyra/pull/2325)
- Document migration strategies for BYO schemas - [#2318](https://github.com/elyra-ai/elyra/pull/2318)
- Update pipeline styles - [#2236](https://github.com/elyra-ai/elyra/pull/2236)
- Add packaging section to installation documentation - [#2315](https://github.com/elyra-ai/elyra/pull/2315)
- Fix generic export corner case - [#2314](https://github.com/elyra-ai/elyra/pull/2314)
- Add support for runtime type resources - [#2305](https://github.com/elyra-ai/elyra/pull/2305)
- Add component catalog guide to VPE - [#2304](https://github.com/elyra-ai/elyra/pull/2304)

## Release 3.3.0rc0 - 11/17/2021

- Update hybrid runtime support topic in overview doc - [#2310](https://github.com/elyra-ai/elyra/pull/2310)
- Fix incorrect app data runtime parameter name - [#2312](https://github.com/elyra-ai/elyra/pull/2312)
- Fix incorrect reference to upstream operator when duplicate exists - [#2306](https://github.com/elyra-ai/elyra/pull/2306)
- Refactor Pipeline Editor UI to better support Runtime Types - [#2287](https://github.com/elyra-ai/elyra/pull/2287)
- Update components section with migration instructions - [#2302](https://github.com/elyra-ai/elyra/pull/2302)
- Exclude markdown 3.3.5 in documentation build requirements - [#2308](https://github.com/elyra-ai/elyra/pull/2308)
- Make component examples an optional Elyra feature - [#2286](https://github.com/elyra-ai/elyra/pull/2286)
- Add support for data exchange between airflow operators - [#2244](https://github.com/elyra-ai/elyra/pull/2244)
- Remove redundant entry from pipeline validation endpoint - [#2303](https://github.com/elyra-ai/elyra/pull/2303)
- Fix frontend metadata title - [#2296](https://github.com/elyra-ai/elyra/pull/2296)
- Bump postcss from 7.0.35 to 7.0.39 - [#2295](https://github.com/elyra-ai/elyra/pull/2295)
- Bump path-parse from 1.0.6 to 1.0.7 - [#2294](https://github.com/elyra-ai/elyra/pull/2294)
- Bump tmpl from 1.0.4 to 1.0.5 - [#2289](https://github.com/elyra-ai/elyra/pull/2289)
- Bump tar from 4.4.13 to 4.4.19 - [#2290](https://github.com/elyra-ai/elyra/pull/2290)
- Bump ws from 5.2.2 to 5.2.3 - [#2291](https://github.com/elyra-ai/elyra/pull/2291)
- Bump axios from 0.21.1 to 0.21.4 - [#2292](https://github.com/elyra-ai/elyra/pull/2292)
- Add hidden flag for fields not to be displayed in editor - [#2288](https://github.com/elyra-ai/elyra/pull/2288)
- Add new component catalogs schemaspace - [#2282](https://github.com/elyra-ai/elyra/pull/2282)
- Remove display_name property from schema - [#2267](https://github.com/elyra-ai/elyra/pull/2267)
- Add support for runtime types - [#2263](https://github.com/elyra-ai/elyra/pull/2263)
- Add 'BYO component catalog connector' topic to 'developer guide' - [#2280](https://github.com/elyra-ai/elyra/pull/2280)
- Reduce airflow component parser output - [#2285](https://github.com/elyra-ai/elyra/pull/2285)
- Improve KF authentication handling - [#2257](https://github.com/elyra-ai/elyra/pull/2257)
- Enable building Elyra docker image from current source code - [#2274](https://github.com/elyra-ai/elyra/pull/2274)
- Fix contents handler path handling - [#2279](https://github.com/elyra-ai/elyra/pull/2279)
- Update to Kubeflow image to Jupyter base 1.4
- Update to JupyterHub Single User image version 1.2.0
- Improve error messaging for comparisons involving entrypoints - [#2276](https://github.com/elyra-ai/elyra/pull/2276)
- Sort palette nodes by component label - [#2277](https://github.com/elyra-ai/elyra/pull/2277)
- Add environment variable for `max_readers` in CatalogConnector - [#2271](https://github.com/elyra-ai/elyra/pull/2271)
- Generalize component reading and processing for BYO catalog-types - [#2241](https://github.com/elyra-ai/elyra/pull/2241)
- Check for major version only in bootstrapper test - [#2264](https://github.com/elyra-ai/elyra/pull/2264)
- Sort palette alphabetically - [#2250](https://github.com/elyra-ai/elyra/pull/2250)
- Update validation checks for non remote submission scenarios - [#2251](https://github.com/elyra-ai/elyra/pull/2251)
- Support per-catalog cache updates for improved performance - [#2253](https://github.com/elyra-ai/elyra/pull/2253)
- Fix validation checks for malformed inputpath in kfp pipelines - [#2226](https://github.com/elyra-ai/elyra/pull/2226)
- Add yarn install steps to development workflow - [#2252](https://github.com/elyra-ai/elyra/pull/2252)
- Update README with badge and link to Elyra website
- Upgrade kfp-tekton dependency to 1.0.1 - [#2215](https://github.com/elyra-ai/elyra/pull/2215)
- Remove determination of absolute path value in KFP processor - [#2234](https://github.com/elyra-ai/elyra/pull/2234)
- Refactor add pipeline launcher buttons / file > new menu logic - [#2225](https://github.com/elyra-ai/elyra/pull/2225)
- Add additional details in elyra-pipeline describe command - [#2221](https://github.com/elyra-ai/elyra/pull/2221)

## Release 3.2.1 - 10/18/2021

- Fix run name issue for KubeFlow v1.4 - [#2237](https://github.com/elyra-ai/elyra/pull/2237)
- Replace missing `metadata_class_name` in Component Registry schema - [#2233](https://github.com/elyra-ai/elyra/pull/2233)
- Support KFP with LDAP Dex auth - [#2212](https://github.com/elyra-ai/elyra/pull/2212)
- Fixes issue that produces invalid container image on migration - [#2231](https://github.com/elyra-ai/elyra/pull/2231)
- Use ServerApp.root_dir to set directory for cypress tests - [#2235](https://github.com/elyra-ai/elyra/pull/2235)
- Add front end integration tests for python and R editor operations - [#2216](https://github.com/elyra-ai/elyra/pull/2216)
- Clean up changelog

## Release 3.2.0 - 10/12/2021

- Make small changes to KFP DSL export template - [#2222](https://github.com/elyra-ai/elyra/pull/2222)
- Validate runtime image format with regex - [#2213](https://github.com/elyra-ai/elyra/pull/2213)
- Update developer testing documentation - [#2207](https://github.com/elyra-ai/elyra/pull/2207)
- Exclude kfp dependency version 1.7.2 - [#2209](https://github.com/elyra-ai/elyra/pull/2209)
- Tolerate components w/ no dependencies, add tests with custom components - [#2206](https://github.com/elyra-ai/elyra/pull/2206)
- Fix ability to override pipeline name at submission - [#2205](https://github.com/elyra-ai/elyra/pull/2205)
- Refactor kubeflow pipelines flow and improve dex auth - [#2167](https://github.com/elyra-ai/elyra/pull/2167)
- Support data exchange between KFP components - [#2094](https://github.com/elyra-ai/elyra/pull/2094)
- Use tmpdir fixture instead of /tmp/lib in bootstrapper test - [#2200](https://github.com/elyra-ai/elyra/pull/2200)
- Clean up svg files - [#2195](https://github.com/elyra-ai/elyra/pull/2195)
- Fix metadata class links - [#2198](https://github.com/elyra-ai/elyra/pull/2198)
- Fix pipeline name calculation algorithm - [#2181](https://github.com/elyra-ai/elyra/pull/2181)
- Update component registry schema to enforce length for categories - [#2193](https://github.com/elyra-ai/elyra/pull/2193)
- Implement Bring Your Own Schemas and Schemaspaces feature - [#2109](https://github.com/elyra-ai/elyra/pull/2109)
- Add stub for 'custom pipeline components' topic to docs - [#2179](https://github.com/elyra-ai/elyra/pull/2179)
- Document issue management workflow - [#2035](https://github.com/elyra-ai/elyra/pull/2035)
- Refactor tests to common parent folder to better code sharing - [#2160](https://github.com/elyra-ai/elyra/pull/2160)
- Add link to KFP custom component tutorial - [#2178](https://github.com/elyra-ai/elyra/pull/2178)
- Add link to hackmd dev meeting notes to documentation - [#2177](https://github.com/elyra-ai/elyra/pull/2177)
- Add daily dev meeting info to docs - [#2176](https://github.com/elyra-ai/elyra/pull/2176)
- Parallelize reading of component definitions in registry - [#2169](https://github.com/elyra-ai/elyra/pull/2169)
- Remove unnecessary files from Elyra python distro
- Update root readme with daily scrum info - [#2172](https://github.com/elyra-ai/elyra/pull/2172)
- Add 'properties' element to run as pipeline template - [#2170](https://github.com/elyra-ai/elyra/pull/2170)
- Add rollback to metadata when post_save/delete hooks throw - [#2163](https://github.com/elyra-ai/elyra/pull/2163)
- Add manage pipeline components content to user guide - [#2104](https://github.com/elyra-ai/elyra/pull/2104)
- Update docs for Troubleshooting and Contribution sections - [#2149](https://github.com/elyra-ai/elyra/pull/2149)
- Fix caching to update immediately after component registry modifications - [#2157](https://github.com/elyra-ai/elyra/pull/2157)
- Comment out support for '[item1,item2]'; breaks int, bool, number
- Handle non-quoted items in array
- Attempt to coerce string values for array types to lists
- Catch argument errors and display formatting hints
- Add argo icon to ui-components - [#2156](https://github.com/elyra-ai/elyra/pull/2156)
- Refactor different runtimes into its own folder/module - [#2125](https://github.com/elyra-ai/elyra/pull/2125)
- Enable json option for pipeline cli commands - [#2118](https://github.com/elyra-ai/elyra/pull/2118)
- Add export pipeline to Python DSL test case - [#2142](https://github.com/elyra-ai/elyra/pull/2142)
- Reformat the processor registration logging - [#2155](https://github.com/elyra-ai/elyra/pull/2155)
- Make improvements to Airflow DAG render - [#2131](https://github.com/elyra-ai/elyra/pull/2131)
- Properly describe empty pipelines using Pipelines CLI - [#2115](https://github.com/elyra-ai/elyra/pull/2115)
- Fix pipeline upload on Windows system - [#2150](https://github.com/elyra-ai/elyra/pull/2150)

## Release 3.1.1 - 09/15/2021

- Update Pipeline Editor to version 1.2.0 - [#2143](https://github.com/elyra-ai/elyra/pull/2143)
- Add notes about packaging changes - [#2148](https://github.com/elyra-ai/elyra/pull/2148)
- Fix module name for KFP export template - [#2141](https://github.com/elyra-ai/elyra/pull/2141)
- Add additional safeguards to list and dictionary parameter types - [#2127](https://github.com/elyra-ai/elyra/pull/2127)
- Update elyra installation documentation - [#2137](https://github.com/elyra-ai/elyra/pull/2137)
- Bump elyra version in KF Dockerfile - [#2132](https://github.com/elyra-ai/elyra/pull/2132)
- Update/add fixtures to setup factory metadata instances
- Small validation fixes for pipeline references and cleanup
- Fix Copyright year/attribution
- Fix instances of type attribute in processors - [#2126](https://github.com/elyra-ai/elyra/pull/2126)
- Fix bootstrapper start_minio test fixture - [#2122](https://github.com/elyra-ai/elyra/pull/2122)
- Update correct filename on publish goal of release script - [#2123](https://github.com/elyra-ai/elyra/pull/2123)

## Release 3.1.0 - 09/09/2021

- Update elyra docker image to install all extra pkgs
- Migrate component registry to the metadata service - [#2083](https://github.com/elyra-ai/elyra/pull/2083)
- Refactor: Improve Kubeflow docker image - [#2114](https://github.com/elyra-ai/elyra/pull/2114)
- Add support for validating pipelines via CLI - [#2112](https://github.com/elyra-ai/elyra/pull/2112)
- Pipeline definition abstraction - [#2082](https://github.com/elyra-ai/elyra/pull/2082)
- Fix path and capture problem determination data during execution - [#2077](https://github.com/elyra-ai/elyra/pull/2077)
- Add support for private container image registries - [#2092](https://github.com/elyra-ai/elyra/pull/2092)
- Add DAG repo to airflow submission response messages
- Treat doc build warnings as errors - [#2099](https://github.com/elyra-ai/elyra/pull/2099)
- Fix mismatched runtime handling for run command - [#2068](https://github.com/elyra-ai/elyra/pull/2068)
- Fix broken link in CLI documentation topic - [#2098](https://github.com/elyra-ai/elyra/pull/2098)
- Expose pipeline description to runtime environments - [#2086](https://github.com/elyra-ai/elyra/pull/2086)
- Move kfp-tekton dependency to extras - [#2043](https://github.com/elyra-ai/elyra/pull/2043)
- Update pipeline-editor version to 1.1.0 - [#2093](https://github.com/elyra-ai/elyra/pull/2093)
- Defer import of black to postpone logging noise - [#2090](https://github.com/elyra-ai/elyra/pull/2090)
- Remove kfserving component file from config folder - [#2078](https://github.com/elyra-ai/elyra/pull/2078)
- Add mention to pipeline 'describe' command to cli docs - [#2074](https://github.com/elyra-ai/elyra/pull/2074)
- Add pipeline version validation rules and tests - [#2071](https://github.com/elyra-ai/elyra/pull/2071)
- Minor refactoring based on Sourcery code analyses tool - [#2027](https://github.com/elyra-ai/elyra/pull/2027)
- Add support for Schema Filters - [#2062](https://github.com/elyra-ai/elyra/pull/2062)
- Improve validation output in elyra-pipeline CLI - [#2070](https://github.com/elyra-ai/elyra/pull/2070)
- Add Describe Command to pipeline CLI - [#1995](https://github.com/elyra-ai/elyra/pull/1995)
- Update release docs with environment setup requirements - [#2063](https://github.com/elyra-ai/elyra/pull/2063)
- Add documentation note to GitHub PR template - [#2064](https://github.com/elyra-ai/elyra/pull/2064)
- Block pipeline-editor from showing multiple error dialogs - [#2045](https://github.com/elyra-ai/elyra/pull/2045)
- Fix typo on individual runtime extensions location

## Release 3.0.1 - 08/18/2021

- Update release to publish individual runtime extensions
- Update pipeline CLI to avoid false-positive warning msg - [#2057](https://github.com/elyra-ai/elyra/pull/2057)
- Account for components with no component parameters - [#2056](https://github.com/elyra-ai/elyra/pull/2056)
- Enable release of individual Elyra runtime extensions - [#2047](https://github.com/elyra-ai/elyra/pull/2047)
- Update pipeline cli to tolerate empty pipelines - [#2050](https://github.com/elyra-ai/elyra/pull/2050)
- Requires minimum JupyterLab 3.0.17 - [#2052](https://github.com/elyra-ai/elyra/pull/2052)
- Remove obsolete migration script - [#2053](https://github.com/elyra-ai/elyra/pull/2053)
- Check for relative path when validating node label - [#2030](https://github.com/elyra-ai/elyra/pull/2030)
- Relax kfp sdk and kfp-tekton dependency - [#2034](https://github.com/elyra-ai/elyra/pull/2034)
- Standardize processing of custom component parameters types - [#2038](https://github.com/elyra-ai/elyra/pull/2038)
- Update pipeline cli to handle errors without node info - [#2041](https://github.com/elyra-ai/elyra/pull/2041)
- Make pipeline CLI preprocessing parameters optional - [#2039](https://github.com/elyra-ai/elyra/pull/2039)
- Update GitHub issue-template.md - [#2026](https://github.com/elyra-ai/elyra/pull/2026)

## Release 3.0.0 - 08/03/2021

High level enhancements
- Enable creation of pipelines specific to a runtime
- Enable support for runtime specific components
- Increased Elyra pipeline version to 4 with auto-migration support enabled
- Integrate new content parser with support for refreshing environment vars from
  notebooks and scripts
- New Pipeline validation service
- Support for KFP 1.6.3 / Tekton 0.8.1 
- Fix DEX authentication issues
- Upgraded to new Pipeline Editor version 1.0.0 and Elyra Canvas to version 11.0.0
- Update to JupyterLab LSP 3.8.0 and migrate to python-lsp-server as the Python language server
- Update to JupyterLab Git 0.32.0

Security Fixes
- Update urllib3 to v1.26.5 and requests to v2.25.1 - [#1841](https://github.com/elyra-ai/elyra/pull/1841)

Other enhancements and bug fixes
- Single node pipeline dependencies should be an array - [#2015](https://github.com/elyra-ai/elyra/pull/2015)
- Remove KFServing from KFP Component Registry - [#2013](https://github.com/elyra-ai/elyra/pull/2013)
- Update pipeline-editor version to 1.0.0 - [#2011](https://github.com/elyra-ai/elyra/pull/2011)
- Update JupyterLab LSP to version 3.8.0 - [#2011](https://github.com/elyra-ai/elyra/pull/2011)
- Update Jupyterlab GIT to version 0.32.0 - [#2011](https://github.com/elyra-ai/elyra/pull/2011)
- Pin click dependency to KFP 1.6.3 required version - [#2010](https://github.com/elyra-ai/elyra/pull/2010)
- Remove slack operator base class definition from palette - [#2007](https://github.com/elyra-ai/elyra/pull/2007)
- Add missing node label for single file pipeline submission - [#2005](https://github.com/elyra-ai/elyra/pull/2005)
- Update link to requirements-elyra.txt in runtime specific docs
- Update pipeline validation label check - [#2004](https://github.com/elyra-ai/elyra/pull/2004)
- Integrate Pipeline CLI with new validation service - [#1993](https://github.com/elyra-ai/elyra/pull/1993)
- Migrate to use python-lsp-server as the Python language server - [#1996](https://github.com/elyra-ai/elyra/pull/1996)
- Document install-server make task for backend build - [#1980](https://github.com/elyra-ai/elyra/pull/1980)
- Refactor airflow-notebook package back into elyra core - [#1925](https://github.com/elyra-ai/elyra/pull/1925)
- Re-enable tests for KFP pipelines with custom components - [#1990](https://github.com/elyra-ai/elyra/pull/1990)
- Update validation service to accept missing optional fields - [#1992](https://github.com/elyra-ai/elyra/pull/1992)
- Convert exception to string for error handling - [#1988](https://github.com/elyra-ai/elyra/pull/1988)
- Properly evaluate list params when processing KFP components - [#1983](https://github.com/elyra-ai/elyra/pull/1983)
- Improve 'run notebook' KFP component specification - [#1987](https://github.com/elyra-ai/elyra/pull/1987)
- Handle connection error when fetching kfp session cookie - [#1972](https://github.com/elyra-ai/elyra/pull/1972)
- Update pipeline-editor version to 0.11.3 - [#1985](https://github.com/elyra-ai/elyra/pull/1985)
- Fix error case where error handler throws error - [#1984](https://github.com/elyra-ai/elyra/pull/1984)
- Pipeline validation service initial implementation - [#1664](https://github.com/elyra-ai/elyra/pull/1664)
- Uncap jinja2 and nbconvert dependency version - [#1971](https://github.com/elyra-ai/elyra/pull/1971)
- Refactor component location to jupyter/shared/components/runtime - [#1974](https://github.com/elyra-ai/elyra/pull/1974)
- Fix CI dialog selector after Lab 3.1 release - [#1973](https://github.com/elyra-ai/elyra/pull/1973)
- Resolve component name errors in component registry - [#1969](https://github.com/elyra-ai/elyra/pull/1969)
- Fix computation of absolute path for url-based KFP components - [#1957](https://github.com/elyra-ai/elyra/pull/1957)
- Properly display description/type information in node properties - [#1970](https://github.com/elyra-ai/elyra/pull/1970)
- Set KFP component display name to the provided node label - [#1968](https://github.com/elyra-ai/elyra/pull/1968)
- Derive elyra extension from ExtensionApp - [#1876](https://github.com/elyra-ai/elyra/pull/1876)
- Update JupyterLab launcher page image in README - [#1917](https://github.com/elyra-ai/elyra/pull/1917)
- Make 'name' optional when parsing a component registry entry - [#1958](https://github.com/elyra-ai/elyra/pull/1958)
- Use enter key to save and submit metadata editor form - [#1962](https://github.com/elyra-ai/elyra/pull/1962)
- Followup refactor to component & category parsing - [#1948](https://github.com/elyra-ai/elyra/pull/1948)
- Update 'runtime image configuration' topic in User Guide - [#1933](https://github.com/elyra-ai/elyra/pull/1933)
- Update operation naming for airflow custom components - [#1961](https://github.com/elyra-ai/elyra/pull/1961)
- Update tutorial references in documentation overview - [#1919](https://github.com/elyra-ai/elyra/pull/1919)
- Update pipeline-editor to v0.11.2 to fix env-vars refresh - [#1952](https://github.com/elyra-ai/elyra/pull/1952)
- Update Airflow operation naming for uniqueness - [#1950](https://github.com/elyra-ai/elyra/pull/1950)
- Prettify pipeline json on migrate - [#1947](https://github.com/elyra-ai/elyra/pull/1947)
- Update pipeline editor dialog message for unsupported files - [#1935](https://github.com/elyra-ai/elyra/pull/1935)
- Update Apache Airflow jinja template DAG creation logic - [#1945](https://github.com/elyra-ai/elyra/pull/1945)
- Update pipeline properties error message theme - [#1939](https://github.com/elyra-ai/elyra/pull/1939)
- Improve how type info is inferred during component parsing - [#1936](https://github.com/elyra-ai/elyra/pull/1936)
- Avoid deleting test resources during make clean - [#1946](https://github.com/elyra-ai/elyra/pull/1946)
- Fix Pipeline node property resources fields style - [#1942](https://github.com/elyra-ai/elyra/pull/1942)
- Restructure pipeline JSON to prevent custom components from breaking - [#1882](https://github.com/elyra-ai/elyra/pull/1882)
- Fix Open File command for pipeline nodes - [#1937](https://github.com/elyra-ai/elyra/pull/1937)
- Fix exporting generic pipelines to python script - [#1927](https://github.com/elyra-ai/elyra/pull/1927)
- Rename KFP NotebookOp to ExecuteFileOp
- Merge support for KFP operator into main Elyra repo
- Set 'required' attribute default to True for KFP components - [#1916](https://github.com/elyra-ai/elyra/pull/1916)
- Add descriptions to component types in palette - [#1913](https://github.com/elyra-ai/elyra/pull/1913)
- Log and skip pipeline components with invalid location - [#1872](https://github.com/elyra-ai/elyra/pull/1872)
- Enable migration from previous pipeline versions - [#1860](https://github.com/elyra-ai/elyra/pull/1860)
- Update 'pipelines' topic in User Guide - [#1848](https://github.com/elyra-ai/elyra/pull/1848)
- Add Python 3.9 to CI integration test matrix - [#1908](https://github.com/elyra-ai/elyra/pull/1908)
- Fix and enable linting on package __init__ files - [#1909](https://github.com/elyra-ai/elyra/pull/1909)
- Initialize component defaults when double clicking palette nodes - [#1902](https://github.com/elyra-ai/elyra/pull/1902)
- Update kfp component files to include optional parameter - [#1854](https://github.com/elyra-ai/elyra/pull/1854)
- Add 'Pipeline components' topic to the user guide docs - [#1839](https://github.com/elyra-ai/elyra/pull/1839)
- Fix icon related console warnings and errors - [#1897](https://github.com/elyra-ai/elyra/pull/1897)
- Move doc images to proper directory location - [#1898](https://github.com/elyra-ai/elyra/pull/1898)
- Run lint in fix mode when building, but in check mode in CI - [#1894](https://github.com/elyra-ai/elyra/pull/1894)
- Update Pipeline Editor to 0.10.1 - [#1891](https://github.com/elyra-ai/elyra/pull/1891)
- Update material-ui version to 4.12.1 and fix console error - [#1885](https://github.com/elyra-ai/elyra/pull/1885)
- Update list of component parameters to avoid parsing errors - [#1887](https://github.com/elyra-ai/elyra/pull/1887)
- Update to KFP v1.6.3 and KFP-Tekton v0.8.1 - [#1884](https://github.com/elyra-ai/elyra/pull/1884)
- Update KFP Notebook to 0.26.0
- Add ‘extensions’ to palette for Pipeline generic components - [#1828](https://github.com/elyra-ai/elyra/pull/1828)
- Update palette JSON to support new pipeline editor features - [#1863](https://github.com/elyra-ai/elyra/pull/1863)
- Update build step to not rely on a globally installed lerna - [#1865](https://github.com/elyra-ai/elyra/pull/1865)
- Enable and enforce import orders on python lint - [#1861](https://github.com/elyra-ai/elyra/pull/1861)
- Add support for left palette panel in PipelineEditor props - [#1844](https://github.com/elyra-ai/elyra/pull/1844)
- Update Pipeline Editor to 0.9.0 and Canvas to 11.0.0 - [#1864](https://github.com/elyra-ai/elyra/pull/1864)
- Add snapshot testing for pipeline files - [#1792](https://github.com/elyra-ai/elyra/pull/1792)
- Refactor pipeline component parsing to be owned by processors - [#1801](https://github.com/elyra-ai/elyra/pull/1801)
- Add runtime images button to pipeline editor toolbar - [#1858](https://github.com/elyra-ai/elyra/pull/1858)
- Document best practices for file-based nodes in user guide - [#1803](https://github.com/elyra-ai/elyra/pull/1803)
- Add basic caching to metadata file storage - [#1846](https://github.com/elyra-ai/elyra/pull/1846)
- Fix binder build failures - [#1853](https://github.com/elyra-ai/elyra/pull/1853)
- Adjust CI tests to new IPython kernel release - [#1855](https://github.com/elyra-ai/elyra/pull/1855)
- Update docs/recipe KFP version reference to 1.4.0 - [#1852](https://github.com/elyra-ai/elyra/pull/1852)
- Add integration tests for pipeline export options - [#1842](https://github.com/elyra-ai/elyra/pull/1842)
- Update Pipeline Editor to 0.8.0 - [#1847](https://github.com/elyra-ai/elyra/pull/1847)
- Update urllib3 to v1.26.5 and requests to v2.25.1 - [#1841](https://github.com/elyra-ai/elyra/pull/1841)
- Add support for ELYRA_RUN_NAME environment variable - [#1732](https://github.com/elyra-ai/elyra/pull/1732)
- Update KFP Notebook to 0.25.0 - [#1840](https://github.com/elyra-ai/elyra/pull/1840)
- Check pipeline version before run/submit pipeline with CLI - [#1830](https://github.com/elyra-ai/elyra/pull/1830)
- Update CLI to consider runtime specific pipelines - [#1805](https://github.com/elyra-ai/elyra/pull/1805)
- Add integration tests for runtime specific pipelines - [#1815](https://github.com/elyra-ai/elyra/pull/1815)
- List 'Apache Airflow' as supported runtime for Pipeline Editor - [#1826](https://github.com/elyra-ai/elyra/pull/1826)
- Update node property array control css to use all real state - [#1800](https://github.com/elyra-ai/elyra/pull/1800)
- Update incorrect kfp component reference in catalog - [#1825](https://github.com/elyra-ai/elyra/pull/1825)
- Update Pipeline Editor to 0.7.0 and Canvas to 10.9.0 - [#1822](https://github.com/elyra-ai/elyra/pull/1822)
- Make clean was not unlinking pipeline-editor - [#1817](https://github.com/elyra-ai/elyra/pull/1817)
- Update jupyterlab-git to v0.30.x and NBDime to v3.1 - [#1820](https://github.com/elyra-ai/elyra/pull/1820)
- Add back artifact/log collection for cypress tests - [#1819](https://github.com/elyra-ai/elyra/pull/1819)
- Avoid using null default values for component parameters - [#1802](https://github.com/elyra-ai/elyra/pull/1802)
- Finalize initial list of components for KFP and Airflow - [#1791](https://github.com/elyra-ai/elyra/pull/1791)
- Update jupyterlab-lsp to version 3.7.0 - [#1818](https://github.com/elyra-ai/elyra/pull/1818)
- Update Airflow template to use operation agnostic names - [#1808](https://github.com/elyra-ai/elyra/pull/1808)
- Validate that component catalog location exists - [#1811](https://github.com/elyra-ai/elyra/pull/1811)
- Adds caching and parallelization to GitHub Actions CI - [#1671](https://github.com/elyra-ai/elyra/pull/1671)
- Properly handle empty pipeline in Pipeline Editor clear button - [#1796](https://github.com/elyra-ai/elyra/pull/1796)
- Update yarn.lock with Pipeline Editor v0.6.0
- Support runtime specific component parameter type - [#1764](https://github.com/elyra-ai/elyra/pull/1764)
- Temporary remove KFP Python DSL export option - [#1770](https://github.com/elyra-ai/elyra/pull/1770)
- Update Airflow DAG jinja template to correct package imports - [#1788](https://github.com/elyra-ai/elyra/pull/1788)
- Update missing server-side pipeline node properties - [#1790](https://github.com/elyra-ai/elyra/pull/1790)
- Fix runtime configuration location on pipeline json - [#1776](https://github.com/elyra-ai/elyra/pull/1776)
- Update Pipeline Editor to version 0.6.0 - [#1794](https://github.com/elyra-ai/elyra/pull/1794)
- Add loader animation to Pipeline Editor - [#1793](https://github.com/elyra-ai/elyra/pull/1793)
- Support exporting pipelines for KF DEX secured envs - [#1758](https://github.com/elyra-ai/elyra/pull/1758)
- Remove Pipeline Editor dead/obsolete code - [#1779](https://github.com/elyra-ai/elyra/pull/1779)
- Reduce the number of duplicate calls to backend services - [#1757](https://github.com/elyra-ai/elyra/pull/1757)
- Fix runtime specific component support for dict parameters - [#1775](https://github.com/elyra-ai/elyra/pull/1775)
- Ensure MetadataManager.get() has a value for 'name' - [#1778](https://github.com/elyra-ai/elyra/pull/1778)
- Add support for global pipeline properties - [#1708](https://github.com/elyra-ai/elyra/pull/1708)
- Do not show iconLabel in Command Palette - [#1774](https://github.com/elyra-ai/elyra/pull/1774)
- Add test case for Pipeline node properties array item bug - [#1496](https://github.com/elyra-ai/elyra/pull/1496)
- Add tooltip to Python Editor output buttons - [#1754](https://github.com/elyra-ai/elyra/pull/1754)
- Made code snippet tag text truncate if it's too long - [#1744](https://github.com/elyra-ai/elyra/pull/1744)
- Add support for pipeline runtime specific components - [#1620](https://github.com/elyra-ai/elyra/pull/1620)
- Update "Contributing to the Elyra documentation" docs section - [#1743](https://github.com/elyra-ai/elyra/pull/1743)
- Updated code snippets image on documentation - [#1731](https://github.com/elyra-ai/elyra/pull/1731)
- Update documentation for running integration tests
- Update Readme/Docs feature overview outline - [#1720](https://github.com/elyra-ai/elyra/pull/1720)
- Update docs to recommend using pip3 instead of pip - [#1718](https://github.com/elyra-ai/elyra/pull/1718)
- Normalize KFP endpoint URL on KFP Processor - [#1711](https://github.com/elyra-ai/elyra/pull/1711)
- Move note on pip version to top of pip section
- Add metadata type to delete confirmation dialog message - [#1697](https://github.com/elyra-ai/elyra/pull/1697)
- Add make dependency graph utility script - [#1705](https://github.com/elyra-ai/elyra/pull/1705)
- Add ODH/Kubeflow 1.3 deployment instructions - [#1694](https://github.com/elyra-ai/elyra/pull/1694)
- Set system-owned envs after user-provided envs - [#1701](https://github.com/elyra-ai/elyra/pull/1701)
- Update TSConfig and fix errors - [#1670](https://github.com/elyra-ai/elyra/pull/1670)
- Add R kernel installation to dev clean script - [#1682](https://github.com/elyra-ai/elyra/pull/1682)
- Dereference symlinks in node dependency archive - [#1689](https://github.com/elyra-ai/elyra/pull/1689)
- Add indicator for runtime in Pipeline Editor toolbar - [#1683](https://github.com/elyra-ai/elyra/pull/1683)
- Fix Pipeline Editor open/close panel tooltip - [#1688](https://github.com/elyra-ai/elyra/pull/1688)
- Only update stable binder link on non pre-releases - [#1690](https://github.com/elyra-ai/elyra/pull/1690)
- Update Elyra version on KF-Notebook Dockerfile - [#1685](https://github.com/elyra-ai/elyra/pull/1685)
- Fix tooltip for Pipeline Editor in launcher icons - [#1681](https://github.com/elyra-ai/elyra/pull/1681)
- Re-pin  stable binder link to v2.2.4 - [#1684](https://github.com/elyra-ai/elyra/pull/1684)
- Update "Deploying Open Data Hub with Elyra" doc recipe - [#1574](https://github.com/elyra-ai/elyra/pull/1574)
- Add prepare-changelog goal to release script help
- Update documentation with proper release steps
- Refactor ui-components to use React best-practices - [#1657](https://github.com/elyra-ai/elyra/pull/1657)
- Add support for updating env vars to Pipeline Editor - [#1654](https://github.com/elyra-ai/elyra/pull/1654)
- Update to Pipeline Editor 0.3.0 and Canvas 10.7.0 - [#1679](https://github.com/elyra-ai/elyra/pull/1679)
- Fix Script editor output prompt alignment - [#1678](https://github.com/elyra-ai/elyra/pull/1678)
- Add runtime configuration validation section to docs - [#1676](https://github.com/elyra-ai/elyra/pull/1676)
- Add indication of runtime into operation's environment - [#1668](https://github.com/elyra-ai/elyra/pull/1668)
- Pin stable version binder link to 2.2.4
- Update the Getting Started > Overview section in the docs - [#1669](https://github.com/elyra-ai/elyra/pull/1669)
- Add missing dependencies to useCallBack array - [#1667](https://github.com/elyra-ai/elyra/pull/1667)
- Fix Pipeline label in tab context menu - [#1666](https://github.com/elyra-ai/elyra/pull/1666)
- Fix pipeline editor integration test timeout failures - [#1660](https://github.com/elyra-ai/elyra/pull/1660)
- Use GatewayKernelManager from Jupyter Server - [#1655](https://github.com/elyra-ai/elyra/pull/1655)
- Fix KF Dex authentication bug - [#1642](https://github.com/elyra-ai/elyra/pull/1642)
- Update kubeflow installation link on documentation - [#1644](https://github.com/elyra-ai/elyra/pull/1644)
- Remove unused NotebookSubmissionDialog.tsx  file - [#1639](https://github.com/elyra-ai/elyra/pull/1639)
- Add tested runtime version info to prerequisites - [#1641](https://github.com/elyra-ai/elyra/pull/1641)
- Fix Cypress integration tests timeouts - [#1640](https://github.com/elyra-ai/elyra/pull/1640)
- Add configuration instruction for KF 1.3 - [#1635](https://github.com/elyra-ai/elyra/pull/1635)
- Enable creation of pipelines specific to a runtime - [#1591](https://github.com/elyra-ai/elyra/pull/1591)
- Update node properties UI style on pipeline editor - [#1631](https://github.com/elyra-ai/elyra/pull/1631)
- Update Python/R labels in file menu - [#1633](https://github.com/elyra-ai/elyra/pull/1633)
- Fix resources input alignment on node properties - [#1630](https://github.com/elyra-ai/elyra/pull/1630)
- Add more details to Pull Request Template - [#1585](https://github.com/elyra-ai/elyra/pull/1585)
- Fix failing pipeline integration tests - [#1621](https://github.com/elyra-ai/elyra/pull/1621)
- Update to KFP v1.4.0 and KFP-Tekton v0.7.0 - [#1622](https://github.com/elyra-ai/elyra/pull/1622)
- Properly store runtime images name instead of display name - [#1626](https://github.com/elyra-ai/elyra/pull/1626)
- Update binder link to latest stable release - [#1627](https://github.com/elyra-ai/elyra/pull/1627)
- Update release documentation
- Update release script to support beta releases
- Update release script to generate changelog
- Fix custom notebook/script code fonts with ligatures - [#1618](https://github.com/elyra-ai/elyra/pull/1618)
- Add python tests for contents handler - [#1589](https://github.com/elyra-ai/elyra/pull/1589)
- Move cos_secret parameter back into original cos category - [#1617](https://github.com/elyra-ai/elyra/pull/1617)
- Update airflow-notebook version to v0.0.7 - [#1619](https://github.com/elyra-ai/elyra/pull/1619)
- Allow secure connections to s3 object storage - [#1616](https://github.com/elyra-ai/elyra/pull/1616)
- Only allow for KFP Notebook patche releases
- Exclude single-line comments from content parsing - [#1601](https://github.com/elyra-ai/elyra/pull/1601)
- Display message when no code snippet or tag is defined - [#1603](https://github.com/elyra-ai/elyra/pull/1603)
- Update README release doc links to specific Elyra version - [#1588](https://github.com/elyra-ai/elyra/pull/1588)
- Update submit button labels and dialog - [#1598](https://github.com/elyra-ai/elyra/pull/1598)
- Fix links to pipelines documentation topic - [#1604](https://github.com/elyra-ai/elyra/pull/1604)
- Use unittest mock module to avoid flake8 failure - [#1607](https://github.com/elyra-ai/elyra/pull/1607)
- Update OpenAPI spec to cover new contents/properties endpoint - [#1579](https://github.com/elyra-ai/elyra/pull/1579)
- Switch to using the new pipeline editor package - [#1221](https://github.com/elyra-ai/elyra/pull/1221)
- Serve pipeline configuration from server - [#1551](https://github.com/elyra-ai/elyra/pull/1551)
- Exported KFP pipeline yaml missing cos_directory parameter - [#1563](https://github.com/elyra-ai/elyra/pull/1563)
- Update jupyterlab-git extension to v0.30.0 - [#1584](https://github.com/elyra-ai/elyra/pull/1584)
- Build elyra-image from released artifacts for non dev tags - [#1536](https://github.com/elyra-ai/elyra/pull/1536)
- Improve messaging for COS credential exceptions - [#1575](https://github.com/elyra-ai/elyra/pull/1575)
- Adds material ui dependency to ui-components package - [#1567](https://github.com/elyra-ai/elyra/pull/1567)
- Refactor to use Python 3.x super invocation - [#1577](https://github.com/elyra-ai/elyra/pull/1577)
- Update docs with link to Kubeflow Notebook Server recipe - [#1561](https://github.com/elyra-ai/elyra/pull/1561)
- Add cos_secret option to runtime metadata configuration - [#1529](https://github.com/elyra-ai/elyra/pull/1529)
- Expose user_namespace parameter in Airflow runtime schema - [#1545](https://github.com/elyra-ai/elyra/pull/1545)
- Update Elyra container image makefile target on docs - [#1533](https://github.com/elyra-ai/elyra/pull/1533)
- Fix language check on inserting code snippets into Script Editor - [#1527](https://github.com/elyra-ai/elyra/pull/1527)
- Update list of documented Makefile targets - [#1553](https://github.com/elyra-ai/elyra/pull/1553)
- Refactor environmental variable discovery into backend service - [#1460](https://github.com/elyra-ai/elyra/pull/1460)
- Use yarn lock for Elyra builds - [#1555](https://github.com/elyra-ai/elyra/pull/1555)
- Update project MANIFEST.in with missing files - [#1552](https://github.com/elyra-ai/elyra/pull/1552)
- Update Airflow Notebook to  0.0.5 - [#1548](https://github.com/elyra-ai/elyra/pull/1548)
- Fix description of the exported Apache Airflow DAG file - [#1539](https://github.com/elyra-ai/elyra/pull/1539)
- Pin the testutils and filebrowser version - [#1541](https://github.com/elyra-ai/elyra/pull/1541)
- Refactor container related Makefile targets - [#1531](https://github.com/elyra-ai/elyra/pull/1531)
- Add Code Snippet CLI documentation and refactor existing content - [#1528](https://github.com/elyra-ai/elyra/pull/1528)
- Add new build/publish container images targets to Makefile - [#1526](https://github.com/elyra-ai/elyra/pull/1526)
- Update kf-notebook container image documentation - [#1514](https://github.com/elyra-ai/elyra/pull/1514)
- Fix dependency suggestion in submit notebook dialog - [#1510](https://github.com/elyra-ai/elyra/pull/1510)

## 2.2.4 (4/26/2021)

- Move cos_secret parameter into original cos category [#1624](https://github.com/elyra-ai/elyra/pull/1624)
- Add cos_secret option to runtime metadata configuration [#1529](https://github.com/elyra-ai/elyra/pull/1529)
- Update Makefile to simplify publishing container [#1623](https://github.com/elyra-ai/elyra/pull/1623)

## 2.2.3 (4/26/2021)

- Update airflow-notebook version to v0.0.7 [#1619](https://github.com/elyra-ai/elyra/pull/1619)
- Expose user_namespace parameter in Airflow runtime schema [#1545](https://github.com/elyra-ai/elyra/pull/1545)
- Allow secure connections to s3 object storage [#1616](https://github.com/elyra-ai/elyra/pull/1616)
- Only allow for KFP Notebook patche releases
- Display message when no code snippet or tag is defined [#1603](https://github.com/elyra-ai/elyra/pull/1603)
- Update submit button labels and dialog [#1598](https://github.com/elyra-ai/elyra/pull/1598)
- Use unittest mock module to avoid flake8 failure [#1607](https://github.com/elyra-ai/elyra/pull/1607)

## 2.2.2 (4/19/2021)

- Adds material ui dependency to ui-components package [#1567](https://github.com/elyra-ai/elyra/pull/1567)
- Fix Elyra version when creating kf-notebook docker image [#1523](https://github.com/elyra-ai/elyra/pull/1523)
- Fix dependency suggestion in submit notebook dialog [#1510](https://github.com/elyra-ai/elyra/pull/1510)
- Pin the testutils and filebrowser version [#1541](https://github.com/elyra-ai/elyra/pull/1541)
- Update Jupyterlab-git extension to v0.30.0 [#1582](https://github.com/elyra-ai/elyra/pull/1582)

## 2.2.1 (3/31/2021)

- Update KFP Notebook to 0.22.0
- Pin flake8 dependency to avoid trans-dependency conflict
- Fix default node properties when using submit button [#1508](https://github.com/elyra-ai/elyra/pull/1508)
- Update build scripts to publish new R editor

## 2.2.0 (3/31/2021)

High level enhancements
- R Editor with the ability to run R scripts from JupyterLab UI
- Add CLI tool for running and submitting pipelines
- Add Elyra image compatible with Kubeflow notebook launcher
- Brought up JupyterHub and Binder support after issues with their latest releases

Other enhancements and bug fixes
- Add R Editor - [#1435](https://github.com/elyra-ai/elyra/pull/1435)
- Pin version range of autopep8 due to version conflict - [#1504](https://github.com/elyra-ai/elyra/pull/1504)
- Remove obsolete parameter on build-server make task - [#1503](https://github.com/elyra-ai/elyra/pull/1503)
- Update Release Notes formatting (changelog.md)
- Update lint auto-fix suggestions
- Update build tools version on GitHub Actions CI script
- Fix submit button submitting most recent file - [#1501](https://github.com/elyra-ai/elyra/pull/1501)
- Fix pipeline node properties dark mode - [#1487](https://github.com/elyra-ai/elyra/pull/1487)
- Add elyra-pipeline cli tool - [#1246](https://github.com/elyra-ai/elyra/pull/1246)
- Fix pipeline node properties overriding wrong node property - [#1492](https://github.com/elyra-ai/elyra/pull/1492)
- Update KFP Notebook to 0.21.0 - [#1494](https://github.com/elyra-ai/elyra/pull/1494)
- Add Elyra image compatible with Kubeflow notebook launcher - [#1466](https://github.com/elyra-ai/elyra/pull/1466)
- Fixed css scrollbar bug in pipeline node properties - [#1484](https://github.com/elyra-ai/elyra/pull/1484)
- Add inputs for resource usage in submit notebook/script - [#1483](https://github.com/elyra-ai/elyra/pull/1483)
- Refactor script processors, include brief detail on generic errors - [#1485](https://github.com/elyra-ai/elyra/pull/1485)
- Fix container image build command - [#1488](https://github.com/elyra-ai/elyra/pull/1488)
- Replace outdated reference to docker-image target - [#1489](https://github.com/elyra-ai/elyra/pull/1489)
- Provides better error messages for KFP namespace errors - [#1469](https://github.com/elyra-ai/elyra/pull/1469)
- Use node labels instead of filename as operation names - [#1468](https://github.com/elyra-ai/elyra/pull/1468)
- Enable extensions as both Notebook/Jupyter Server extensions - [#1476](https://github.com/elyra-ai/elyra/pull/1476)
- Use pip legacy resolver to fix binder build - [#1456](https://github.com/elyra-ai/elyra/pull/1456)
- Update remaining notebook imports to jupyter_server - [#1471](https://github.com/elyra-ai/elyra/pull/1471)
- Remove close button from pipeline node properties editor - [#1465](https://github.com/elyra-ai/elyra/pull/1465)
- Add offical logos for Python and R - [#1452](https://github.com/elyra-ai/elyra/pull/1452)
- Created RuntimeImagesWidget for customized UI - [#1461](https://github.com/elyra-ai/elyra/pull/1461)
- Add schema_name parameter to CLI runtime config examples - [#1462](https://github.com/elyra-ai/elyra/pull/1462)
- Fix pipeline properties css bug in Safari - [#1449](https://github.com/elyra-ai/elyra/pull/1449)
- Fix properties editor node deletion bug - [#1459](https://github.com/elyra-ai/elyra/pull/1459)
- Remove empty values from pipeline node properties - [#1463](https://github.com/elyra-ai/elyra/pull/1463)
- Update Binder release information to 2.1.0 - [#1454](https://github.com/elyra-ai/elyra/pull/1454)
- Fix code quality Issues reported by analysis tool - [#1432](https://github.com/elyra-ai/elyra/pull/1432)
- Add default / placeholder to dropdown field in metadata editor - [#1443](https://github.com/elyra-ai/elyra/pull/1443)
- Expose error details on Python node local execution - [#1411](https://github.com/elyra-ai/elyra/pull/1411)
- Fix css issues after upgrading to Canvas 10.2.0 - [#1451](https://github.com/elyra-ai/elyra/pull/1451)
- Enable support for adding R Script to Pipeline - [#1418](https://github.com/elyra-ai/elyra/pull/1418)
- Fix Material UI style specificity issues in Metadata Editor - [#1434](https://github.com/elyra-ai/elyra/pull/1434)
- Properly remove string array from pipeline node properties - [#1447](https://github.com/elyra-ai/elyra/pull/1447)
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

- Propagate operation input/output in sorted way [#1427](https://github.com/elyra-ai/elyra/pull/1427)
- Update error dialog message when no runtimes configured [#1423](https://github.com/elyra-ai/elyra/pull/1423)
- Remove error label when user fixes invalid metadata field [#1402](https://github.com/elyra-ai/elyra/pull/1402)
- Fix css alignment in add runtimes dropdown [#1425](https://github.com/elyra-ai/elyra/pull/1425)
- Add pytest suite for airflow processor [#1317](https://github.com/elyra-ai/elyra/pull/1317)
- Handle no runtimes configured on run/export/submit  [#1404](https://github.com/elyra-ai/elyra/pull/1404)
- Update resource validation to check for null values [#1413](https://github.com/elyra-ai/elyra/pull/1413)
- Add GitHub link to Runtimes UI [#1410](https://github.com/elyra-ai/elyra/pull/1410)
- Use absolute path when exporting Airflow DAG to local file [#1415](https://github.com/elyra-ai/elyra/pull/1415)
- Validate node resource requests for zero or negative values [#1394](https://github.com/elyra-ai/elyra/pull/1394)
- Add warning before submitting modified notebook/script [#1385](https://github.com/elyra-ai/elyra/pull/1385)
- Add reference documentation link to MetadataEditor [#1386](https://github.com/elyra-ai/elyra/pull/1386)
- Fix pipeline error message not updating [#1406](https://github.com/elyra-ai/elyra/pull/1406)
- Add reference to Apache Airflow tutorial to documentation [#1310](https://github.com/elyra-ai/elyra/pull/1310)
- Update to canvas version 10.1.0 [#1378](https://github.com/elyra-ai/elyra/pull/1378)
- Improve error handling when pipeline export pushes artifacts to COS [#1377](https://github.com/elyra-ai/elyra/pull/1377)
- Update runtime configuration documentation topic [#1393](https://github.com/elyra-ai/elyra/pull/1393)
- Add PyYAML version range based on kfp-tekton requirements [#1392](https://github.com/elyra-ai/elyra/pull/1392)
- Fix dark mode for metadata editor UI [#1369](https://github.com/elyra-ai/elyra/pull/1369)
- Add additional property for pipeline submission response [#1364](https://github.com/elyra-ai/elyra/pull/1364)
- Include object storage requirement in Apache Airflow configuration guide
- Update Apache Airflow deployment documentation [#1367](https://github.com/elyra-ai/elyra/pull/1367)
- Update release script to support release candidate [#1365](https://github.com/elyra-ai/elyra/pull/1365)
- Update Tornado to release 6.1.0 [#1272](https://github.com/elyra-ai/elyra/pull/1272)
- Add support for multiple schemas in Metadata Editor [#1327](https://github.com/elyra-ai/elyra/pull/1327)
- Expose Github exceptions in a more user-friendly way [#1366](https://github.com/elyra-ai/elyra/pull/1366)
- Update documentation with new Submit script feature [#1357](https://github.com/elyra-ai/elyra/pull/1357)
- Formalize titles and descriptions in runtime schemas [#1352](https://github.com/elyra-ai/elyra/pull/1352)
- Switch to using Material UI in metadata editor [#1293](https://github.com/elyra-ai/elyra/pull/1293)
- Update Runtime configuration topic in the docs [#1353](https://github.com/elyra-ai/elyra/pull/1353)
- Add support for submitting scripts as pipeline [#1330](https://github.com/elyra-ai/elyra/pull/1330)
- Add pipeline source annotations to container ops [#1331](https://github.com/elyra-ai/elyra/pull/1331)
- Refresh Apache Airflow configuration documentation [#1311](https://github.com/elyra-ai/elyra/pull/1311)
- Add placeholder values to runtime configuration metadata [#1345](https://github.com/elyra-ai/elyra/pull/1345)
- Group metadata tags with name and description [#1347](https://github.com/elyra-ai/elyra/pull/1347)
- Update links in extension tracker documentation [#1348](https://github.com/elyra-ai/elyra/pull/1348)
- Refactor Apache Airflow github functions to the utility module [#1316](https://github.com/elyra-ai/elyra/pull/1316)
- Handle default field on metadata editor
- Add default url for github api endpoint
- Update KFP Notebook to 0.20.0 [#1344](https://github.com/elyra-ai/elyra/pull/1344)
- Fix invalid documentation references [#1342](https://github.com/elyra-ai/elyra/pull/1342)
- Honor default values for missing metadata properties [#1336](https://github.com/elyra-ai/elyra/pull/1336)
- Tweak runtime metadata definitions for Airflow and Kubeflow [#1296](https://github.com/elyra-ai/elyra/pull/1296)
- Improve pipeline node properties dark theme [#1328](https://github.com/elyra-ai/elyra/pull/1328)
- Add support for K8s pod labels and annotations for KFP [#1284](https://github.com/elyra-ai/elyra/pull/1284)
- Fix issues causing false circular dependency during validation [#1309](https://github.com/elyra-ai/elyra/pull/1309)
- Properly propagate runtime info when submitting notebook [#1306](https://github.com/elyra-ai/elyra/pull/1306)
- Update runtime image metadata configuration documentation [#1283](https://github.com/elyra-ai/elyra/pull/1283)
- Add ability to include image pull policy with runtime image - [#1279](https://github.com/elyra-ai/elyra/pull/1279)
- Add tags to Apache Airflow metadata schema [#1294](https://github.com/elyra-ai/elyra/pull/1294)
- Update developer workflow documentation [#1288](https://github.com/elyra-ai/elyra/pull/1288)
- Experimental support of Airflow as a pipeline runtime [#490](https://github.com/elyra-ai/elyra/pull/490)
- Fix watch mode by including source files in the package [#1269](https://github.com/elyra-ai/elyra/pull/1269)
- Properly propagate namespace on exported Python DSL [#1275](https://github.com/elyra-ai/elyra/pull/1275)
- Update  KFP to 1.3.0 and KFP-Tekton to 0.6.0 [#1276](https://github.com/elyra-ai/elyra/pull/1276)
- Fix dark theme for properties panel [#1262](https://github.com/elyra-ai/elyra/pull/1262)
- Add details on how to determine workflow engine type
- Update docs to clarify definition of public registry [#1258](https://github.com/elyra-ai/elyra/pull/1258)
- Refresh Elyra 2.x installation instructions [#1255](https://github.com/elyra-ai/elyra/pull/1255)
- Document how to create/publish Elyra release [#1247](https://github.com/elyra-ai/elyra/pull/1247)

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
