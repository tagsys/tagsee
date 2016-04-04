var gulp = require('gulp'),
	path = require('path'),
	jshintReporter = require('jshint-stylish'),
	plugins = require('gulp-load-plugins')({
		config: path.join(__dirname, 'package.json')
	});

var path = {
	src: {
		files: 'src/**/*.js'
	},
	test: {
		files: 'test/**/*.test.js'
	}
}

gulp.task('build', function(done) {
	var pkg = require('./package.json');

	var header = ['/**',
		' * <%= pkg.name %>',
		' * <%= pkg.description %>',
		' * @version v<%= pkg.version %>',
		' * @link <%= pkg.homepage %>',
		' * @license <%= pkg.license %>',
		' */',
		'(function (root, factory) {',
		'	if (typeof define === \'function\' && define.amd) {',
		'		// AMD. Register as an anonymous module.',
		'		define([], factory);',
		'	} else if (typeof exports === \'object\') {',
		'		// Node. Does not work with strict CommonJS, but',
		'		// only CommonJS-like environments that support module.exports,',
		'		// like Node.',
		'		module.exports = factory();',
		'	} else {',
		'		// Browser globals (root is window)',
		'		root.BrV = factory();',
		'	}',
		'}(this, function () {',
		''].join('\n');

	var footer = ['',
		'	return {',
		'		ie: IE,',
		'		cpf: CPF,',
		'		cnpj: CNPJ',
		'	};',
		'}));'].join('\n');

	gulp.src(path.src.files)
		.pipe(plugins.concat('br-validations.js'))
		.pipe(plugins.header(header, {pkg: pkg}))
		.pipe(plugins.footer(footer))
		.pipe(plugins.concat('br-validations.js'))
		.pipe(gulp.dest('./releases'))
		.pipe(plugins.uglify())
		.pipe(plugins.concat('br-validations.min.js'))
		.pipe(gulp.dest('./releases'));

	done();
});

gulp.task('jshint', function(done) {
	gulp.src(path.src.files)
	.pipe(plugins.jshint('.jshintrc'))
	.pipe(plugins.jshint.reporter(jshintReporter));
	done();
});

gulp.task('runtestdot', function() {
	gulp.src(path.test.files, {read: false})
	.pipe(plugins.mocha({
		reporter: 'dot'
	}))
	.on('error', console.warn.bind(console));
});

gulp.task('runtest', function() {
	gulp.src(path.test.files, {read: false})
	.pipe(plugins.mocha({
		reporter: 'spec'
	}))
	.on('error', console.warn.bind(console));
});

gulp.task('default', ['jshint', 'build', 'runtestdot'], function() {
    gulp.watch(path.src.files, ['jshint', 'build', 'runtestdot']);
});

gulp.task('test', ['jshint', 'build', 'runtest']);

gulp.task('test-watch', ['jshint', 'build', 'runtest'], function() {
    gulp.watch(path.src.files, ['jshint', 'build', 'runtest']);
});
