import Downloader from './Downloader';

let handle = Downloader.download( 'test', 'test' );

handle.onProgress( function( progress )
{
	console.log( 'Download progress: ' + progress );
} );

handle.promise
	.then( function()
	{
		console.log( 'Happy day!' );
	} )
	.catch( function( err: NodeJS.ErrnoException )
	{
		console.log( 'You fuggin druggah: ' + err.message );
	} );