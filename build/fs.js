"use strict";
var fs_ = require("fs");
var Bluebird = require("bluebird");
var fs = Bluebird.promisifyAll(fs_);
module.exports = fs;
