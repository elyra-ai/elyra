"use strict";
(self["webpackChunk_elyra_services"] = self["webpackChunk_elyra_services"] || []).push([["lib_index_js"],{

/***/ "./lib/index.js":
/*!**********************!*\
  !*** ./lib/index.js ***!
  \**********************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


/*
 * Copyright 2018-2025 Elyra Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
__webpack_require__(/*! ../style/index.css */ "./style/index.css");
__exportStar(__webpack_require__(/*! ./parsing */ "./lib/parsing.js"), exports);
__exportStar(__webpack_require__(/*! ./metadata */ "./lib/metadata.js"), exports);
__exportStar(__webpack_require__(/*! ./requests */ "./lib/requests.js"), exports);
__exportStar(__webpack_require__(/*! ./types */ "./lib/types.js"), exports);


/***/ }),

/***/ "./lib/metadata.js":
/*!*************************!*\
  !*** ./lib/metadata.js ***!
  \*************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


/*
 * Copyright 2018-2025 Elyra Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MetadataService = void 0;
const requests_1 = __webpack_require__(/*! ./requests */ "./lib/requests.js");
const ELYRA_METADATA_API_ENDPOINT = 'elyra/metadata/';
const ELYRA_SCHEMA_API_ENDPOINT = 'elyra/schema/';
const ELYRA_SCHEMASPACE_API_ENDPOINT = 'elyra/schemaspace';
/**
 * A service class for accessing the elyra api.
 */
class MetadataService {
    /**
     * Service function for making GET calls to the elyra metadata API.
     *
     * @param schemaspace - the metadata schemaspace being accessed
     *
     * @returns a promise that resolves with the requested metadata or
     * an error dialog result
     */
    static getMetadata(schemaspace) {
        return __awaiter(this, void 0, void 0, function* () {
            return requests_1.RequestHandler.makeGetRequest(ELYRA_METADATA_API_ENDPOINT + schemaspace).then((response) => response === null || response === void 0 ? void 0 : response[schemaspace]);
        });
    }
    /**
     * Service function for making POST calls to the elyra metadata API.
     *
     * @param schemaspace - the metadata schemaspace being accessed
     * @param requestBody - the body of the request
     *
     * @returns a promise that resolves with the newly created metadata or
     * an error dialog result
     */
    static postMetadata(schemaspace, requestBody) {
        return __awaiter(this, void 0, void 0, function* () {
            return requests_1.RequestHandler.makePostRequest(ELYRA_METADATA_API_ENDPOINT + schemaspace, JSON.stringify(requestBody));
        });
    }
    /**
     * Service function for making PUT calls to the elyra metadata API.
     *
     * @param schemaspace - the metadata schemaspace being accessed
     * @param name - the metadata name being updated
     * @param requestBody - the body of the request
     *
     * @returns a promise that resolves with the updated metadata or
     * an error dialog result
     */
    static putMetadata(schemaspace, name, requestBody) {
        return __awaiter(this, void 0, void 0, function* () {
            return requests_1.RequestHandler.makePutRequest(`${ELYRA_METADATA_API_ENDPOINT}${schemaspace}/${name}`, JSON.stringify(requestBody));
        });
    }
    /**
     * Service function for making DELETE calls to the elyra metadata API.
     *
     * @param schemaspace - the metadata schemaspace being accessed
     * @param name - the metadata name being updated
     *
     * @returns void or an error dialog result
     */
    static deleteMetadata(schemaspace, name) {
        return __awaiter(this, void 0, void 0, function* () {
            yield requests_1.RequestHandler.makeDeleteRequest(`${ELYRA_METADATA_API_ENDPOINT}${schemaspace}/${name}`);
        });
    }
    /**
     * Service function for making GET calls to the elyra schema API.
     *
     * @param schemaspace - the schema schemaspace being requested
     *
     * @returns a promise that resolves with the requested schemas or
     * an error dialog result
     */
    static getSchema(schemaspace) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.schemaCache[schemaspace]) {
                // Deep copy cached schema to mimic request call
                return JSON.parse(JSON.stringify(this.schemaCache[schemaspace]));
            }
            return requests_1.RequestHandler.makeGetRequest(ELYRA_SCHEMA_API_ENDPOINT + schemaspace).then((response) => {
                if (response === null || response === void 0 ? void 0 : response[schemaspace]) {
                    this.schemaCache[schemaspace] = response[schemaspace];
                }
                return response === null || response === void 0 ? void 0 : response[schemaspace];
            });
        });
    }
    /**
     * Service function for making GET calls to the elyra schema API.
     *
     * @returns a promise that resolves with the requested schemas or
     * an error dialog result
     */
    static getAllSchema() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const response = yield requests_1.RequestHandler.makeGetRequest(ELYRA_SCHEMASPACE_API_ENDPOINT);
                const schemas = [];
                for (const schemaspace of (_a = response === null || response === void 0 ? void 0 : response.schemaspaces) !== null && _a !== void 0 ? _a : []) {
                    const schema = yield this.getSchema(schemaspace);
                    if (schema) {
                        schemas.push(...schema);
                    }
                }
                return schemas;
            }
            catch (error) {
                return Promise.reject(error);
            }
        });
    }
}
exports.MetadataService = MetadataService;
MetadataService.schemaCache = {};


/***/ }),

/***/ "./lib/parsing.js":
/*!************************!*\
  !*** ./lib/parsing.js ***!
  \************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


/*
 * Copyright 2018-2025 Elyra Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ContentParser = void 0;
const requests_1 = __webpack_require__(/*! ./requests */ "./lib/requests.js");
const ELYRA_FILE_PARSER_API_ENDPOINT = 'elyra/contents/properties/';
/**
 * A utilities class for parsing notebook files.
 */
class ContentParser {
    /**
     * Takes in a file_path and finds all env vars accessed in that file.
     * @param file_path - relative path to file
     * @returns A string array of the env vars accessed in the given file
     */
    static getEnvVars(file_path) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const response = yield requests_1.RequestHandler.makeGetRequest(ELYRA_FILE_PARSER_API_ENDPOINT + file_path);
                // Only return environment var names (not values)
                return Object.keys((_a = response === null || response === void 0 ? void 0 : response.env_vars) !== null && _a !== void 0 ? _a : {});
            }
            catch (error) {
                return Promise.reject(error);
            }
        });
    }
}
exports.ContentParser = ContentParser;


/***/ }),

/***/ "./lib/requests.js":
/*!*************************!*\
  !*** ./lib/requests.js ***!
  \*************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


/*
 * Copyright 2018-2025 Elyra Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RequestHandler = void 0;
const coreutils_1 = __webpack_require__(/*! @jupyterlab/coreutils */ "webpack/sharing/consume/default/@jupyterlab/coreutils");
const services_1 = __webpack_require__(/*! @jupyterlab/services */ "webpack/sharing/consume/default/@jupyterlab/services");
/**
 * A service class for making requests to the jupyter lab server.
 */
class RequestHandler {
    /**
     * Make a GET request to the jupyter lab server.
     *
     * All errors returned by the server are handled by displaying a relevant
     * error dialog. If provided a `longRequestDialog` then the dialog is displayed
     * to users while waiting for the server response. On success a promise that
     * resolves to the server response is returned.
     *
     * @param requestPath - The url path for the request.
     * This path is appended to the base path of the server for the request.
     *
     * @param longRequestDialog - A optional Dialog param.
     * A warning Dialog to display while waiting for the request to return.
     *
     * @returns a promise that resolves with the server response on success or
     * an error dialog result in cases of failure.
     */
    static makeGetRequest(requestPath, longRequestDialog) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.makeServerRequest(requestPath, { method: 'GET' }, longRequestDialog);
        });
    }
    /**
     * Make a POST request to the jupyter lab server.
     *
     * All errors returned by the server are handled by displaying a relevant
     * error dialog. If provided a `longRequestDialog` then the dialog is displayed
     * to users while waiting for the server response. On success a promise that
     * resolves to the server response is returned.
     *
     * @param requestPath - The url path for the request.
     * This path is appended to the base path of the server for the request.
     *
     * @param requestBody - The body of the request.
     * Will be included in the RequestInit object passed to `makeServerRequest`
     *
     * @param longRequestDialog - A optional Dialog param.
     * A warning Dialog to display while waiting for the request to return.
     *
     * @returns a promise that resolves with the server response on success or
     * an error dialog result in cases of failure.
     */
    static makePostRequest(requestPath, requestBody, longRequestDialog) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.makeServerRequest(requestPath, { method: 'POST', body: requestBody }, longRequestDialog);
        });
    }
    /**
     * Make a PUT request to the jupyter lab server.
     *
     * All errors returned by the server are handled by displaying a relevant
     * error dialog. If provided a `longRequestDialog` then the dialog is displayed
     * to users while waiting for the server response. On success a promise that
     * resolves to the server response is returned.
     *
     * @param requestPath - The url path for the request.
     * This path is appended to the base path of the server for the request.
     *
     * @param requestBody - The body of the request.
     * Will be included in the RequestInit object passed to `makeServerRequest`
     *
     * @param longRequestDialog - A optional Dialog param.
     * A warning Dialog to display while waiting for the request to return.
     *
     * @returns a promise that resolves with the server response on success or
     * an error dialog result in cases of failure.
     */
    static makePutRequest(requestPath, requestBody, longRequestDialog) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.makeServerRequest(requestPath, { method: 'PUT', body: requestBody }, longRequestDialog);
        });
    }
    /**
     * Make a DELETE request to the jupyter lab server.
     *
     * All errors returned by the server are handled by displaying a relevant
     * error dialog. If provided a `longRequestDialog` then the dialog is displayed
     * to users while waiting for the server response. On success a promise that
     * resolves to the server response is returned.
     *
     * @param requestPath - The url path for the request.
     * This path is appended to the base path of the server for the request.
     *
     * @param longRequestDialog - A optional Dialog param.
     * A warning Dialog to display while waiting for the request to return.
     *
     * @returns a promise that resolves with the server response on success or
     * an error dialog result in cases of failure.
     */
    static makeDeleteRequest(requestPath, longRequestDialog) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.makeServerRequest(requestPath, { method: 'DELETE' }, longRequestDialog);
        });
    }
    /**
     * Make a request to the jupyter lab server.
     *
     * The method of request is set in the `method` value in `requestInit`.
     * All errors returned by the server are handled by displaying a relevant
     * error dialog. If provided a `longRequestDialog` then the dialog is displayed
     * to users while waiting for the server response. On success a promise that
     * resolves to the server response is returned.
     *
     * @param requestPath - The url path for the request.
     * This path is appended to the base path of the server for the request.
     *
     * @param requestInit - The initialization options for the request.
     * A RequestInit object to be passed directly to `ServerConnection.makeRequest`
     * that must include a value for `method`.
     * This is based on "@typescript/lib/lib.dom.d/RequestInit"
     * @see {@link https://github.com/Microsoft/TypeScript/blob/master/lib/lib.dom.d.ts#L1558}
     * and {@link https://fetch.spec.whatwg.org/#requestinit}
     *
     * @param longRequestDialog - A optional Dialog param.
     * A warning Dialog to display while waiting for the request to return.
     *
     * @returns a promise that resolves with the server response on success or
     * an error dialog result in cases of failure.
     */
    static makeServerRequest(requestPath, options, longRequestDialog) {
        return __awaiter(this, void 0, void 0, function* () {
            // use ServerConnection utility to make calls to Jupyter Based services
            // which in this case are in the extension installed by this package
            const settings = services_1.ServerConnection.makeSettings();
            const requestUrl = coreutils_1.URLExt.join(settings.baseUrl, requestPath);
            const { type = 'json' } = options, requestInit = __rest(options, ["type"]);
            console.log(`Sending a ${requestInit.method} request to ${requestUrl}`);
            if (longRequestDialog) {
                longRequestDialog.launch();
            }
            const getServerResponse = new Promise((resolve, reject) => {
                services_1.ServerConnection.makeRequest(requestUrl, requestInit, settings).then((response) => {
                    if (longRequestDialog) {
                        longRequestDialog.resolve();
                    }
                    response[type]().then(
                    // handle cases where the server returns a valid response
                    (result) => {
                        if (response.status === 405) {
                            resolve(undefined);
                        }
                        if (response.status < 200 || response.status >= 300) {
                            return reject(result);
                        }
                        resolve(result);
                    }, 
                    // handle 404 if the server is not found
                    (reason) => {
                        if (response.status === 404 || response.status === 409) {
                            return reject(Object.assign(Object.assign({}, response), { requestPath: requestPath }));
                        }
                        else if (response.status === 204) {
                            resolve(undefined);
                        }
                        else {
                            return reject(reason);
                        }
                    });
                }, 
                // something unexpected went wrong with the request
                (reason) => {
                    console.error(reason);
                    return reject(reason);
                });
            });
            const serverResponse = yield getServerResponse;
            return serverResponse;
        });
    }
}
exports.RequestHandler = RequestHandler;


/***/ }),

/***/ "./lib/types.js":
/*!**********************!*\
  !*** ./lib/types.js ***!
  \**********************/
/***/ ((__unused_webpack_module, exports) => {


/*
 * Copyright 2018-2025 Elyra Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));


/***/ })

}]);
//# sourceMappingURL=lib_index_js.3ee7b9897ae441bc09fb.js.map