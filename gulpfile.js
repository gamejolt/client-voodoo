'use strict';

const gulp = require( 'gulp' );
const sequence = require( 'run-sequence' );
const shell = require( 'gulp-shell' );
const plugins = require( 'gulp-load-plugins' );
const del = require( 'del' );
const config = require( 'config' );
const path = require( 'path' );

// Load gulp plugins
plugins();

gulp.task( 'clean', function()
{
	return del( './build/**/*' );
} );

gulp.task( 'clean-joltron', function()
{
	return del( 'bin' );
} );

gulp.task( 'js', shell.task( [
	'tsc',
] ) );

const gameRunnerRepo = path.join( process.env.GOPATH, 'src', ...config.get( 'joltron-repo' ).split( '/' ) );
function getExecutable()
{
	switch ( process.platform ) {
		case 'win32':
			return path.join( __dirname, 'bin', 'joltron_win32.exe' );
		case 'linux':
			return path.join( __dirname, 'bin', 'joltron_linux' );
		case 'darwin':
			return path.join( __dirname, 'bin', 'joltron_osx' );
		default:
			throw new Error( 'Unsupported OS' );
	}
}

if ( process.platform == 'win32' ) {
	gulp.task( 'go-joltron', shell.task( [
		'cd ' + gameRunnerRepo + ' && build.bat',
		'mkdir bin',
		'copy ' + path.join( gameRunnerRepo, 'joltron.exe' ) + ' ' + getExecutable(),
	] ) );
}
else {
	gulp.task( 'go-joltron', shell.task( [
		'cd ' + gameRunnerRepo + ' && ./build.sh',
		'mkdir bin',
		'cp ' + path.join( gameRunnerRepo, 'joltron' ) + ' ' + getExecutable(),
	] ) );
}

gulp.task( 'build', function( cb )
{
	return sequence( 'clean', 'js', cb );
} );

gulp.task( 'build-joltron', function( cb )
{
	return sequence( 'clean-joltron', 'go-joltron', cb );
} );

gulp.task( 'watch', [ 'build', 'build-joltron' ], function()
{
	gulp.watch( [ './src/**/*', 'tsconfig.json' ], [ 'build' ] );
	gulp.watch( [ gameRunnerRepo + '/**/*.go' ], [ 'build-joltron' ] );
} );