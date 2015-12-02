import Downloader from './downloader';

let handle = Downloader.download( 'https://az764295.vo.msecnd.net/public/0.10.3/VSCode-linux64.zip', 'VSCode-linux64.zip' );

let waited = false;
handle.onProgress( function( progress, curKbps, peakKbps, lowKbps, avgKbps )
{
	console.log( 'Download progress: ' + Math.floor( progress * 100 ) + '%' );
	console.log( 'Current speed: ' + Math.floor( curKbps ) + ' kbps, peak: ' + Math.floor( peakKbps ) + ' kbps, low: ' + Math.floor( lowKbps ) + ', average: ' + Math.floor( avgKbps ) + ' kbps' );
	if ( progress > 0.5 && !waited ) {
		console.log( 'Having a comic relief..' );
		handle.stop()
			.then( () => new Promise( ( resolve ) => setTimeout( resolve, 5000 ) ) )
			.then( () => handle.start() )
			.then( function() { waited = true; console.log( 'Had a comic relief!' ) } );
	}
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