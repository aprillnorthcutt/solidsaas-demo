const fs = require("fs");
const https = require("https");

// Pull necessary environment variables
const githubToken = process.env.GITHUB_TOKEN;
const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
const prNumber = event.pull_request.number;
const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
const runId = process.env.GITHUB_RUN_ID;
const artifactUrl = `https://github.com/${owner}/${repo}/actions/runs/${runId}`;

// Read and parse the Semgrep JSON report
const reportPath = "semgrep-results.json";
if (!fs.existsSync(reportPath)) {
  console.error("semgrep-results.json not found.");
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));

// Initialize SOLID principle scores
let scores = {
  SRP: 100,
  OCP: 100,
  LSP: 100,
  ISP: 100,
  DIP: 100
};

let findings = [];

// Process findings
for (const result of report.results || []) {
  const message = result.message || "Unspecified rule";
  const severity = result.severity || "UNKNOWN";
  const file = result.path || "unknown file";
  const line = result.start?.line ?? "?";

  // Lowercase message to match principles
  const msgLower = message.toLowerCase();
  if (msgLower.includes("srp")) scores.SRP -= 10;
  if (msgLower.includes("ocp")) scores.OCP -= 10;
  if (msgLower.includes("lsp")) scores.LSP -= 10;
  if (msgLower.includes("isp")) scores.ISP -= 10;
  if (msgLower.includes("dip")) scores.DIP -= 10;

  // Reduce all scores a bit if ERROR severity
  if (severity === "ERROR") {
    for (let key in scores) scores[key] -= 1;
  }

  findings.push(`- [${severity}] ${message} — \`${file}:${line}\``);
}

// Final score is average
const overall = Math.round(
  Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length
);

// Construct the PR comment body
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
  findings.length > 0 ? findings.slice(0, 5).join("\n") : "_No issues found._",
  ``,
  `[📎 Download full report artifacts](${artifactUrl})`
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
    "Content-Length": Buffer.byteLength(data)
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
