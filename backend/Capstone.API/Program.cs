using Capstone.API.Infrastructure.Interfaces;
using Capstone.API.Infrastructure.Interfaces.Repositories;
using Capstone.API.Infrastructure.Repositories;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: true);

builder.Services.AddControllers();
builder.Services.AddOpenApi();

// CORS — allows any localhost origin during development.
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
        policy.SetIsOriginAllowed(origin => new Uri(origin).Host == "localhost")
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
