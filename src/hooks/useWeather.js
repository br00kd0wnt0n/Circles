import { useState, useEffect, useCallback } from 'react';
import { fetchWeather, getCurrentPosition } from '../services/weatherApi';

/**
 * Hook to fetch and manage weather data
 */
export function useWeather() {
  const [weather, setWeather] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadWeather = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get user's location
      const coords = await getCurrentPosition();

      // Fetch weather for location
      const weatherData = await fetchWeather(coords.lat, coords.lon);
      setWeather(weatherData);
    } catch (err) {
      console.error('Failed to load weather:', err);
      setError(err.message);

      // Set fallback weather
      setWeather({
        temperature: 72,
        condition: 'sunny',
        friendlyDescription: 'beautiful and sunny',
        isMock: true
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWeather();

    // Refresh weather every 30 minutes
    const interval = setInterval(loadWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadWeather]);

  return {
    weather,
    isLoading,
    error,
    refresh: loadWeather
  };
}

export default useWeather;
