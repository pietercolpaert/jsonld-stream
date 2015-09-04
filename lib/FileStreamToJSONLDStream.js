/**
 * Transforms a filestream of a JSONLDStream to a JSONLDStream
 * @author Pieter Colpaert <pieter.colpaert@ugent.be>
 */

var util = require('util'),
    Transform = require('stream').Transform;

var Deserializer = function (context) {
  Transform.call(this, {objectMode: true});
  this._remaining = "";
  this._count = 0;
  this["@context"] = context || {
    'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
    'dct' : 'http://purl.org/dc/terms/',
    'rdfs' : 'http://www.w3.org/2000/01/rdf-schema#',
    'xsd' : 'http://www.w3.org/2001/XMLSchema#'
  };
};

util.inherits(Deserializer, Transform);

Deserializer.prototype._transform = function (data, encoding, done) {
  this._remaining += data;
  var index = this._remaining.indexOf('\n');
  while (index > -1) {
    this._count++;
    var line = this._remaining.substring(0, index);
    this._remaining = this._remaining.substring(index + 1);
    var object = JSON.parse(line);
    if (!object) {
      done("Error parsing JSONLDStream file at line " + this._count);
    }
    this.push(object);
    index = this._remaining.indexOf('\n');
  }
  done();
}

Deserializer.prototype._flush = function (done) {
  if (this._remaining.length > 0) {
    this._count++;
    var object = JSON.parse(this._remaining);
    if (!object) {
      done("Error parsing JSONLDStream file at line " + this._count);
    }
    this.push(JSON.parse(this._remaining));
  }
  done();
};

module.exports = Deserializer;
