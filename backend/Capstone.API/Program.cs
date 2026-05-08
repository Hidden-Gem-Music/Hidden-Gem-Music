using Capstone.API.Infrastructure.Interfaces;
using Capstone.API.Infrastructure.Interfaces.Repositories;
using Capstone.API.Infrastructure.Repositories;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: true);

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddMemoryCache();

// CORS:
// - Local/Development: allow Expo Go (exp://...) and LAN hosts used during mobile testing.
// - Other envs: keep explicit localhost web origin.
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontendDev", policy =>
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod());

    options.AddPolicy("AllowFrontend", policy =>
        policy.WithOrigins("http://localhost:8081")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

// Infrastructure — generic SP execution layer
builder.Services.AddSingleton<IDataRepositoryFactory, DataRepositoryFactory>();

// Domain repositories — one per screen area
builder.Services.AddScoped<IGlobeRepository, GlobeRepository>();
builder.Services.AddScoped<ICountryRepository, CountryRepository>();
builder.Services.AddScoped<IHiddenGemsRepository, HiddenGemsRepository>();
builder.Services.AddScoped<IComparisonRepository, ComparisonRepository>();
builder.Services.AddScoped<IDashboardRepository, DashboardRepository>();
builder.Services.AddScoped<IMetadataRepository, MetadataRepository>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
    app.MapOpenApi();

if (!app.Environment.IsDevelopment() && !app.Environment.IsEnvironment("Local"))
{
    app.UseHttpsRedirection();
}

var corsPolicy = app.Environment.IsDevelopment() || app.Environment.IsEnvironment("Local")
    ? "AllowFrontendDev"
    : "AllowFrontend";

app.UseCors(corsPolicy);
app.UseAuthorization();
app.MapControllers();
app.Run();
