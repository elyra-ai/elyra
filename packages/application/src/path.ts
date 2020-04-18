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

export class Path {
  /**
   * Returns the directory name of a file path
   *
   * @param path a file path as in '/foo/bar/baz/asdf/file.ext'
   * Returns: '/foo/bar/baz/asdf'
   */
  static dirname(path: string): string {
    return path.replace(/(.*?)[^/]*\..*$/, '$1');
  }

  /**
   * Returns a file name with extension from a file path
   *
   * @param path a file path as in '/foo/bar/baz/asdf/file.ext'
   * Returns: 'file.ext'
   */
  static basename(path: string): string {
    return path.replace(/^.*[\\/]/, '');
  }

  /**
   * Returns a file name without extension from a file path
   *
   * @param path a file path as in '/foo/bar/baz/asdf/file.ext'
   * Returns: 'file'
   */
  static filename(path: string): string {
    const name = Path.basename(path);
    return name.split('.')[0];
  }

  /**
   * Return the file extension from a file path
   *
   * @param path a file path as in '/foo/bar/baz/asdf/file.ext'
   * Returns: '.ext'
   */

  static extname(path: string): string {
    const name = Path.basename(path);
    return name.split('.').pop();
  }
}
