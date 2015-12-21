var EventEmitter = require('events').EventEmitter;

var sayYay = function()
{
  console.log( 'yay' );
};

var emitter = new EventEmitter();
emitter.on( 'test', sayYay );
emitter.on( 'test', sayYay );
emitter.emit( 'test' );
