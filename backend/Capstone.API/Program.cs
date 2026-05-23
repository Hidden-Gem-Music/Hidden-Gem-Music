using System.Net;
using Capstone.API.Infrastructure.Interfaces;
using Capstone.API.Infrastructure.Interfaces.Repositories;
using Capstone.API.Infrastructure.Repositories;
using Microsoft.AspNetCore.HttpOverrides;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: true);

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddMemoryCache();
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownProxies.Add(IPAddress.Loopback);
    options.KnownProxies.Add(IPAddress.IPv6Loopback);
});
builder.Services.AddHttpClient("DeezerApi", client =>
{
    client.BaseAddress = new Uri("https://api.deezer.com/");
});

// CORS:
// - Local/Development: allow Expo Go (exp://...) and LAN hosts used during mobile testing.
// - Other envs: allow only the deployed Cloudflare Pages frontend and localhost web fallback.
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontendDev", policy =>
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod());

    options.AddPolicy("AllowFrontend", policy =>
        policy.WithOrigins(
                  "http://localhost:8081",
                  "https://hiddengemmusicapp.mp3li.online")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

// Infrastructure — generic SP execution layer
builder.Services.AddSingleton<IDataRepositoryFactory, DataRepositoryFactory>();
builder.Services.AddSingleton<IDeezerSongEnrichmentService, DeezerSongEnrichmentService>();
builder.Services.AddSingleton<ILanguageLookupService, FileBackedLanguageLookupService>();
builder.Services.AddSingleton<IDiscoverySampleCacheService, FileBackedDiscoverySampleCacheService>();
builder.Services.AddSingleton<IPresentationDataCacheService, FileBackedPresentationDataCacheService>();

// Domain repositories — one per screen area
builder.Services.AddScoped<IGlobeRepository, GlobeRepository>();
builder.Services.AddScoped<ICountryRepository, CountryRepository>();
builder.Services.AddScoped<IHiddenGemsRepository, HiddenGemsRepository>();
builder.Services.AddScoped<IComparisonRepository, ComparisonRepository>();
builder.Services.AddScoped<IDashboardRepository, DashboardRepository>();
builder.Services.AddScoped<IMetadataRepository, MetadataRepository>();

var app = builder.Build();

app.UseForwardedHeaders();

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
