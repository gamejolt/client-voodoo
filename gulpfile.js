'use strict';

let gulp = require( 'gulp' );
let sequence = require( 'run-sequence' );
let plugins = require( 'gulp-load-plugins' )();

let typescript = plugins.typescript.createProject( './src/tsconfig.json', {
	typescript: require( 'typescript' ),
} );

gulp.task( 'clean', function()
{
	return gulp.src( './build/**/*', { read: false } )
		.pipe( plugins.rimraf() );
} );

gulp.task( 'js', function()
{
	return gulp.src( './src/**/*.ts' )
		.pipe( plugins.plumber() )
		.pipe( plugins.sourcemaps.init() )
		.pipe( plugins.typescript( typescript ) )
		.pipe( plugins.sourcemaps.write() )
		.pipe( gulp.dest( './build' ) );
} );

gulp.task( 'build', function( cb )
{
	return sequence( 'clean', 'js', cb );
} );

gulp.task( 'watch', [ 'build' ], function()
{
	gulp.watch( [ './src/**/*' ], [ 'build' ] );
} );