/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

'use strict';

import * as assert from 'assert';
import * as PathUtils from '../node/pathUtilities';


suite('pathUtilities', () => {

	suite('normalize(path)', () => {

		test('should return a path with forward slashes and \'..\' removed', () => {
			assert.equal(PathUtils.normalize('/a/b/c'), '/a/b/c');
			assert.equal(PathUtils.normalize('/a/b//c'), '/a/b/c');
			assert.equal(PathUtils.normalize('/a/./b/c'), '/a/b/c');
			assert.equal(PathUtils.normalize('/a/b/../c'), '/a/c');

			assert.equal(PathUtils.normalize('c:\\a\\b'), '/c:/a/b');
			assert.equal(PathUtils.normalize('C:\\a\\b'), '/C:/a/b');
			assert.equal(PathUtils.normalize('C:\\a\\..\\b'), '/C:/b');
			assert.equal(PathUtils.normalize('C:\\a\\.\\b'), '/C:/a/b');
			assert.equal(PathUtils.normalize('c:/a/b'), '/c:/a/b');
			assert.equal(PathUtils.normalize('C:/a/b'), '/C:/a/b');
		});

	});

	suite('join(absPath, relPath)', () => {

		test('should return a path with forward slashes', () => {
			assert.equal(PathUtils.join('/a/b', 'c'), '/a/b/c');
			assert.equal(PathUtils.join('/a/b/', 'c'), '/a/b/c');

			assert.equal(PathUtils.join('c:\\a\\b', 'c'), '/c:/a/b/c');
			assert.equal(PathUtils.join('c:\\a\\b\\', 'c'), '/c:/a/b/c');
			assert.equal(PathUtils.join('C:\\a\\b', 'c'), '/C:/a/b/c');
		});

	});

	suite('isAbsolutePath(path)', () => {

		test('should return true when the path is absolute', () => {
			assert.equal(PathUtils.isAbsolutePath('/x/y'), true);
			assert.equal(PathUtils.isAbsolutePath('c:/x/y'), true);
			assert.equal(PathUtils.isAbsolutePath('C:/x/y'), true);
			assert.equal(PathUtils.isAbsolutePath('c:\\x\\y'), true);
			assert.equal(PathUtils.isAbsolutePath('C:\\x\\y'), true);
		});

		test('should return false when the path is relative', () => {
			assert.equal(PathUtils.isAbsolutePath(null), false);
			assert.equal(PathUtils.isAbsolutePath(''), false);

			assert.equal(PathUtils.isAbsolutePath('x'), false);
			assert.equal(PathUtils.isAbsolutePath('./x'), false);
			assert.equal(PathUtils.isAbsolutePath('../y'), false);

			assert.equal(PathUtils.isAbsolutePath('.\\x'), false);
			assert.equal(PathUtils.isAbsolutePath('..\\y'), false);
		});

	});

	suite('makeRelative(target, path)', () => {

		test('identical paths should return empty string', () => {
			if (process.platform === 'win32') {
				assert.equal(PathUtils.makeRelative('c:\\a\\b', 'c:\\a\\b'), '');
			} else {
				assert.equal(PathUtils.makeRelative('/a/b', '/a/b'), '');
			}
		});

		test('target and path same length', () => {
			if (process.platform === 'win32') {
				assert.equal(PathUtils.makeRelative('c:\\a\\b\\c\\d\\e\\f', 'c:\\a\\b\\c\\g\\h\\j'), 'g\\h\\j');
			} else {
				assert.equal(PathUtils.makeRelative('/a/b/c/d/e/f', '/a/b/c/g/h/j'), 'g/h/j');
			}
		});

		test('target is longer', () => {
			if (process.platform === 'win32') {
				assert.equal(PathUtils.makeRelative('c:\\a\\b\\c\\d', 'c:\\a\\b\\c'), '');
			} else {
				assert.equal(PathUtils.makeRelative('/a/b/c/d', '/a/b/c'), '');
			}
		});

		test('path is longer', () => {
			if (process.platform === 'win32') {
				assert.equal(PathUtils.makeRelative('c:\\a\\b\\c\\d', 'c:\\a\\b\\c\\d\\e'), 'e');
			} else {
				assert.equal(PathUtils.makeRelative('/a/b/c/d', '/a/b/c/d/e'), 'e');
			}
		});
	});

	suite('makeRelative2(from, to)', () => {

		test('identical paths should return empty string', () => {
			assert.equal(PathUtils.makeRelative2('/common/a', '/common/a'), '');
		});

		test('from and to same length', () => {
			assert.equal(PathUtils.makeRelative2('/a/b/c/d/e/f','/a/b/c/g/h/j'), '../../g/h/j');
		});

		test('from is longer', () => {
			assert.equal(PathUtils.makeRelative2('/a/b/c/d', '/a/b/d'), '../d');
			assert.equal(PathUtils.makeRelative2('/a/b/c/d/e', '/a/d/e'), '../../d/e');
		});

		test('to is longer', () => {
			assert.equal(PathUtils.makeRelative2('/a/b/c/d', '/a/b/c/d/e'), 'e');
			assert.equal(PathUtils.makeRelative2('/a/b/c/d', '/a/b/c/d/e/f'), 'e/f');
			assert.equal(PathUtils.makeRelative2('/', '/a/b'), 'a/b');
		});
	});

	suite('realPath(path)', () => {

		const path = __filename;

		if (process.platform === 'win32' || process.platform === 'darwin') {

			// assume case insensitive file system

			test('on a case insensitive file system realPath might return different casing for a given path', () => {

				const upper = path.toUpperCase();
				const real = PathUtils.realPath(upper);

				assert.notEqual(real, upper);
				assert.equal(real, path);
				assert.equal(real.toUpperCase(), upper);
			});

		} else {
			// linux, unix, etc. -> assume case sensitive file system

			test('on a case sensitive file system realPath should always return the same path', () => {

				const real = PathUtils.realPath(path);

				assert.equal(real, path);

			});
		}
	});

});
