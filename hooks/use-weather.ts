"use client"

import { useState, useEffect } from "react"
import type { WeatherData, RainfallData } from "@/types/dashboard"
import { WEATHER_CODES, UNKNOWN_WEATHER } from "@/lib/constants/dashboard"

export function useWeather(latitude: number | null, longitude: number | null) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [weatherError, setWeatherError] = useState<string | null>(null)
  const [rainfallData, setRainfallData] = useState<RainfallData[]>([])
  const [rainfallLoading, setRainfallLoading] = useState(true)

  const getWeatherDescription = (code: number): string => {
    return WEATHER_CODES[code] || UNKNOWN_WEATHER
  }

  const fetchWeatherData = async (lat: number, lng: number) => {
    setWeatherLoading(true)
    setWeatherError(null)

    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=auto`,
      )

      if (!response.ok) {
        throw new Error("Failed to fetch weather data")
      }

      const data = await response.json()

      const weatherData: WeatherData = {
        temperature: Math.round(data.current.temperature_2m),
        humidity: data.current.relative_humidity_2m,
        windSpeed: Math.round(data.current.wind_speed_10m),
        weatherCode: data.current.weather_code,
        weatherDescription: getWeatherDescription(data.current.weather_code),
      }

      setWeather(weatherData)
    } catch (error) {
      console.error("[v0] Error fetching weather:", error)
      setWeatherError("Unable to load weather data")
    } finally {
      setWeatherLoading(false)
    }
  }

  const fetchRainfallData = async (lat: number, lng: number) => {
    try {
      setRainfallLoading(true)

      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=precipitation_sum&past_days=92&forecast_days=16&timezone=auto`,
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] API error response:", errorText)
        throw new Error(`Failed to fetch rainfall data: ${response.status}`)
      }

      const data = await response.json()

      const today = new Date().toISOString().split("T")[0]
      const processedData: RainfallData[] = data.daily.time.map((date: string, index: number) => ({
        date,
        rainfall: data.daily.precipitation_sum[index] || 0,
        type: date <= today ? "historical" : "forecast",
      }))

      setRainfallData(processedData)
      setRainfallLoading(false)
    } catch (error) {
      console.error("[v0] Error fetching rainfall data:", error)
      setRainfallLoading(false)
    }
  }

  useEffect(() => {
    if (latitude && longitude) {
      fetchWeatherData(latitude, longitude)
      fetchRainfallData(latitude, longitude)
    }
  }, [latitude, longitude])

  return {
    weather,
    weatherLoading,
    weatherError,
    rainfallData,
    rainfallLoading,
    refetchWeather: () => latitude && longitude && fetchWeatherData(latitude, longitude),
    refetchRainfall: () => latitude && longitude && fetchRainfallData(latitude, longitude),
  }
}

