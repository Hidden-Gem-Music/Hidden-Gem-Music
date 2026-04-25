using Capstone.API.Infrastructure.Interfaces;
using Capstone.API.Infrastructure.Interfaces.Repositories;
using Capstone.API.Infrastructure.Repositories;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();

// CORS — required for the React Native / Expo web frontend (default port 8081).
// If the frontend dev port changes, update WithOrigins here and notify the team.
builder.Services.AddCors(options =>
{
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

var app = builder.Build();

if (app.Environment.IsDevelopment())
    app.MapOpenApi();

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");
app.UseAuthorization();
app.MapControllers();
app.Run();
