- name: Comment PR with Scores
  uses: actions/github-script@v7
  with:
    script: |
      const fs = require("fs");
      const prNumber = context.payload.pull_request.number;
      const runId = context.runId;
      const repo = context.repo;
      const artifactUrl = `https://github.com/${repo.owner}/${repo.repo}/actions/runs/${runId}`;

      // Read and parse the Semgrep JSON report
      const report = JSON.parse(fs.readFileSync("semgrep-results.json", "utf-8"));
      
      // Sample scoring logic
      let score = 100;
      let srp = 100;
      let dip = 100;
      let findings = [];

      for (const result of report.results) {
        const msg = result.message.toLowerCase();
        if (msg.includes("srp")) srp -= 10;
        if (msg.includes("dip")) dip -= 10;
        if (result.severity === "ERROR") score -= 10;

        findings.push(`- [${result.severity}] ${result.message} — \`${result.path}:${result.start.line}\``);
      }

      const body = [
        `✅ **SolidSaaS Scan Complete**`,
        ``,
        `**Estimated SOLID Score:** ${score}`,
        `- SRP: ${srp}`,
        `- DIP: ${dip}`,
        ``,
        `**Top Findings:**`,
        ...findings.slice(0, 3),
        ``,
        `[📎 Download report artifact](${artifactUrl})`
      ].join("\n");

      github.rest.issues.createComment({
        issue_number: prNumber,
        owner: repo.owner,
        repo: repo.repo,
        body: body
      });
