/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

var gulp = require('gulp');
var path = require('path');
var tsb = require('gulp-tsb');
var log = require('gulp-util').log;
var tslint = require("gulp-tslint");
var filter = require('gulp-filter');
var azure = require('gulp-azure-storage');
var git = require('git-rev-sync');
var del = require('del');
var runSequence = require('run-sequence');
var vzip = require('gulp-vinyl-zip');

var compilation = tsb.create(path.join(__dirname, 'tsconfig.json'), true);

var sources = [
	'src/**/*.ts',
	'!src/tests/data/**',
	'typings/**/*.ts'
];

var outDest = 'out';
var uploadDest = 'upload/' + git.short();

gulp.task('default', function(callback) {
	runSequence('build', callback);
});

gulp.task('build', function(callback) {
	runSequence('clean', 'internal-build', callback);
});

gulp.task('zip', function(callback) {
	runSequence('build', 'internal-zip', callback);
});

gulp.task('upload', function(callback) {
	runSequence('zip', 'internal-upload', callback);
});

gulp.task('clean', function() {
	return del(['out/**', 'upload/**']);
})

gulp.task('ts-watch', ['internal-build'], function(cb) {
	log('Watching build sources...');
	gulp.watch(sources, ['internal-compile']);
});

//---- internal

// compile and copy everything to outDest
gulp.task('internal-build', function(callback) {
	runSequence('internal-compile', 'internal-copy-scripts', callback);
});

gulp.task('internal-copy-scripts', function() {
	return gulp.src(['src/node/terminateProcess.sh', 'src/node/TerminalHelper.scpt'])
		.pipe(gulp.dest(outDest + '/node'));
});

gulp.task('internal-compile', function() {
	return gulp.src(sources, { base: '.' })
		.pipe(compilation())
		.pipe(gulp.dest(outDest));
});

gulp.task('internal-zip', function(callback) {
	return gulp.src([
		outDest + '/node/*',
		'node_modules/source-map/**/*',
		'node_modules/vscode-debugprotocol/**/*',
		'node_modules/vscode-debugadapter/**/*',
		'package.json',
		'ThirdPartyNotices.txt',
		'LICENSE.txt'
	], { base: '.' }).pipe(vzip.dest(uploadDest + '/node-debug.zip'));
});

gulp.task('internal-upload', function() {
	return gulp.src('upload/**/*')
		.pipe(azure.upload({
			account: process.env.AZURE_STORAGE_ACCOUNT,
			key: process.env.AZURE_STORAGE_ACCESS_KEY,
			container: 'debuggers'
		}));
});

var allTypeScript = [
	'src/**/*.ts'
];

var tslintFilter = [
	'**',
	'!**/*.d.ts',
	'!**/typings/**'
];

var lintReporter = function (output, file, options) {
	//emits: src/helloWorld.c:5:3: warning: implicit declaration of function ‘prinft’
	var relativeBase = file.base.substring(file.cwd.length + 1).replace('\\', '/');
	output.forEach(function(e) {
		var message = relativeBase + e.name + ':' + (e.startPosition.line + 1) + ':' + (e.startPosition.character + 1) + ': ' + e.failure;
		console.log('[tslint] ' + message);
	});
};

gulp.task('tslint', function () {
	gulp.src(allTypeScript)
	.pipe(filter(tslintFilter))
	.pipe(tslint({
		rulesDirectory: "node_modules/tslint-microsoft-contrib"
	}))
	.pipe(tslint.report(lintReporter, {
		summarizeFailureOutput: false,
		emitError: false
	}))
});
