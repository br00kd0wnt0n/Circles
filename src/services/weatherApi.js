/**
 * Weather API service
 * Uses OpenWeatherMap API (free tier)
 */

const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

let weatherCache = {
  data: null,
  timestamp: 0,
  coords: null
};

/**
 * Get weather condition category from OpenWeatherMap weather code
 */
function getWeatherCondition(weatherId, icon) {
  // Check if it's night (icon ends with 'n')
  const isNight = icon?.endsWith('n');

  // Weather condition codes: https://openweathermap.org/weather-conditions
  if (weatherId >= 200 && weatherId < 300) return 'stormy';
  if (weatherId >= 300 && weatherId < 400) return 'rainy';
  if (weatherId >= 500 && weatherId < 600) return 'rainy';
  if (weatherId >= 600 && weatherId < 700) return 'snowy';
  if (weatherId >= 700 && weatherId < 800) return 'cloudy'; // fog, mist, etc.
  if (weatherId === 800) return isNight ? 'clear-night' : 'sunny';
  if (weatherId > 800) return 'cloudy';

  return 'sunny';
}

/**
 * Get weather description for greeting
 */
function getWeatherDescription(condition, temp) {
  const descriptions = {
    'sunny': ['beautiful and sunny', 'a gorgeous sunny day', 'bright and sunny'],
    'clear-night': ['a clear night', 'a beautiful clear evening'],
    'cloudy': ['a bit cloudy', 'overcast but pleasant', 'cloudy'],
    'rainy': ['rainy', 'a rainy day', 'wet outside'],
    'stormy': ['stormy', 'thunderstorms expected', 'stormy weather'],
    'snowy': ['snowy', 'a snowy day', 'snow outside']
  };

  const options = descriptions[condition] || descriptions['sunny'];
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * Fetch weather data from OpenWeatherMap
 */
export async function fetchWeather(lat, lon) {
  // Check cache first
  const now = Date.now();
  if (
    weatherCache.data &&
    now - weatherCache.timestamp < CACHE_DURATION &&
    weatherCache.coords?.lat === lat &&
    weatherCache.coords?.lon === lon
  ) {
    return weatherCache.data;
  }

  // If no API key, return mock data
  if (!OPENWEATHER_API_KEY) {
    console.log('[DEV] No weather API key, using mock data');
    return getMockWeather();
  }

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${OPENWEATHER_API_KEY}`
    );

    if (!response.ok) {
      throw new Error('Weather API request failed');
    }

    const data = await response.json();

    const weather = {
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      condition: getWeatherCondition(data.weather[0].id, data.weather[0].icon),
      description: data.weather[0].description,
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed),
      city: data.name,
      icon: data.weather[0].icon,
      raw: data
    };

    // Add friendly description
    weather.friendlyDescription = getWeatherDescription(weather.condition, weather.temperature);

    // Update cache
    weatherCache = {
      data: weather,
      timestamp: now,
      coords: { lat, lon }
    };

    return weather;
  } catch (error) {
    console.error('Weather fetch error:', error);
    return getMockWeather();
  }
}

/**
 * Get user's current location
 */
export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        // Default to a location (e.g., NYC) if geolocation fails
        resolve({ lat: 40.7128, lon: -74.0060 });
      },
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
}

/**
 * Get mock weather data for development
 */
function getMockWeather() {
  const conditions = ['sunny', 'cloudy', 'rainy'];
  const condition = conditions[Math.floor(Math.random() * conditions.length)];
  const temp = Math.floor(Math.random() * 30) + 55; // 55-85°F

  return {
    temperature: temp,
    feelsLike: temp - 2,
    condition,
    description: condition,
    humidity: 50,
    windSpeed: 8,
    city: 'Your City',
    friendlyDescription: getWeatherDescription(condition, temp),
    isMock: true
  };
}

export default {
  fetchWeather,
  getCurrentPosition
};
