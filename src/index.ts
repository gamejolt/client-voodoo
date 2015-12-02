import Downloader from './downloader';

let handle = Downloader.download( 'https://az764295.vo.msecnd.net/public/0.10.3/VSCode-linux64.zip', 'VSCode-linux64.zip' );

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