"use strict";
/*
 * Copyright 2018-2020 IBM Corporation
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
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var react_1 = require("react");
require("../style/index.css");
var CodeSnippet_1 = require("./CodeSnippet");
/**
 * A widget for code-snippet.
 */
var CodeSnippetTable = /** @class */ (function (_super) {
    __extends(CodeSnippetTable, _super);
    function CodeSnippetTable(props) {
        var _this = _super.call(this, props) || this;
        // let codeSnippetManager = new CodeSnippetManager();
        // let codeSnippets: Promise<ICodeSnippet[]> = codeSnippetManager.findAll(); // Promise that resolves in an array
        // codeSnippets = codeSnippets;//???
        // this.fetchData();
        _this.state = { codeSnippets: [] };
        return _this;
        // this.state = { //state is by default an object
        //  students: [
        //     { id: 1, name: 'Wasif', age: 21, email: 'wasif@email.com' },
        //     { id: 2, name: 'Ali', age: 19, email: 'ali@email.com' },
        //     { id: 3, name: 'Saad', age: 16, email: 'saad@email.com' },
        //     { id: 4, name: 'Asad', age: 25, email: 'asad@email.com' }
        //  ]
        // }
    }
    CodeSnippetTable.prototype.fetchData = function () {
        return __awaiter(this, void 0, void 0, function () {
            var codeSnippetManager, codeSnippets;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        codeSnippetManager = new CodeSnippet_1.CodeSnippetManager();
                        return [4 /*yield*/, codeSnippetManager.findAll()];
                    case 1:
                        codeSnippets = _a.sent();
                        console.log('Code Snippets:');
                        codeSnippets.forEach(function (codeSnippet) {
                            console.log(JSON.stringify(codeSnippet));
                        });
                        return [2 /*return*/, codeSnippets];
                }
            });
        });
    };
    CodeSnippetTable.prototype.renderTableRows = function () {
        /*
        {
          "bloh": {
            "display_name": "blah",
            "metadata": {
              "language": "python",
              "code": [
                "def create_project_temp_dir():",
                "   temp_dir = tempfile.gettempdir()",
                "   project_temp_dir = os.path.join(temp_dir, 'elyra')",
                "   if not os.path.exists(project_temp_dir):",
                "     os.mkdir(project_temp_dir)",
                "   return project_temp_dir"
              ]
            },
            "schema_name": "code-snippet",
            "name": "bloh",
            "resource": "/Users/lresende/Library/Jupyter/metadata/code-snippet/bloh.json"
          }
        }*/
        // return this.state.students.map((student:any, index: number) => {
        //    const { id, name, age, email } = student //destructuring
        //    return (
        //       <tr key={id}>
        //          <td>{id}</td>
        //          <td>{name}</td>
        //          <td>{age}</td>
        //          <td>{email}</td>
        //       </tr>
        //    )
        // })
        return this.state.codeSnippets.map(function (codeSnippet, index) {
            // const { id, name, age, email } = student //destructuring
            // return (
            //    <tr key={id}>
            //       <td>{id}</td>
            //       <td>{name}</td>
            //       <td>{age}</td>
            //       <td>{email}</td>
            //    </tr>
            // )
            var name = codeSnippet.name, displayName = codeSnippet.displayName, language = codeSnippet.language, code = codeSnippet.code; //destructuring
            return (<tr key={name}>
              <td>{displayName}</td>
              <td>{language}</td>
              <td>{code}</td>
          </tr>);
        });
        // return this.state.forEach((codeSnippets:any) => {
        //   codeSnippets.map((codeSnippet:any, index: number) => {  
        //     //testing iterating through object properties
        //     for (const property in codeSnippet) {
        //       console.log(`${property}: ${codeSnippet[property]}`);
        //       const { id, name, age, email } = student //destructuring
        //       return (
        //           <tr key={id}>
        //             <td>{id}</td>
        //             <td>{name}</td>
        //             <td>{age}</td>
        //             <td>{email}</td>
        //           </tr>
        //       )
        //     }
        //   })
        // });
    };
    CodeSnippetTable.prototype.componentDidMount = function () {
        var _this = this;
        console.log('componentDidMount');
        this.fetchData().then(function (codeSnippets) {
            _this.setState({ codeSnippets: codeSnippets });
        });
    };
    CodeSnippetTable.prototype.render = function () {
        return (<div>
            <table id='codeSnippets'>
               <tbody>
                  {this.renderTableRows()}
               </tbody>
            </table>
         </div>);
    };
    return CodeSnippetTable;
}(react_1["default"].Component));
var CodeSnippetWidget = /** @class */ (function (_super) {
    __extends(CodeSnippetWidget, _super);
    function CodeSnippetWidget() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    CodeSnippetWidget.prototype.render = function () {
        return (<div className="elyra-CodeSnippets">
      <header>{title}</header>
      <CodeSnippetTable />
    </div>);
    };
    return CodeSnippetWidget;
}(ReactWidget));
exports.CodeSnippetWidget = CodeSnippetWidget;
