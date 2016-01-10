import { expect } from 'chai';
import { PidFinder } from './pid-finder';
import Common from '../common';

describe( 'Pid finder', function()
{
	it( 'Should work', Common.test( async ( done ) =>
	{
		expect( ( await PidFinder.find( process.pid ) ).size ).to.not.eq( 0 );
		done();
	} ) );

	it( 'Should work while explicitly giving the correct cmd name', Common.test( async ( done ) =>
	{
		let testSet = new Set<string>();
		testSet.add( process.argv.join( ' ' ) );

		expect( ( await PidFinder.find( process.pid, testSet ) ).size ).to.not.eq( 0 );
		done();
	} ) );

	it( 'Should say it cant find a nonexistant pid', Common.test( async ( done ) =>
	{
		expect( ( await PidFinder.find( 99999 ) ).size ).to.eq( 0 );
		done();
	} ) );


	it( 'Should say it cant find a wrong expected cmd name', Common.test( async ( done ) =>
	{
		let testSet = new Set<string>();
		testSet.add( 'wrong' );

		expect( ( await PidFinder.find( process.pid, testSet ) ).size ).to.eq( 0 );
		done();
	} ) );
} );