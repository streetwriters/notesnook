import fetch from "node-fetch";
import fs from "fs/promises";

async function getMilestones() {
  const url = `https://api.github.com/repos/streetwriters/notesnook/milestones?state=closed`;
  const response = await fetch(url);
  if (response.ok) return await response.json();
}

async function getIssues(milestone) {
  const url = `https://api.github.com/repos/streetwriters/notesnook/issues?milestone=${milestone}&state=closed`;
  const response = await fetch(url);
  if (response.ok) return await response.json();
}

(async function main() {
  const milestone = (await getMilestones())
    .sort((a, b) => a.number - b.number)
    .pop();
  console.log("Generating changelog for version", milestone.title);
  const issues = await getIssues(milestone.number);

  await fs.writeFile(
    `changelog-${milestone.title}.md`,
    issues
      .map((issue, index) => {
        return `${index + 1}. ${issue.title} (#${issue.number})`;
      })
      .join("\n")
  );
})();
