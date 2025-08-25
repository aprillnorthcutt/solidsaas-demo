const fs = require("fs");
const https = require("https");

// Environment variables
const githubToken = process.env.GITHUB_TOKEN;
const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
const prNumber = event.pull_request.number;
const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
const runId = process.env.GITHUB_RUN_ID;
const artifactUrl = `https://github.com/${owner}/${repo}/actions/runs/${runId}`;

// Load and parse the Semgrep report
const report = JSON.parse(fs.readFileSync("semgrep-results.json", "utf8"));
const results = report.results || [];

let scores = {
  SRP: 100,
  OCP: 100,
  LSP: 100,
  ISP: 100,
  DIP: 100
};

let findings = [];

for (const result of results) {
  const message = result.message || "Unknown";
  const severity = (result.severity || "UNKNOWN").toUpperCase();
  const ruleId = result.check_id || "unknown-rule";
  const shortRule = ruleId.replace(/^.*semgrep[./]/, "");  // Strip prefix
  const file = result.path || "unknown";
  const line = result.start?.line || 0;

  // Adjust scores based on rule ID
  if (shortRule.includes("srp")) scores.SRP -= 10;
  if (shortRule.includes("ocp")) scores.OCP -= 10;
  if (shortRule.includes("lsp")) scores.LSP -= 10;
  if (shortRule.includes("isp")) scores.ISP -= 10;
  if (shortRule.includes("dip")) scores.DIP -= 10;

  // Penalize further for high severity
  if (severity === "ERROR" || severity === "CRITICAL") {
    for (let key in scores) scores[key] -= 1;
  }

  findings.push(`- [${severity}] ${message} — \`${file}:${line}\` (Rule: ${shortRule})`);
}

// Compute overall average
const overall = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / 5);

// Format comment body
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
  findings.length > 0 ? findings.slice(0, 5).join("\n") : "*No violations found*",
  ``,
  `[📎 Download report artifact](${artifactUrl})`
].join("\n");

// Post comment to PR
const data = JSON.stringify({ body });

const options = {
  hostname: "api.github.com",
  path: `/repos/${owner}/${repo}/issues/${prNumber}/comments`,
  method: "POST",
  headers: {
    Authorization: `Bearer ${githubToken}`,
    "User-Agent": "solid-saas-bot",
    "Content-Type": "application/json",
    "Content-Length": data.length
  }
};

const req = https.request(options, (res) => {
  console.log(`GitHub API response status: ${res.statusCode}`);
  res.on("data", d => process.stdout.write(d));
});

req.on("error", (error) => {
  console.error("Failed to post comment:", error);
});

req.write(data);
req.end();
