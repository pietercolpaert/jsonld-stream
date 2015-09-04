/**
 * This transforms a jsonld-stream to a serialized file.
 * @param jsonldstream - outstream on which we can pipe the pure json
 * @param jsonldstream - stream with jsonld context
 */
module.exports = function () {
  return require('JSONStream').stringify(false);
}
