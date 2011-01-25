/**
 * Trims the whitespace from the head and tail of a string.
 * @param s String to trim.
 * @return The trimmed string.
 */
exports.trim = function(s) {
  return s.replace(/\s*$/, '').replace(/^\s*/, '');
};

/**
 * Overrides the attributes of the given object with another.
 * @param g The object to override.
 * @param w The object to override with.
 * @return The overridden object.
 */
exports.override = function(g, w) {
  for (var k in w)
    g[k] = w[k];
  return g;
};

/**
 * Adds attributes that are not already defined to a given object
 * from another given object.
 * @param g The object of which to set the attributes.
 * @param w The object to mix in.
 * @return The resulting mixed in object.
 */
exports.mixin = function(g, w) {
 for (var k in w) {
   if (typeof g[k] == "undefined")
    g[k] = w[k];
 } 
 return g;
};