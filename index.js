'use strict';
var commentRx = /^\W*\/\/@\W+sourceMappingURL=data:(?:application|text)\/json;base64,(.+)/mg;

function decodeBase64(base64) {
  return new Buffer(base64, 'base64').toString();
}

function stripComment(sm) {
  return sm.split(',').pop();
}

function Converter (sourcemap, isEncoded, isJSON, hasComment) {
  var sm = sourcemap;
  try {
    if (hasComment) sm = stripComment(sm);
    if (isEncoded) sm = decodeBase64(sm);
    if (isJSON || isEncoded) sm = JSON.parse(sm);

    this.sourcemap = sm;
  } catch(e) {
    return null;
  }
}

Converter.prototype.toJSON = function () {
  return JSON.stringify(this.sourcemap);
};

Converter.prototype.toBase64 = function () {
  var json = this.toJSON();
  return new Buffer(json).toString('base64');
};

Converter.prototype.toComment = function () {
  var base64 = this.toBase64();
  return '//@ sourceMappingURL=data:application/json;base64,' + base64;
};

Converter.prototype.addProperty = function (key, value) {
  if (this.sourcemap.hasOwnProperty(key)) throw new Error('property %s already exists on the sourcemap, use set property instead');
  return this.setProperty(key, value);
};

Converter.prototype.setProperty = function (key, value) {
  this.sourcemap[key] = value;
  return this;
};

exports.fromObject = function (obj) {
  return new Converter(obj, false, false, false);
};

exports.fromJSON = function (json) {
  return new Converter(json, false, true, false);
};

exports.fromBase64 = function (base64) {
  return new Converter(base64, true, false, false);
};

exports.fromComment = function (comment) {
  return new Converter(comment, true, false, true);
};

// Finds last sourcemap comment in file or returns null if none was found
exports.fromSource = function (content) {
  var m = content.match(commentRx);
  return m ? exports.fromComment(m.pop()) : null;
};

exports.removeComments = function (src) {
  return src.replace(commentRx, '');
};
