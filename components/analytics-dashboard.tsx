"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Calendar, TrendingUp, Package, ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react"
import type { Order } from "./order-dashboard"

interface MonthlyStats {
  totalOrders: number
  completedOrders: number
  activeOrders: number
  totalCookies: number
  totalFigures: number
  totalSets: number
  totalToppers: number
  totalPrints: number
  totalOther: number
  lianikiOrders: number
  chondrikiOrders: number
  statusBreakdown: {
    pending: number
    proforma_sent: number
    payment: number
    shipped: number
    shipped_unpaid: number
  }
}

interface AnalyticsDashboardProps {
  orders: Order[]
}

export function AnalyticsDashboard({ orders }: AnalyticsDashboardProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>("")
  const [selectedYear, setSelectedYear] = useState<string>("")
  const [stats, setStats] = useState<MonthlyStats>({
    totalOrders: 0,
    completedOrders: 0,
    activeOrders: 0,
    totalCookies: 0,
    totalFigures: 0,
    totalSets: 0,
    totalToppers: 0,
    totalPrints: 0,
    totalOther: 0,
    lianikiOrders: 0,
    chondrikiOrders: 0,
    statusBreakdown: {
      pending: 0,
      proforma_sent: 0,
      payment: 0,
      shipped: 0,
      shipped_unpaid: 0,
    }
  })

  // Build a continuous month range from earliest to latest order
  const buildMonthRange = () => {
    if (!orders || orders.length === 0) return [] as Array<{ year: string; month: string }>
    const dates = orders.map(o => new Date(o.createdAt)).filter(d => !isNaN(d.getTime()))
    if (dates.length === 0) return []
    const min = new Date(Math.min(...dates.map(d => d.getTime())))
    const max = new Date(Math.max(...dates.map(d => d.getTime())))
    // Normalize to first of month for both boundaries
    const start = new Date(min.getFullYear(), min.getMonth(), 1)
    const end = new Date(max.getFullYear(), max.getMonth(), 1)
    const range: Array<{ year: string; month: string }> = []
    for (let d = new Date(end); d >= start; d = new Date(d.getFullYear(), d.getMonth() - 1, 1)) {
      range.push({
        year: d.getFullYear().toString(),
        month: (d.getMonth() + 1).toString().padStart(2, '0'),
      })
    }
    return range
  }

  const monthRange = buildMonthRange()
  
  // Initialize with current month/year if available
  useEffect(() => {
    if (!selectedYear || !selectedMonth) {
      const today = new Date()
      const ty = today.getFullYear().toString()
      const tm = (today.getMonth() + 1).toString().padStart(2, '0')
      // Prefer current month if within range, else pick latest from range
      const hasCurrent = monthRange.some(m => m.year === ty && m.month === tm)
      if (hasCurrent) {
        setSelectedYear(ty)
        setSelectedMonth(tm)
      } else if (monthRange.length > 0) {
        setSelectedYear(monthRange[0].year)
        setSelectedMonth(monthRange[0].month)
      }
    }
  }, [selectedYear, selectedMonth, monthRange])

  // Calculate statistics when month/year changes
  useEffect(() => {
    if (!selectedMonth || !selectedYear) return

    const filteredOrders = orders.filter(order => {
      const date = new Date(order.createdAt)
      const orderYear = date.getFullYear().toString()
      const orderMonth = (date.getMonth() + 1).toString().padStart(2, '0')
      return orderYear === selectedYear && orderMonth === selectedMonth
    })

    const newStats: MonthlyStats = {
      totalOrders: filteredOrders.length,
      completedOrders: filteredOrders.filter(o => o.completed).length,
      activeOrders: filteredOrders.filter(o => !o.completed).length,
      totalCookies: 0,
      totalFigures: 0,
      totalSets: 0,
      totalToppers: 0,
      totalPrints: 0,
      totalOther: 0,
      lianikiOrders: filteredOrders.filter(o => o.customerType === 'λιανική').length,
      chondrikiOrders: filteredOrders.filter(o => o.customerType === 'χονδρική').length,
      statusBreakdown: {
        pending: filteredOrders.filter(o => o.status === 'pending').length,
        proforma_sent: filteredOrders.filter(o => o.status === 'proforma_sent').length,
        payment: filteredOrders.filter(o => o.status === 'payment').length,
        shipped: filteredOrders.filter(o => o.status === 'shipped').length,
        shipped_unpaid: filteredOrders.filter(o => o.status === 'shipped_unpaid').length,
      }
    }

    // Sum up all product quantities
    filteredOrders.forEach(order => {
      newStats.totalCookies += order.productDetails.cookies.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
      newStats.totalFigures += order.productDetails.figures.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
      newStats.totalSets += order.productDetails.sets.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
      newStats.totalToppers += order.productDetails.toppers.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
      newStats.totalPrints += order.productDetails.prints.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
      newStats.totalOther += order.productDetails.other.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
    })

    setStats(newStats)
  }, [selectedMonth, selectedYear, orders])

  const getMonthName = (month: string) => {
    const months = [
      'Ιανουάριος', 'Φεβρουάριος', 'Μάρτιος', 'Απρίλιος', 'Μάιος', 'Ιούνιος',
      'Ιούλιος', 'Αύγουστος', 'Σεπτέμβριος', 'Οκτώβριος', 'Νοέμβριος', 'Δεκέμβριος'
    ]
    return months[parseInt(month) - 1] || month
  }

  const getStatusText = (status: string) => ({
    pending: 'Εκκρεμής',
    proforma_sent: 'Αποστ. Προτιμολογίου',
    payment: 'Πληρωμή',
    shipped: 'Αποστολή',
    shipped_unpaid: 'Αποστολή χωρίς εξόφληση',
  }[status] || status)

  // Navigation helpers for month stepping
  const currentIndex = monthRange.findIndex(m => m.year === selectedYear && m.month === selectedMonth)
  const canPrev = currentIndex >= 0 && currentIndex < monthRange.length - 1
  const canNext = currentIndex > 0
  const stepMonth = (dir: -1 | 1) => {
    if (currentIndex === -1) return
    const nextIndex = currentIndex - dir // monthRange is descending; dir 1 => previous chronologically
    if (nextIndex >= 0 && nextIndex < monthRange.length) {
      setSelectedYear(monthRange[nextIndex].year)
      setSelectedMonth(monthRange[nextIndex].month)
    }
  }

  return (
    <div className="space-y-6">
      {/* Month/Year Selector (beautified) */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Επιλογή Περιόδου
            </CardTitle>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={`inline-flex items-center justify-center h-9 w-9 rounded-md border bg-background ${canPrev ? 'hover:bg-accent hover:text-accent-foreground' : 'opacity-50 cursor-not-allowed'}`}
                onClick={() => stepMonth(1)}
                disabled={!canPrev}
                aria-label="Προηγούμενος μήνας"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                className={`inline-flex items-center justify-center h-9 w-9 rounded-md border bg-background ${canNext ? 'hover:bg-accent hover:text-accent-foreground' : 'opacity-50 cursor-not-allowed'}`}
                onClick={() => stepMonth(-1)}
                disabled={!canNext}
                aria-label="Επόμενος μήνας"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Περίοδος</label>
              <Select
                value={selectedYear && selectedMonth ? `${selectedYear}-${selectedMonth}` : ""}
                onValueChange={(val) => {
                  const [y, m] = val.split('-')
                  setSelectedYear(y)
                  setSelectedMonth(m)
                }}
              >
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="Επιλέξτε μήνα" />
                </SelectTrigger>
                <SelectContent>
                  {monthRange.map(({ year, month }) => (
                    <SelectItem key={`${year}-${month}`} value={`${year}-${month}`}>
                      {getMonthName(month)} {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-center md:text-right">
              {selectedMonth && selectedYear && (
                <Badge variant="outline" className="text-base py-2 px-3">
                  {getMonthName(selectedMonth)} {selectedYear}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Σύνολο Παραγγελιών</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ενεργές Παραγγελίες</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <div className="text-2xl font-bold text-blue-600">{stats.activeOrders}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ολοκληρωμένες</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-green-500" />
              <div className="text-2xl font-bold text-green-600">{stats.completedOrders}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ποσοστό Ολοκλήρωσης</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats.totalOrders > 0 ? Math.round((stats.completedOrders / stats.totalOrders) * 100) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Στατιστικά Προϊόντων</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
              <div className="text-sm text-muted-foreground mb-1">Μπισκότα</div>
              <div className="text-3xl font-bold text-primary">{stats.totalCookies}</div>
              <div className="text-xs text-muted-foreground mt-1">τεμάχια</div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="text-sm text-muted-foreground mb-1">Φιγούρες</div>
              <div className="text-3xl font-bold text-blue-600">{stats.totalFigures}</div>
              <div className="text-xs text-muted-foreground mt-1">τεμάχια</div>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
              <div className="text-sm text-muted-foreground mb-1">Σετάκια</div>
              <div className="text-3xl font-bold text-purple-600">{stats.totalSets}</div>
              <div className="text-xs text-muted-foreground mt-1">τεμάχια</div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
              <div className="text-sm text-muted-foreground mb-1">Τόπερς</div>
              <div className="text-3xl font-bold text-green-600">{stats.totalToppers}</div>
              <div className="text-xs text-muted-foreground mt-1">τεμάχια</div>
            </div>

            <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
              <div className="text-sm text-muted-foreground mb-1">Εκτυπώσεις</div>
              <div className="text-3xl font-bold text-orange-600">{stats.totalPrints}</div>
              <div className="text-xs text-muted-foreground mt-1">τεμάχια</div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-sm text-muted-foreground mb-1">Άλλα</div>
              <div className="text-3xl font-bold text-gray-600">{stats.totalOther}</div>
              <div className="text-xs text-muted-foreground mt-1">τεμάχια</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Type Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Κατανομή Πελατών</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="font-medium">Λιανική</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-blue-600">{stats.lianikiOrders}</span>
                  <Badge variant="secondary">
                    {stats.totalOrders > 0 ? Math.round((stats.lianikiOrders / stats.totalOrders) * 100) : 0}%
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <span className="font-medium">Χονδρική</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-purple-600">{stats.chondrikiOrders}</span>
                  <Badge variant="secondary">
                    {stats.totalOrders > 0 ? Math.round((stats.chondrikiOrders / stats.totalOrders) * 100) : 0}%
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Κατάσταση Παραγγελιών</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.statusBreakdown).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-sm">{getStatusText(status)}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{count}</span>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all" 
                        style={{ width: `${stats.totalOrders > 0 ? (count / stats.totalOrders) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
