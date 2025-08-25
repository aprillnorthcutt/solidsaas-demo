const fs = require("fs");
const https = require("https");

const githubToken = process.env.GITHUB_TOKEN;
const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
const prNumber = event.pull_request.number;
const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
const runId = process.env.GITHUB_RUN_ID;
const artifactUrl = `https://github.com/${owner}/${repo}/actions/runs/${runId}`;

// Load Semgrep results
let rawData;
try {
  rawData = fs.readFileSync("semgrep-results.json", "utf8");
} catch (err) {
  console.error("Failed to read semgrep-results.json:", err);
  process.exit(1);
}

const report = JSON.parse(rawData);
const findings = report.results || [];

let scores = { SRP: 100, OCP: 100, LSP: 100, ISP: 100, DIP: 100 };
let messages = [];

for (const result of findings) {
  const message = result.message?.toLowerCase() || "";
  const severity = result.severity || "Unknown";
  const ruleId = result.check_id?.replace(/^.*semgrep\./, "") || "Unspecified rule";

  // Adjust scores
  if (message.includes("srp")) scores.SRP -= 10;
  if (message.includes("ocp")) scores.OCP -= 10;
  if (message.includes("lsp")) scores.LSP -= 10;
  if (message.includes("isp")) scores.ISP -= 10;
  if (message.includes("dip")) scores.DIP -= 10;

  messages.push(`- [${severity}] ${ruleId} — \`${result.path}:${result.start.line}\``);
}

const totalScore = Math.round(
  Object.values(scores).reduce((a, b) => a + b, 0) / 5
);

// Comment body
const bodyText = [
  `✅ **SolidSaaS Scan Complete**`,
  ``,
  `**Estimated SOLID Score:** ${totalScore}`,
  `- SRP: ${scores.SRP}`,
  `- OCP: ${scores.OCP}`,
  `- LSP: ${scores.LSP}`,
  `- ISP: ${scores.ISP}`,
  `- DIP: ${scores.DIP}`,
  ``,
  `**Top Findings:**`,
  messages.length ? messages.slice(0, 5).join("\n") : "- No violations found.",
  ``,
  `📎 [Download report artifacts](${artifactUrl})`
].join("\n");

// POST to GitHub
const data = JSON.stringify({ body: bodyText });

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
  console.log(`GitHub API response: ${res.statusCode}`);
  res.on("data", d => process.stdout.write(d));
});

req.on("error", (error) => {
  console.error("Failed to post comment:", error);
});

req.write(data);
req.end();
