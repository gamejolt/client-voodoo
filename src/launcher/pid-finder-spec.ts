import { expect } from 'chai';
import { PidFinder } from './pid-finder';
import Common from '../common';

describe( 'Pid finder', function()
{
	it( 'Should work', Common.test( async ( done ) =>
	{
		expect( await PidFinder.find( process.pid ) ).to.not.eq( '' );
		done();
	} ) );

	it( 'Should say it cant find a nonexistant pid', Common.test( async ( done ) =>
	{
		expect( await PidFinder.find( 99999 ) ).to.eq( '' );
		done();
	} ) );


	it( 'Should say it cant find a wrong expected cmd name', Common.test( async ( done ) =>
	{
		expect( await PidFinder.find( process.pid, 'wrong' ) ).to.eq( '' );
		done();
	} ) );
} );