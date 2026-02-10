import { useEffect, useMemo, useState } from "react";

const WEATHER_CODES = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Rime fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Dense drizzle",
  56: "Freezing drizzle",
  57: "Freezing drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  66: "Freezing rain",
  67: "Freezing rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Rain showers",
  81: "Rain showers",
  82: "Violent rain showers",
  85: "Snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Thunderstorm with hail",
};

function formatStockholmTime(date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Stockholm",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "2-digit",
  }).format(date);
}

export default function App() {
  const [time, setTime] = useState(() => formatStockholmTime(new Date()));
  const [weather, setWeather] = useState({
    temp: null,
    feels: null,
    wind: null,
    code: null,
    updatedAt: null,
  });
  const [status, setStatus] = useState("Fetching data...");
  const [error, setError] = useState(null);

  const description = useMemo(() => {
    if (weather.code === null) return "";
    return WEATHER_CODES[weather.code] || "Unknown conditions";
  }, [weather.code]);

  useEffect(() => {
    const tick = () => setTime(formatStockholmTime(new Date()));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function fetchWeather() {
      try {
        setStatus("Fetching data...");
        setError(null);
        const url =
          "https://api.open-meteo.com/v1/forecast?latitude=59.3293&longitude=18.0686&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=Europe%2FStockholm";
        const response = await fetch(url);
        if (!response.ok) throw new Error("Weather request failed");
        const data = await response.json();
        const current = data.current;
        if (!current) throw new Error("Weather data unavailable");

        if (!isMounted) return;
        setWeather({
          temp: Math.round(current.temperature_2m),
          feels: Math.round(current.apparent_temperature),
          wind: Math.round(current.wind_speed_10m),
          code: current.weather_code,
          updatedAt: current.time,
        });
        setStatus("Live");
      } catch (err) {
        if (!isMounted) return;
        setError("Could not fetch live weather.");
        setStatus("Offline");
      }
    }

    fetchWeather();
    const interval = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="page">
      <main className="card">
        <header className="header">
          <div>
            <p className="eyebrow">Live Snapshot</p>
            <h1>Hi Max</h1>
          </div>
          <div className={`pill ${status === "Live" ? "ok" : "warn"}`}>
            {status}
          </div>
        </header>

        <section className="grid">
          <div className="panel">
            <p className="label">Time in Stockholm</p>
            <p className="value">{time}</p>
            <p className="muted">Timezone: Europe/Stockholm</p>
          </div>

          <div className="panel">
            <p className="label">Weather in Stockholm</p>
            {weather.temp === null ? (
              <p className="value">Loading...</p>
            ) : (
              <>
                <p className="value">
                  {weather.temp}&deg;C (feels like {weather.feels}&deg;C)
                </p>
                <p className="muted">
                  {description} &middot; Wind {weather.wind} km/h
                </p>
                <p className="muted">Last updated: {weather.updatedAt}</p>
              </>
            )}
            {error ? <p className="error">{error}</p> : null}
          </div>
        </section>
      </main>
    </div>
  );
}
