const fs = require("fs");
const https = require("https");

const githubToken = process.env.GITHUB_TOKEN;
const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
const prNumber = event.pull_request.number;
const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
const runId = process.env.GITHUB_RUN_ID;
const artifactUrl = `https://github.com/${owner}/${repo}/actions/runs/${runId}`;

const report = JSON.parse(fs.readFileSync("semgrep-results.json", "utf8"));

let scores = {
  SRP: 100,
  OCP: 100,
  LSP: 100,
  ISP: 100,
  DIP: 100
};

let findings = [];

for (const result of report.results || []) {
  const rule = result.check_id.toLowerCase();

  if (rule.includes("srp")) scores.SRP -= 10;
  if (rule.includes("ocp")) scores.OCP -= 10;
  if (rule.includes("lsp")) scores.LSP -= 10;
  if (rule.includes("isp")) scores.ISP -= 10;
  if (rule.includes("dip")) scores.DIP -= 10;

  if (result.severity === "ERROR") {
    for (let key in scores) scores[key] -= 1;
  }

  findings.push(`- [${result.severity}] ${result.message} — \`${result.path}:${result.start.line}\``);
}

const overall = Math.round(
  Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length
);

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
