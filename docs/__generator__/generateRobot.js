const fs = require("fs");

const ROBOT_TEXT = `User-Agent: *`;

function generateRobot(docsOutputPath) {
  fs.writeFileSync(`${docsOutputPath}/robot.txt`, ROBOT_TEXT);
}

module.exports = generateRobot;
