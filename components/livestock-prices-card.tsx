"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react"
import { fetchMLALivestockPrices, type MLALivestockPrice } from "@/lib/mla-api"

export function LivestockPricesCard() {
  const [prices, setPrices] = useState<MLALivestockPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadPrices() {
      try {
        setLoading(true)
        const data = await fetchMLALivestockPrices()
        setPrices(data)
        setError(null)
      } catch (err) {
        console.error("Failed to load livestock prices:", err)
        setError("Failed to load livestock prices")
      } finally {
        setLoading(false)
      }
    }

    loadPrices()
    // Refresh prices every 5 minutes
    const interval = setInterval(loadPrices, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="p-4">
      <CardHeader className="p-0 mb-3">
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          MLA Livestock Prices
        </CardTitle>
        <CardDescription>Live market indicators from Meat & Livestock Australia</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="h-[200px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="h-[200px] flex items-center justify-center">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {prices.map((price, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-primary/10 rounded-lg p-3 border border-primary/20 hover:bg-primary/15 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium text-foreground text-sm">{price.indicator}</p>
                  <p className="text-xs text-muted-foreground">{price.category}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-foreground">
                    {price.price.toFixed(2)} {price.unit}
                  </p>
                  {price.change !== undefined && (
                    <div
                      className={`flex items-center gap-1 text-xs ${
                        price.change >= 0 ? "text-primary" : "text-destructive"
                      }`}
                    >
                      {price.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      <span>
                        {price.change >= 0 ? "+" : ""}
                        {price.change.toFixed(2)} ({price.changePercent?.toFixed(2)}%)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground text-center">
                Data from MLA Statistics API • Updated {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
