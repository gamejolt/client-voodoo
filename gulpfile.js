'use strict';

let gulp = require( 'gulp' );
let sequence = require( 'run-sequence' );
let plugins = require( 'gulp-load-plugins' )();
let path = require( 'path' );
let del = require( 'del' );

let typescript = plugins.typescript.createProject( './src/tsconfig.json', {
	typescript: require( 'typescript' ),
} );

gulp.task( 'clean', function()
{
	return del( './build/**/*' );
} );

gulp.task( 'js', function()
{
	return gulp.src( './src/**/*.ts' )
		.pipe( plugins.plumber() )
		.pipe( plugins.sourcemaps.init() )
		.pipe( plugins.typescript( typescript ) )
		.pipe( plugins.babel( {
			presets: [ 'es2015' ],
			plugins: [ 'transform-runtime' ],
		} ) )
		.pipe( plugins.sourcemaps.write( '.', {
			sourceRoot: function( file )
			{
				// Gotta return a relative path from the build file to the source folder.
				return path.relative(
					path.join( __dirname, file.relative ),
					path.join( __dirname, 'src' )
				) + path.sep;
			}
		} ) )
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