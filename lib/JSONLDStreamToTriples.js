/**
 * This class transforms a JSONLD-stream into a triplesstream according to the N3 specification
 * @author Pieter Colpaert <pieter.colpaert@ugent.be>
 */
var Transform = require('stream').Transform,
    util = require('util'),
    N3 = require('n3'),
    jsonld = require('jsonld');

util.inherits(JSONLDStreamToTriples, Transform);

function JSONLDStreamToTriples (context) {
  Transform.call(this, {objectMode : true});
  this["@context"] = context && context["@context"] || {
    'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
    'dct' : 'http://purl.org/dc/terms/',
    'rdfs' : 'http://www.w3.org/2000/01/rdf-schema#',
    'xsd' : 'http://www.w3.org/2001/XMLSchema#'
  };
}

JSONLDStreamToTriples.prototype._transform = function (object, encoding, done) {
  if (object["@context"]) {
    //This isn't data, but it's a context update
    this["@context"] = object["@context"];
    done();
  } else {
    //This is data which can be converted to RDF using the jsonld library
    object["@context"] = this["@context"];
    var self = this;
    jsonld.toRDF(object, {}, function (err, dataset) {
      if (err) {
        done(err);
      } else {
        for (var i in dataset["@default"]) {
          var object = "";
          if (dataset["@default"][i].object.type === 'IRI') {
            object = dataset["@default"][i].object.value;
          } else {
            object = N3.Util.createLiteral(dataset["@default"][i].object.value, dataset["@default"][i].object.datatype || dataset["@default"][i].object.language || null);
          }
          var triple = {
            subject : dataset["@default"][i].subject.value,
            predicate : dataset["@default"][i].predicate.value,
            object : object
          }
          self.push(triple);
        }
        done();
      }
    });
  }
};

module.exports = JSONLDStreamToTriples;
