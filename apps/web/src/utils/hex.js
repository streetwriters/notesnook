const byteToHex = [];
const hexToByte = [];

for (let n = 0; n <= 0xff; ++n) {
  const hexOctet = n.toString(16).padStart(2, "0");
  byteToHex.push(hexOctet);
  hexToByte[hexOctet] = n;
}

function bufferToHex(buff) {
  const hexOctets = new Array(buff.length); // new Array(buff.length) is even faster (preallocates necessary array size), then use hexOctets[i] instead of .push()

  for (let i = 0; i < buff.length; ++i) hexOctets[i] = byteToHex[buff[i]];

  return hexOctets.join("");
}

function hexToBuffer(hex) {
  var length2 = hex.length;
  if (length2 % 2 !== 0) {
    throw new Error("hex string must have length a multiple of 2");
  }
  var length = length2 / 2;
  var result = new Uint8Array(length);
  for (var i = 0; i < length; i++) {
    var i2 = i * 2;
    var b = hex.substring(i2, i2 + 2);
    result[i] = hexToByte[b];
  }
  return result;
}
export { hexToBuffer, bufferToHex };
