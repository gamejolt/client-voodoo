import * as mkdirp from 'mkdirp';

export let domain = process.env.NODE_ENV === 'development'
	? 'http://development.gamejolt.com'
	: 'https://gamejolt.com';

let _pidDir = '';
export function PID_DIR()
{
	return _pidDir;
};

export function ensurePidDir()
{
	return new Promise( ( resolve, reject ) =>
	{
		mkdirp( _pidDir, ( err, made ) =>
		{
			if ( err ) {
				return reject( err );
			}
			return resolve( made );
		} );
	} );
};

export function setPidDir( pidDir: string )
{
	if ( !_pidDir ) {
		_pidDir = pidDir;
		return true;
	}
	return false;
};
