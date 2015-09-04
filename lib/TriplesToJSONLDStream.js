/**
 * This helper class makes JSON-LD objects from a triples stream.
 * From the moment a subject is given which has got nothing to do with the current being composed object, the object is pushed to the client.
 * The script works in the philosophy that related triples are going to be streamed out next to each other.
 * 
 * @author Pieter Colpaert <pieter.colpaert@ugent.be>
 */
var Transform = require('stream').Transform,
    util = require('util'),
    N3 = require('n3'),
    jsonld = require('jsonld');

util.inherits(TriplesToJSONLDStream, Transform);

function TriplesToJSONLDStream (context) {
  Transform.call(this, {objectMode : true});
  if (context && !context["@context"]) {
    context["@context"] = context;
  }
  if (context) {
    this["@context"] = context["@context"];
  } else {
    this["@context"] = {
      'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
      'dct' : 'http://purl.org/dc/terms/',
      'rdfs' : 'http://www.w3.org/2000/01/rdf-schema#',
      'xsd' : 'http://www.w3.org/2001/XMLSchema#'
    };
  }
  this.push({"@context": this["@context"]});
  
  this._currentJSONSubjects = [];
  this._jsonld = {
    "@graph" : []
  };
}

TriplesToJSONLDStream.prototype._flush = function (done) {
  var self = this;
  this._createObject(this._jsonld, function (err, object) {
    if (err) {
      throw err;
    } else {
      self.push(object);
      done();
    }
  });
};

TriplesToJSONLDStream.prototype._createObject = function (jsonldGraph, callback) {
  //Let's couple @id here
  jsonldGraph = this._coupleObjects(jsonldGraph);
  var self = this;
  jsonld.compact(jsonldGraph, {"@context": this["@context"]}, function(err, compacted) {
    if (err) {
      callback(err);
    } else {
      delete(compacted["@context"]);
      callback(null, compacted);
    }
  });
}

TriplesToJSONLDStream.prototype._coupleObjects = function (jsonldGraph) {
  // All the objects with a similar @id are going to be merged.
  var temp = {};
  for (var i = 0; i < jsonldGraph["@graph"].length; i++) {
    // if the element doesn't exist yet, create it in the helper graph
    if (typeof temp[jsonldGraph["@graph"][i]["@id"]] === "undefined") {
      temp[jsonldGraph["@graph"][i]["@id"]] = jsonldGraph["@graph"][i];
    } else {
      //Merge the elements: it will contain an @type, or a specific predicate, as we have 1 array element per 1 triple here
      for (var key in jsonldGraph["@graph"][i]) {
        //skip @id
        if (key === '@id') continue;
        var object = jsonldGraph["@graph"][i][key];
        //If the predicate already exists, and if it's not the same thing, we need to add it to an array.
        if (typeof temp[jsonldGraph["@graph"][i]["@id"]][key] !== "undefined" && temp[jsonldGraph["@graph"][i]["@id"]][key] !== object) {
          //In case it is already an array, just add it (if it doesn't already exist in the array). In case it's not yet an array, make an array out of it
          if (temp[jsonldGraph["@graph"][i]["@id"]][key] instanceof Array && temp[jsonldGraph["@graph"][i]["@id"]][key].indexOf(jsonldGraph["@graph"][i]["@id"][key]) === -1) {
            temp[jsonldGraph["@graph"][i]["@id"]][key].push(object);
          } else {
            //if it isn't yet an array, make an array from it and add the element
            var helper = temp[jsonldGraph["@graph"][i]["@id"]][key];
            temp[jsonldGraph["@graph"][i]["@id"]][key] = [helper, object];
          }
        } else if (typeof temp[jsonldGraph["@graph"][i]["@id"]][key] === "undefined") {
          //If the predicate does not yet exist, make the predicate
          temp[jsonldGraph["@graph"][i]["@id"]][key] = object;
        }
      }
    }
  }
  
  jsonldGraph["@graph"] = [];
  for (var key in temp) {
    jsonldGraph["@graph"].push(temp[key])
  }
  return jsonldGraph;
};

TriplesToJSONLDStream.prototype._transform = function (triple, encoding, done) {
  if ((this._currentJSONSubjects.indexOf(triple.subject) === -1 && this._currentJSONSubjects.indexOf(triple.object) === -1) && this._currentJSONSubjects.length !== 0) {
    //We need to output an object and reset the current state
    var self = this;
    this._createObject(this._jsonld, function (err, object) {
      if (err) {
        throw err;
      } else {
        self.push(object);
      }
    });
    this._currentJSONSubjects = [];
    this._jsonld = {
      "@graph" : []
    };
  }
  this._currentJSONSubjects.push(triple.subject);
  var object = {
    "@id" : triple.subject
  };
  if (N3.Util.isIRI(triple.object)) {
    if (triple.predicate === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' || triple.predicate === 'a') {
      object["@type"] = triple.object;
    } else {
      //This URI might need more information:
      //Probably we'll find it later and might add it to this JSON object
      this._currentJSONSubjects.push(triple.object);
      object[triple.predicate] = {
        "@id" : triple.object
      };
    }
  } else {
    object[triple.predicate] = {
      "@value" : N3.Util.getLiteralValue(triple.object)
    };
    if (N3.Util.getLiteralType(triple.object)) {
      object[triple.predicate]["@type"] = N3.Util.getLiteralType(triple.object);
    }
    if (N3.Util.getLiteralLanguage(triple.object)) {
      object[triple.predicate]["@language"] = N3.Util.getLiteralLanguage(triple.object);
    }
  }
  this._jsonld["@graph"].push(object);
  done();
};

module.exports = TriplesToJSONLDStream;
