/**
 * 
 * @param {string} filename 
 * @returns file extension
 */
function get(filename)
{
  var ext = /^.+\.([^.]+)$/.exec(filename);
  return ext == null ? "" : ext[1];
}

module.exports = {
	get
}