/*
node-bzip - a pure-javascript Node.JS module for decoding bzip2 data

Copyright (C) 2012 Eli Skeggs

This library is free software; you can redistribute it and/or
modify it under the terms of the GNU Lesser General Public
License as published by the Free Software Foundation; either
version 2.1 of the License, or (at your option) any later version.

This library is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public
License along with this library; if not, see
http://www.gnu.org/licenses/lgpl-2.1.html

Adapted from bzip2.js, copyright 2011 antimatter15 (antimatter15@gmail.com).

Based on micro-bunzip by Rob Landley (rob@landley.net).

Based on bzip2 decompression code by Julian R Seward (jseward@acm.org),
which also acknowledges contributions by Mike Burrows, David Wheeler,
Peter Fenwick, Alistair Moffat, Radford Neal, Ian H. Witten,
Robert Sedgewick, and Jon L. Bentley.
*/
// import { Readable } from 'stream';
// const BITMASK = [0x00, 0x01, 0x03, 0x07, 0x0F, 0x1F, 0x3F, 0x7F, 0xFF];
// // offset in bytes
// class BitReader
// {
// 	private bitOffset: number;
// 	private curByte: number;
// 	private hasByte: boolean;
// 	private queuedRead: Function;
// 	constructor( private stream: Readable )
// 	{
// 		this.stream = stream;
// 		this.stream.on( 'readable', this._resume.bind( this ) );
// 		this.bitOffset = 0;
// 		this.curByte = 0;
// 		this.hasByte = false;
// 	}
// 	private _resume()
// 	{
// 		if ( this.queuedRead ) {
// 			this.curByte = this.stream.read( 1 );
// 			this.hasByte = true;
// 			this.queuedRead();
// 		}
// 	}
// 	private _ensureBytes( bytes, cb )
// 	{
// 		if ( bytes && !this.hasByte ) {
// 			this.curByte = this.stream.read( bytes );
// 			if ( this.curByte === null ) {
// 				this.queuedRead = cb;
// 			}
// 			else {
// 				this.hasByte = true;
// 			}
// 		}
// 	}
// 	// reads bits from the buffer
// 	read( bits: number )
// 	{
// 		let result = 0;
// 		while ( bits > 0 ) {
// 			let missingBits = bits - 8 + this.bitOffset;
// 			let bytesToRequest = ( missingBits ) >> 3 + ( ( ( missingBits ) & 0x7 ) ? 1 : 0 );
// 			if ( bytesToRequest ) {
// 				this._ensureBytes( bytesToRequest )
// 			}
// 			else {
// 				result <<= remaining;
// 				result |= BITMASK[remaining] & this.curByte;
// 				this.hasByte = false;
// 				this.bitOffset = 0;
// 				bits -= remaining;
// 			}
// 			bytesToRequest && this._ensureBytes( bytesToRequest );
// 			let remaining = 8 - this.bitOffset;
// 			// if we're in a byte
// 			if (bits >= remaining) {
// 				result <<= remaining;
// 				result |= BITMASK[remaining] & this.curByte;
// 				this.hasByte = false;
// 				this.bitOffset = 0;
// 				bits -= remaining;
// 			}
// 			else {
// 				result <<= bits;
// 				let shift = remaining - bits;
// 				result |= (this.curByte & (BITMASK[bits] << shift)) >> shift;
// 				this.bitOffset += bits;
// 				bits = 0;
// 			}
// 		}
// 		return result;
// 	}
// 	private _read( )
// }
// // seek to an arbitrary point in the buffer (expressed in bits)
// BitReader.prototype.seek = function(pos) {
//   let n_bit = pos % 8;
//   let n_byte = (pos - n_bit) / 8;
//   this.bitOffset = n_bit;
//   this.stream.seek(n_byte);
//   this.hasByte = false;
// };
// // reads 6 bytes worth of data using the read method
// BitReader.prototype.pi = function() {
//   let buf = new Buffer(6), i;
//   for (i = 0; i < buf.length; i++) {
//     buf[i] = this.read(8);
//   }
//   return buf.toString('hex');
// };
// module.exports = BitReader;
"use strict";
//# sourceMappingURL=bit-reader.js.map
