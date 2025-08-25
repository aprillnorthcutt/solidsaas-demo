const fs = require("fs");
const https = require("https");

// Environment variables from GitHub Actions
const githubToken = process.env.GITHUB_TOKEN;
const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
const runId = process.env.GITHUB_RUN_ID;
const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
const prNumber = event.pull_request.number;
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

// Initialize SOLID principle scores
let scores = { SRP: 100, OCP: 100, LSP: 100, ISP: 100, DIP: 100 };
let messages = [];

// Analyze findings
for (const result of findings) {
  const msg = result.extra?.message || "Unspecified rule";
  const principle = result.extra?.metadata?.principle?.toUpperCase?.() || null;
  const severity = result.extra?.severity || "Unknown";
  const file = result.path;
  const line = result.start?.line || 0;

  // Apply scoring deduction
  if (principle && scores.hasOwnProperty(principle)) {
    scores[principle] -= 10;
  }
  if (severity === "ERROR") {
    for (let key in scores) scores[key] -= 1;
  }

  // Format finding summary
  messages.push(`- [${severity}] ${msg} — \`${file}:${line}\``);
}

// Compute average score
const totalScore = Math.round(
  Object.values(scores).reduce((sum, val) => sum + val, 0) / 5
);

// Build the comment body
const commentBody = [
  `SolidSaaS Scan Complete`,
  ``,
  `Estimated SOLID Score: ${totalScore}`,
  `SRP: ${scores.SRP}`,
  `OCP: ${scores.OCP}`,
  `LSP: ${scores.LSP}`,
  `ISP: ${scores.ISP}`,
  `DIP: ${scores.DIP}`,
  ``,
  `Top Findings:`,
  messages.length ? messages.slice(0, 5).join("\n") : "- No violations found.",
  ``,
  `Download report artifacts: ${artifactUrl}`
].join("\n");

// Send comment to GitHub PR
const payload = JSON.stringify({ body: commentBody });

const options = {
  hostname: "api.github.com",
  path: `/repos/${owner}/${repo}/issues/${prNumber}/comments`,
  method: "POST",
  headers: {
    Authorization: `Bearer ${githubToken}`,
    "User-Agent": "solid-saas-bot",
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payload)
  }
};

const req = https.request(options, (res) => {
  console.log(`GitHub API response: ${res.statusCode}`);
  res.on("data", d => process.stdout.write(d));
});

req.on("error", (error) => {
  console.error("Failed to post comment:", error);
});

req.write(payload);
req.end();
