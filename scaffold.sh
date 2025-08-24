#!/bin/bash

# Create main folders
mkdir -p .github/workflows
mkdir -p .solid/extensions/semgrep
mkdir -p assets

# Create new .NET API project in correct location
dotnet new webapi -n demo-target.Api --no-https

# Move into the new project folder
cd demo-target.Api

# Clean up the weather demo files
rm -f Controllers/WeatherForecastController.cs WeatherForecast.cs

# Add intentional SOLID and security violation files
cat <<EOF > OrderService.cs
public class OrderService {
    public void PlaceOrder() {
        var db = new SqlConnection("Server=..."); // concrete dep
        db.Open();
        Console.WriteLine("Order placed.");       // SRP violation
    }

    public void SendConfirmationEmail() {
        Console.WriteLine("Email sent.");         // SRP violation
    }
}
EOF

cat <<EOF > IBigInterface.cs
public interface IBigInterface {
    void Save();
    void Load();
    void Print();
    void ExportToExcel();  // ISP violation
}
EOF

cat <<EOF > InsecureRepo.cs
using Microsoft.Data.SqlClient;

public class InsecureRepo {
    public void GetUser(string username) {
        var conn = new SqlConnection("Server=...;Database=...;Trusted_Connection=True;");
        conn.Open();
        var cmd = new SqlCommand("SELECT * FROM Users WHERE Name = '" + username + "'", conn); // 💥 injection
        var reader = cmd.ExecuteReader();
    }
}
EOF

# Replace Program.cs with clean boilerplate (no HTTPS)
cat <<EOF > Program.cs
var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.MapGet("/", () => "SolidSaaS Demo API");

app.Run();
EOF

cd ..

# Create placeholder GitHub Action
cat <<EOF > .github/workflows/solid-scan.yml
name: 🔍 Solid & Best Practices Scan

on:
  pull_request:
    branches: [ main ]
  workflow_dispatch:

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout
      uses: actions/checkout@v3
    - name: Pretend to Scan
      run: echo "✅ Scan complete. Found SOLID violations!"
EOF

# Create placeholder .solid config
cat <<EOF > .solid/solid.yml
privacy: metadata-only
fail_threshold: 70
EOF

# Sample custom rule (Semgrep)
cat <<EOF > .solid/extensions/semgrep/sample.yml
rules:
  - id: insecure-sql-query
    pattern: SqlCommand("SELECT * FROM Users WHERE Name = '+", ...)
    message: Avoid raw string concatenation in SQL queries
    severity: ERROR
EOF

# Create README scaffold
cat <<EOF > README.md
# 🛡️ SolidSaaS Demo

A recruiter‑friendly demo of **SolidSaaS** — my hybrid, closed‑core code quality & security scanner that evaluates **SOLID principles**, catches **vulnerabilities**, and outputs reports anyone can understand.
EOF
