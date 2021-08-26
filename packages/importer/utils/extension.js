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

/**
 *
 * @param {string} fileName
 * @returns file name without extension
 */
function getName(fileName) {
  let parts = fileName.split(".");
  let ext = parts.pop();
  return fileName.replace(`.${ext}`, "");
}

module.exports = {
	get,
  getName
}