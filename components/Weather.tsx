"use client";

import { useState, useEffect } from "react";
import { Cloud, Sun, CloudRain, CloudSnow, Wind, Droplets } from "lucide-react";

interface WeatherData {
  city: string;
  temp: number;
  feels_like: number;
  desc: string;
  humidity: number;
  wind: number;
  code: number;
}

function WeatherIcon({ code, size = 5 }: { code: number; size?: number }) {
  const cls = `w-${size} h-${size}`;
  if (code >= 200 && code < 300) return <CloudRain className={cls} />;
  if (code >= 300 && code < 600) return <CloudRain className={cls} />;
  if (code >= 600 && code < 700) return <CloudSnow className={cls} />;
  if (code >= 700 && code < 800) return <Wind className={cls} />;
  if (code === 800) return <Sun className={cls} />;
  return <Cloud className={cls} />;
}

export default function Weather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = sessionStorage.getItem("keda_weather");
    if (cached) {
      setWeather(JSON.parse(cached));
      setLoading(false);
      return;
    }

    const fetchWeather = async (lat: number, lon: number) => {
      try {
        // Koordinattan şehir adı al (reverse geocoding - ücretsiz)
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=tr`
        );
        const geo = await geoRes.json();
        const city =
          geo.address?.city ||
          geo.address?.town ||
          geo.address?.village ||
          geo.address?.county ||
          "Konum";

        // Hava durumu
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m&timezone=auto`
        );
        const wData = await weatherRes.json();
        const cur = wData.current;

        const result: WeatherData = {
          city,
          temp: Math.round(cur.temperature_2m),
          feels_like: Math.round(cur.apparent_temperature),
          desc: getDesc(cur.weather_code),
          humidity: cur.relative_humidity_2m,
          wind: Math.round(cur.wind_speed_10m),
          code: cur.weather_code,
        };

        sessionStorage.setItem("keda_weather", JSON.stringify(result));
        setWeather(result);
      } catch {
        // sessizce başarısız ol
      } finally {
        setLoading(false);
      }
    };

    // Tarayıcı Geolocation API - en doğru konum
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        async () => {
          // İzin reddedilirse IP fallback
          try {
            const geoRes = await fetch("https://ipapi.co/json/");
            const geo = await geoRes.json();
            await fetchWeather(geo.latitude, geo.longitude);
          } catch {
            setLoading(false);
          }
        },
        { timeout: 5000 }
      );
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) return (
    <div className="flex items-center gap-2 px-3 py-2 glass rounded-xl border border-white/5 animate-pulse">
      <div className="w-4 h-4 bg-slate-700 rounded" />
      <div className="w-16 h-3 bg-slate-700 rounded" />
    </div>
  );

  if (!weather) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-2 glass rounded-xl border border-white/5 text-slate-400 text-xs" title={`${weather.desc} · Hissedilen ${weather.feels_like}°C · Nem %${weather.humidity} · Rüzgar ${weather.wind} km/s`}>
      <WeatherIcon code={weather.code} size={4} />
      <span className="text-white font-medium">{weather.temp}°</span>
      <span className="text-slate-500 hidden sm:inline">{weather.city}</span>
    </div>
  );
}

function getDesc(code: number): string {
  if (code === 0) return "Açık";
  if (code <= 2) return "Az bulutlu";
  if (code === 3) return "Bulutlu";
  if (code <= 49) return "Sisli";
  if (code <= 59) return "Çiseleyen";
  if (code <= 69) return "Yağmurlu";
  if (code <= 79) return "Karlı";
  if (code <= 82) return "Sağanak";
  if (code <= 99) return "Fırtınalı";
  return "Değişken";
}
