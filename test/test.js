var fs = require('fs'),
    should = require('should'),
    JSONLDStreamToTriples = require('../lib/jsonld-stream.js').JSONLDStreamToTriples,
    TriplesToJSONLDStream = require('../lib/jsonld-stream.js').TriplesToJSONLDStream,
    Serializer = require('../lib/jsonld-stream.js').Serializer,
    Deserializer = require('../lib/jsonld-stream.js').Deserializer;

describe('Deserializing from files', function () {
  var readstream = fs.createReadStream('./test/data/connections.jsonldstream', {encoding : 'utf8'});
  //Now, they should be able to emit connections
  var stream = readstream.pipe(new Deserializer(context));
  it('should be emitting JSON objects', function (done) {
    var count = 0;
    stream.on("data", function (object) {
      if (object && object["@id"]) {
        count++;
      } else if (object["@context"]) {
        context = object;
      }
    });
    stream.on("end", function () {
      if (count === 15) {
        context.should.have.property("@context");
        done();
      } else {
        done("The number of things that were deserialized is incorrect. We've counted " + count + " instead of 15");
      }
    });
  });
  
})

describe('Serialization test', function () {
  var readstream = fs.createReadStream('./test/data/connections.jsonldstream', {encoding : 'utf8'});
  var jsonldStream = readstream.pipe(new Deserializer());
  var context_TEST, count = 0;
  var writeStream = new require('stream').Writable({objectMode:true});
  writeStream._write = function (data, encoding, done) {
    if (data) {
      var object = JSON.parse(data);
      if (object["@context"]) {
        context_TEST = object;
      } else {
        count++;
      }
    }
    done();
  };
  it("should serialise all the things", function (done) {
    jsonldStream.pipe(new Serializer()).pipe(writeStream).on("finish", function () {
      context_TEST.should.have.property("@context");
      count.should.be.exactly(15);
      done();
    });
  });
})

describe('JSONLD stream to triples test', function () {
  var readstream = fs.createReadStream('./test/data/connections.jsonldstream', {encoding : 'utf8'});
  var jsonldStream = readstream.pipe(new Deserializer());
  var countTriples = 0, lastTriple;
  
  it("should output the right triples", function (done) {
    jsonldStream.pipe(new JSONLDStreamToTriples()).on("data", function (data) {
      countTriples++;
      lastTriple = data;
    }).on("end", function () {   
      countTriples.should.be.exactly(18);
      lastTriple.object.should.be.exactly("http://semweb.mmlab.be/ns/linkedconnections#Connection");
      done();
    });
  });
})

describe('Triples stream to JSONLD-stream test', function () {
  var readstream = fs.createReadStream('./test/data/connections.jsonldstream', {encoding : 'utf8'});
  var jsonldStream = readstream.pipe(new Deserializer());
  var countObjects = 0, lastObject, context = {};
  
  it("should output the right objects", function (done) {
    jsonldStream.pipe(new JSONLDStreamToTriples()).pipe(new TriplesToJSONLDStream()).on("data", function (object) {
      if (object["@context"]) {
        context = object;
      } else {
        countObjects++;
        lastObject = object;
      }
    }).on("end", function () {
      context.should.have.property('@context');
      countObjects.should.be.exactly(15);
      lastObject["@type"].should.be.exactly("http://semweb.mmlab.be/ns/linkedconnections#Connection");
      lastObject["@id"].should.be.exactly("http://example.org/15");
      done();
    });
  });
})
