var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.MapGet("/", () => "SolidSaaS Demo API");

app.Run();
