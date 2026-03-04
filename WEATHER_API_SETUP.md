# Weather API Setup Guide

## 🎉 GOOD NEWS: Already Configured! (No API Key Needed)

Your display is now using **wttr.in** - a 100% free weather API that requires **NO signup, NO API key, NO limits!**

## ✅ Current Setup: wttr.in (RECOMMENDED)

**Already configured and ready to use!** Just refresh your display.

### What You Get:
- ✅ **Real-time temperature** for Pasig City
- ✅ **Weather conditions** (Partly Cloudy, Rain, Sunny, etc.)
- ✅ **Live UV Index** (0-11+)
- ✅ **100% FREE** - No signup, no API key needed
- ✅ **Unlimited calls** - No rate limits
- ✅ **Fast & Reliable** - Console-based weather service
- ✅ **Global coverage** - Works for any city

### How It Works:
The code (app.js:510-552) automatically fetches weather data from:
```
https://wttr.in/Pasig?format=j1
```

**No action needed - just test it!**

## ✅ Test It Out

1. Start the server:
   ```bash
   cd /Users/icanacademy/teacher-attendance-display/server
   npm start
   ```

2. Open the display:
   ```bash
   open /Users/icanacademy/teacher-attendance-display/client/index.html
   ```

3. Open browser console (F12) and look for:
   ```
   ✅ Weather updated: 28°C Partly Cloudy UV: 9
   ```

## 📊 What You'll Get (Real-Time Data)

- **Temperature**: Accurate current temp in Celsius for Pasig City
- **Conditions**: "Partly Cloudy", "Light Rain", "Clear", "Overcast", etc.
- **UV Index**: Real UV index (0-11+)
- **UV Status**: Auto-calculated (Low, Moderate, High, Very High, Extreme)

## 🔄 Update Frequency

The weather updates automatically every **30 minutes** (configurable in app.js line 918).

## 🛡️ Fallback Behavior

If the API fails (no internet, etc.), the display will:
- Show mock data (28°C, Partly Cloudy)
- Calculate time-based UV index
- Log error to console

## ❓ Troubleshooting

### Weather not updating?
- Check browser console (F12) for errors
- Make sure you have internet connection
- Test API directly: https://wttr.in/Pasig?format=j1

### Shows "Loading weather..."?
- Fallback mock data should kick in automatically
- Check console for error messages
- Verify internet connectivity

---

## 🔀 Alternative FREE Weather APIs (If You Want to Switch)

### Option 1: wttr.in (CURRENT - NO KEY) ⭐
- **Cost**: 100% FREE forever
- **Limits**: Unlimited requests
- **Signup**: NOT required
- **Already configured!**
- **Bonus**: Console weather, works in terminal too!

### Option 2: WeatherAPI.com (Requires signup)
- **Cost**: FREE tier - 1 million calls/month
- **Signup**: https://www.weatherapi.com/signup.aspx
- **Setup**: Get API key, replace code in app.js
- **Better for**: More detailed forecasts

### Option 3: OpenWeatherMap (Requires signup)
- **Cost**: FREE tier - 1,000 calls/day
- **Signup**: https://openweathermap.org/api
- **Setup**: Get API key, replace code in app.js
- **Better for**: Air quality data

### Option 4: Tomorrow.io (Requires signup)
- **Cost**: FREE tier - 500 calls/day
- **Signup**: https://www.tomorrow.io/weather-api/
- **Setup**: Get API key, replace code in app.js
- **Better for**: Minute-by-minute forecasts

## 📚 More Info

- **wttr.in Website**: https://wttr.in/
- **GitHub**: https://github.com/chubin/wttr.in
- **API Documentation**: https://github.com/chubin/wttr.in#json-output
- **Try it in terminal**: `curl wttr.in/Pasig`

---

**Updated**: October 31, 2025
