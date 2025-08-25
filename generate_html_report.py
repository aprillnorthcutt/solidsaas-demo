import json
from pathlib import Path

# Load Semgrep results
input_file = "semgrep-results.json"
output_file = "semgrep-report.html"

with open(input_file, "r", encoding="utf-8") as f:
    data = json.load(f)

results = data.get("results", [])

# Start HTML
html = [
    "<html>",
    "<head>",
    "<meta charset='UTF-8'>",
    "<title>Semgrep Report</title>",
    "<style>",
    "body { font-family: Arial, sans-serif; margin: 2em; }",
    "h1 { color: #333; }",
    ".finding { margin-bottom: 1em; padding: 1em; border: 1px solid #ddd; border-radius: 5px; }",
    ".severity-ERROR { background: #ffe5e5; }",
    ".severity-WARNING { background: #fff8e5; }",
    ".severity-INFO { background: #e5f3ff; }",
    "</style>",
    "</head>",
    "<body>",
    "<h1>Semgrep Scan Results</h1>",
    f"<p><strong>Total Findings:</strong> {len(results)}</p>",
]

# Add each finding
for r in results:
    severity = r.get("extra", {}).get("severity", "INFO")
    html.append(f"<div class='finding severity-{severity}'>")
    html.append(f"<strong>{r['check_id']}</strong><br>")
    html.append(f"<em>{r['path']}:{r['start']['line']}</em><br>")
    html.append(f"<p>{r['extra'].get('message', '')}</p>")
    html.append("</div>")

# Close HTML
html += ["</body>", "</html>"]

# Write output
Path(output_file).write_text("\n".join(html), encoding="utf-8")
print(f"✅ Report written to: {output_file}")
