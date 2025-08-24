import json
import jinja2
from markdownify import markdownify as md
from weasyprint import HTML

# Load scan results
with open("semgrep-results.json", "r") as f:
    data = json.load(f)

findings = data.get("results", [])

# Transform results
issues = []
for result in findings:
    issues.append({
        "severity": result.get("severity", "UNKNOWN"),
        "message": result.get("message", ""),
        "path": result.get("path", ""),
        "line": result.get("start", {}).get("line", 0),
        "rule_id": result.get("check_id", ""),
    })

# Template for HTML report
template_str = """
<!DOCTYPE html>
<html>
<head>
  <title>SolidSaaS Report</title>
  <style>
    body { font-family: sans-serif; margin: 2em; }
    h1 { color: #2c3e50; }
    .issue { border-bottom: 1px solid #ccc; margin-bottom: 1em; padding-bottom: 1em; }
    .severity-critical { color: red; font-weight: bold; }
    .severity-error { color: darkred; }
    .severity-warning { color: orange; }
    .severity-info { color: gray; }
  </style>
</head>
<body>
  <h1>🛡️ SolidSaaS Code Quality & Security Report</h1>
  <p>Total Issues: {{ issues|length }}</p>

  {% for issue in issues %}
    <div class="issue severity-{{ issue.severity|lower }}">
      <strong>[{{ issue.severity.upper() }}]</strong>
      <code>{{ issue.path }}:{{ issue.line }}</code><br>
      {{ issue.message }}<br>
      <small><em>Rule: {{ issue.rule_id }}</em></small>
    </div>
  {% endfor %}
</body>
</html>
"""

# Render HTML
template = jinja2.Template(template_str)
html = template.render(issues=issues)

# Write HTML file
with open("report.html", "w") as f:
    f.write(html)

# Also dump JSON version for convenience
with open("report.json", "w") as f:
    json.dump(issues, f, indent=2)

# Generate PDF version
HTML(string=html).write_pdf("report.pdf")
