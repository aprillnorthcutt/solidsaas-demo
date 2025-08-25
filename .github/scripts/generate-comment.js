const fs = require("fs");
const core = require("@actions/core");
const github = require("@actions/github");

// Get PR and repo info
const prNumber = github.context.payload.pull_request.number;
const runId = github.context.runId;
const repo = github.context.repo;
const artifactUrl = `https://github.com/${repo.owner}/${repo.repo}/actions/runs/${runId}`;

// Read and parse the Semgrep JSON report
const report = JSON.parse(fs.readFileSync("semgrep-results.json", "utf-8"));

// Initialize scores
let scores = {
  SRP: 100,
  OCP: 100,
  LSP: 100,
  ISP: 100,
  DIP: 100
};

let findings = [];

// Parse results and adjust scores
for (const result of report.results) {
  const msg = result.message.toLowerCase();
  if (msg.includes("srp")) scores.SRP -= 10;
  if (msg.includes("ocp")) scores.OCP -= 10;
  if (msg.includes("lsp")) scores.LSP -= 10;
  if (msg.includes("isp")) scores.ISP -= 10;
  if (msg.includes("dip")) scores.DIP -= 10;

  if (result.severity === "ERROR") {
    for (let key in scores) scores[key] -= 1; // Penalize all slightly
  }

  findings.push(`- [${result.severity}] ${result.message} — \`${result.path}:${result.start.line}\``);
}

// Compute overall average
const overall = Math.round(
  Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length
);

// Compose comment
const body = [
  `✅ **SolidSaaS Scan Complete**`,
  ``,
  `**Estimated SOLID Score:** ${overall}`,
  `- SRP: ${scores.SRP}`,
  `- OCP: ${scores.OCP}`,
  `- LSP: ${scores.LSP}`,
  `- ISP: ${scores.ISP}`,
  `- DIP: ${scores.DIP}`,
  ``,
  `**Top Findings:**`,
  ...findings.slice(0, 5),
  ``,
  `[📎 Download report artifact](${artifactUrl})`
].join("\n");

// Post comment to PR
github.getOctokit(process.env.GITHUB_TOKEN).rest.issues.createComment({
  issue_number: prNumber,
  owner: repo.owner,
  repo: repo.repo,
  body: body
});
