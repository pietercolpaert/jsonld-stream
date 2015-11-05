# jsonld-stream

This is a draft specification for building semantically interoperable javascript object/document streams.

## Spec

A JSON-LD stream is a stream that emits javascript objects conformant to the [JSON-LD specification](http://www.w3.org/TR/json-ld/), except that these objects __do not__ include a `@context` object.

In the stream, objects that only contain an `@context` property _may_ be given to denote the context for all objects in the stream.  The programmer _must_ make sure that a `@context` written in after objects have already been emitted, still work for all previously emitted objects.

### Use in document stores (such as MongoDB) ###

Each collection _should_ contain one `@context` document which can be used to convert all objects in the collection to RDF.

The root `@id` of the object _should_ be used as the internal identifier of the document (E.g., in MongoDB `@id` becomes `_id`)

### Serialize to files ###

When serialized to a file, each stream element _must_ be stringified on one line. Each object in a file is delimited by a newline (`\n`).

## Javascript library

[![Build Status](https://travis-ci.org/pietercolpaert/jsonld-stream.svg?branch=js-lib)](https://travis-ci.org/pietercolpaert/jsonld-stream)

This repository also contains a javascript library to work with jsonld-streams.

```bash
npm install jsonld-stream --save
```

It defines a couple of transformer classes which can be used as follows:

```javascript
var jsonldstream = require('jsonld-stream');
fs.createReadStream('./test/data/connections.jsonldstream', {encoding : 'utf8'})
  .pipe(new jsonldstream.Deserializer())
  .pipe(new jsonldstream.JSONLDStreamToTriples())
  .pipe(new jsonldstream.TriplesToJSONLDStream())
  .pipe(new jsonldstream.Serializer());
```
