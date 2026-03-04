# Free Weather APIs Comparison

## Quick Comparison Table

| API | Cost | Signup Required | Daily Limit | API Key Needed | Best For |
|-----|------|----------------|-------------|----------------|----------|
| **Open-Meteo** ⭐ | FREE | ❌ No | Unlimited* | ❌ No | Simple weather, UV index |
| **WeatherAPI.com** | FREE | ✅ Yes | ~33,000 | ✅ Yes | Detailed forecasts, easy to use |
| **OpenWeatherMap** | FREE | ✅ Yes | 1,000 | ✅ Yes | Popular, lots of features |
| **Tomorrow.io** | FREE | ✅ Yes | 500 | ✅ Yes | Minute-by-minute updates |
| **7Timer** | FREE | ❌ No | Unlimited | ❌ No | Simple JSON, basic data |

*Non-commercial use

---

## 1. Open-Meteo ⭐ (CURRENTLY CONFIGURED)

### Pros:
- ✅ **No signup required** - Works immediately
- ✅ **No API key needed** - Zero configuration
- ✅ **Unlimited requests** for non-commercial use
- ✅ **Open source** and community-driven
- ✅ **Fast and reliable**
- ✅ **Includes UV index**

### Cons:
- ⚠️ Less detailed than commercial APIs
- ⚠️ No air quality data

### Example URL:
```
https://api.open-meteo.com/v1/forecast?latitude=14.5995&longitude=120.9842&current=temperature_2m,weather_code,uv_index&timezone=Asia/Manila
```

### Data You Get:
- Temperature (°C)
- Weather code (0-99)
- UV index
- Timezone-aware timestamps

---

## 2. WeatherAPI.com (Good Alternative)

### Pros:
- ✅ **1 million calls/month** free tier (very generous!)
- ✅ **Easy to use** - Simple JSON responses
- ✅ **Real-time data** updated frequently
- ✅ **UV index included**
- ✅ **Air quality data** available
- ✅ **Astronomy data** (sunrise, sunset, moon phase)

### Cons:
- ⚠️ Requires signup (email verification)
- ⚠️ Needs API key in code

### Example URL:
```
https://api.weatherapi.com/v1/current.json?key=YOUR_KEY&q=Manila,Philippines&aqi=no
```

### Data You Get:
- Temperature (°C/°F)
- "Partly cloudy" text descriptions
- UV index
- Wind speed/direction
- Humidity, pressure, visibility

---

## 3. OpenWeatherMap (Most Popular)

### Pros:
- ✅ **1,000 calls/day** free tier
- ✅ **Very popular** - lots of documentation
- ✅ **Air quality data**
- ✅ **Forecasts** (5-day/3-hour)
- ✅ **Historical data** available

### Cons:
- ⚠️ Requires signup
- ⚠️ Needs API key
- ⚠️ UV index requires separate API call
- ⚠️ 1,000 calls/day = only ~42 calls/hour

### Example URL:
```
https://api.openweathermap.org/data/2.5/weather?q=Manila&appid=YOUR_KEY&units=metric
```

### Data You Get:
- Temperature (°C/°F)
- Weather description
- Wind, humidity, pressure
- Clouds percentage

---

## 4. Tomorrow.io (Advanced Features)

### Pros:
- ✅ **500 calls/day** free tier
- ✅ **Minute-by-minute forecasts**
- ✅ **Hyperlocal predictions**
- ✅ **Air quality data**
- ✅ **Pollen data**

### Cons:
- ⚠️ Requires signup + credit card (no charge on free tier)
- ⚠️ Lower daily limit (500 calls)
- ⚠️ More complex API

### Example URL:
```
https://api.tomorrow.io/v4/weather/realtime?location=14.5995,120.9842&apikey=YOUR_KEY
```

### Data You Get:
- Temperature (°C)
- Weather code
- UV index
- Precipitation probability
- Cloud cover

---

## 5. 7Timer (Ultra Simple)

### Pros:
- ✅ **No signup required**
- ✅ **No API key needed**
- ✅ **Unlimited requests**
- ✅ **Simple JSON format**

### Cons:
- ⚠️ **No UV index**
- ⚠️ Less accurate
- ⚠️ Basic data only
- ⚠️ Updates less frequently

### Example URL:
```
https://www.7timer.info/bin/api.pl?lon=120.9842&lat=14.5995&product=civil&output=json
```

---

## 🏆 Recommendation: Stick with Open-Meteo

For your ICAN Academy display, **Open-Meteo** is the best choice because:

1. ✅ **Zero configuration** - Already working!
2. ✅ **No maintenance** - No API keys to manage
3. ✅ **Reliable** - Open source with good uptime
4. ✅ **Has everything you need** - Temp, conditions, UV index
5. ✅ **Unlimited** - Won't hit rate limits

### When to Switch?

Only consider switching if you need:
- Air quality data → Use **WeatherAPI.com**
- More detailed forecasts → Use **WeatherAPI.com**
- Minute-by-minute updates → Use **Tomorrow.io**
- Historical data → Use **OpenWeatherMap**

---

## 📝 How to Switch APIs

If you want to try a different API, I can help you update the code. Just let me know which one!

**Current setup location**: `/Users/icanacademy/teacher-attendance-display/client/app.js` (lines 434-531)

---

**Last Updated**: October 31, 2025
