/**
 * A utilities class for static functions.
 */
export default class Utils {

  /**
   * Takes in a notebook and finds all env vars accessed in it.
   * @param notebookStr Raw notebook JSON in string format
   * @returns A string array of the env vars accessed in the given notebook
   */
  static getEnvVars(notebookStr: string): string[] {
    let envVars: string[] = [];
    let notebook = JSON.parse(notebookStr);
    let match_regex = /os\.environ(?:\["([^"]+)|\['([^']+)|\.get\("([^"]+)|\.get\('([^']+))/;

    for (let cell of notebook['cells']) {
      if (cell['cell_type'] == 'code') {
        let matchedEnv: string[][] = this.findInCode(cell['source'], match_regex);
        for (let match of matchedEnv) {
          for (let i = 1; i < match.length; i++) {
            if (match[i]) {
              envVars.push(match[i]);
            }
          }
        }
      }
    }

    return [...new Set(envVars)];
  }

  /**
   * Splits code string on new lines and matches each line on the given regex.
   * @param code Multi-line string to match on
   * @param regex Match regex to run on each line of code
   * @returns A 2d string array containing an array of the matched array results
   */
  static findInCode(code: string, regex: RegExp): string[][] {
    let matched: string[][] = [];
    let codeLines = code.split(/\r?\n/);

    for (let codeLine of codeLines) {
      let match = codeLine.match(regex);
      if (match) {
        matched.push(match);
      }
    }

    return matched;
  }

}