# jsonld-stream

This is a draft specification for building semantically interoperable javascript object/document streams.

## Spec

A nodejs JSON-LD stream is a stream that emits javascript objects conformant to the [JSON-LD specification](http://www.w3.org/TR/json-ld/), except that these objects __do not__ include a `@context` object.

The `@context` is emitted in a separate `@context` event. The `@context` may be updated during the course of the stream. The programmer _must_ make sure that the `@context` still works for all previously emitted objects. When something is modified in the `@context`, the full `@context` object is emitted again.

## Use in document stores (such as MongoDB)

In a document store, the `@context`s of the collections can be kept in a separate collection. The documents can be stored directly in a collection. When an `@id` is set for a document, the `@id` _should_ be used as the internal identifier for that document (e.g., `_id` in MongoDB).
