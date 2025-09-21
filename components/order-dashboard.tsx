"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { supabase } from "@/lib/supabase-client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { OrderForm } from "./order-form"
import { OrderDetailsModal } from "./order-details-modal"
import { Search, Plus, Filter, Printer } from "lucide-react"

interface ProductItem { id: string; type: string; quantity: number }
export interface Order {
  id: string
  orderNumber?: number // Human-friendly incremental number
  afm: string
  customerName: string
  phone: string
  orderFor?: string
  remarks?: string
  communicationMethod?: string
  communicationValue?: string
  products: { cookies: boolean; figures: boolean; sets: boolean; toppers: boolean; prints: boolean; other: boolean }
  productDetails: { cookies: ProductItem[]; figures: ProductItem[]; sets: ProductItem[]; toppers: ProductItem[]; prints: ProductItem[]; other: ProductItem[] }
  discount: string
  createdAt: Date
  // New status flow
  // pending -> proforma_sent -> payment -> shipped (or shipped_unpaid)
  status: "pending" | "proforma_sent" | "payment" | "shipped" | "shipped_unpaid"
}

// Map DB row -> Order interface
function mapRow(row: any): Order {
  const pd = row.product_details || {}
  const normalize = (arr: any[]): ProductItem[] => Array.isArray(arr)
    ? arr.map(it => ({
        id: String(it.id || Date.now() + Math.random()),
        type: String(it.type || ''),
        quantity: Number(it.quantity) || 0,
      }))
    : []
  return {
    id: row.id,
    orderNumber: row.order_number ?? undefined,
    afm: row.afm || "",
    customerName: row.customer_name || "",
    phone: row.phone || "",
    orderFor: row.order_for || undefined,
    products: {
      cookies: !!row.has_cookies,
      figures: !!row.has_figures,
      sets: !!row.has_sets,
      toppers: !!row.has_toppers,
      prints: !!row.has_prints,
      other: !!row.has_other,
    },
    productDetails: {
      cookies: normalize(pd.cookies || []),
      figures: normalize(pd.figures || []),
      sets: normalize(pd.sets || []),
      toppers: normalize(pd.toppers || []),
      prints: normalize(pd.prints || []),
      other: normalize(pd.other || []),
    },
    discount: row.discount || 'none',
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    remarks: row.remarks || undefined,
    communicationMethod: row.communication_method || undefined,
    communicationValue: row.communication_value || undefined,
    // Fallback mapping for legacy statuses
    // 'completed' -> 'shipped'; 'cancelled' -> keep 'pending' (or could map to a removed state)
    status: ((): Order['status'] => {
      const raw = row.status
      if (!raw) return 'pending'
      if (['pending','proforma_sent','payment','shipped','shipped_unpaid'].includes(raw)) return raw
      if (raw === 'completed') return 'shipped'
      return 'pending'
    })(),
  }
}

export function OrderDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showNewOrderForm, setShowNewOrderForm] = useState(false)
  // Holds the order currently being edited (opens edit dialog when not null)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    setOrders((data || []).map(mapRow))
    setLoading(false)
  }, [])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const filteredOrders = orders.filter((order) => {
    const q = searchTerm.toLowerCase()
    const matchesSearch =
      order.customerName.toLowerCase().includes(q) ||
      order.afm.includes(searchTerm) ||
      order.phone.includes(searchTerm)
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getProductsList = (products: Order['products'], productDetails: Order['productDetails']) => {
    const productNames: Record<string,string> = { cookies: 'Μπισκότα', figures: 'Φιγούρα', sets: 'Σετάκια', toppers: 'Τόπερς', prints: 'Εκτυπώσεις', other: 'Άλλο' }
    return Object.entries(products)
      .filter(([, selected]) => selected)
      .map(([key]) => {
        const items = productDetails[key as keyof typeof productDetails]
        const total = items.reduce((s, i) => s + (Number(i.quantity) || 0), 0)
        return `${productNames[key]} (${total})`
      })
      .join(', ')
  }
  const getTotalCookies = (pd: Order['productDetails']) => pd.cookies.reduce((t,i)=> t + (Number(i.quantity) || 0), 0)

  const getStatusColor = (status: Order['status']) => ({
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    proforma_sent: 'bg-blue-100 text-blue-800 border-blue-200',
    payment: 'bg-purple-100 text-purple-800 border-purple-200',
    shipped: 'bg-green-100 text-green-800 border-green-200',
    shipped_unpaid: 'bg-red-100 text-red-800 border-red-200',
  }[status] || 'bg-gray-100 text-gray-800 border-gray-200')

  const getStatusText = (status: Order['status']) => ({
    pending: 'Εκκρεμής',
    proforma_sent: 'Αποστ. Προτιμολογίου',
    payment: 'Πληρωμή',
    shipped: 'Αποστολή',
    shipped_unpaid: 'Αποστολή χωρίς εξόφληση',
  }[status] || status)

  const handlePrintOrder = (order: Order) => {
    const getDetailedProductsList = () => {
      return Object.entries(order.products).map(([key, selected]) => {
        if (!selected) return ''
        const items = order.productDetails[key as keyof typeof order.productDetails]
        if (!items.length) return ''
        const categoryName: Record<string,string> = { cookies:'Μπισκότα', figures:'Φιγούρα', sets:'Σετάκια', toppers:'Τόπερς', prints:'Εκτυπώσεις', other:'Άλλο' }
        return `<h3>${categoryName[key]}:</h3><ul>` + items.map(i=>`<li>${i.type} - ${i.quantity} τεμάχια</li>`).join('') + '</ul>'
      }).join('')
    }
    const totalCookies = getTotalCookies(order.productDetails)
    const humanId = order.orderNumber ?? order.id
    const printContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h1 style="text-align: center; color: #d47f98;">Παραγγελία #${humanId}</h1>
        <hr style="margin: 20px 0;">
        <h2>Στοιχεία Πελάτη:</h2>
        <p><strong>Όνομα:</strong> ${order.customerName}</p>
        <p><strong>ΑΦΜ:</strong> ${order.afm}</p>
        <p><strong>Τηλέφωνο:</strong> ${order.phone}</p>
        ${order.orderFor ? `<p><strong>Ημερομηνία Παράδοσης:</strong> ${new Date(order.orderFor).toLocaleDateString('el-GR')}</p>` : ''}
        ${order.remarks ? `<p><strong>Παρατηρήσεις:</strong> ${order.remarks}</p>` : ''}
        ${(order.communicationMethod && order.communicationValue) ? `<p><strong>Επικοινωνία:</strong> ${order.communicationMethod} - ${order.communicationValue}</p>` : ''}
        <h2>Προϊόντα:</h2>
        ${getDetailedProductsList()}
        ${totalCookies > 0 ? `<h2>Συνολικά Μπισκότα:</h2><p style="font-size: 18px; font-weight: bold; color: #d47f98;">${totalCookies} τεμάχια</p>` : ''}
        <h2>Έκπτωση:</h2>
        <p>${order.discount === 'none' ? 'Χωρίς έκπτωση' : order.discount + '%'}</p>
        <h2>Ημερομηνία:</h2>
        <p>${order.createdAt.toLocaleDateString('el-GR')}</p>
        <h2>Κατάσταση:</h2>
        <p>${getStatusText(order.status)}</p>
      </div>
    `
    const win = window.open('', '_blank')
    if (win) { win.document.write(printContent); win.document.close(); win.print() }
  }

  const addNewOrder = async (orderData: any) => {
    // Normalize productDetails quantities to numbers before persisting
    const normalizePD = (pd: any) => {
      const out: any = {}
      Object.keys(pd).forEach(k => {
        out[k] = (pd[k] || []).map((it: any) => ({
          id: it.id,
          type: it.type,
          quantity: Number(it.quantity) || 0,
        }))
      })
      return out
    }
    const productDetails = normalizePD(orderData.productDetails)
    const products = orderData.products
    const insertPayload = {
      afm: orderData.afm || null,
      customer_name: orderData.customerName || null,
      phone: orderData.phone || null,
      order_for: orderData.orderFor || null,
  // initial status always 'pending' in new flow
  status: 'pending',
      discount: orderData.discount || 'none',
      has_cookies: products.cookies,
      has_figures: products.figures,
      has_sets: products.sets,
      has_toppers: products.toppers,
      has_prints: products.prints,
      has_other: products.other,
      product_details: productDetails,
      remarks: orderData.remarks || null,
      communication_method: orderData.communicationMethod || null,
      communication_value: orderData.communicationValue || null,
    }
    const { data, error } = await supabase.from('orders').insert(insertPayload).select('*').single()
    if (error) { alert('Σφάλμα καταχώρησης: ' + error.message); return }
    setOrders(prev => [mapRow(data), ...prev])
    setShowNewOrderForm(false)
  }

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId)
    if (error) { alert('Σφάλμα ενημέρωσης: ' + error.message); return }
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
    if (selectedOrder?.id === orderId) setSelectedOrder(s => s ? { ...s, status: newStatus } : s)
  }

  // Update existing order (called from OrderForm in edit mode)
  const handleUpdateOrder = async (updated: any, orderId?: string) => {
    if (!orderId) return
    const normalizePD = (pd: any) => {
      const out: any = {}
      Object.keys(pd).forEach(k => {
        out[k] = (pd[k] || []).map((it: any) => ({
          id: it.id,
          type: it.type,
          quantity: Number(it.quantity) || 0,
        }))
      })
      return out
    }
    const productDetails = normalizePD(updated.productDetails)
    const products = updated.products
    const updatePayload = {
      afm: updated.afm || null,
      customer_name: updated.customerName || null,
      phone: updated.phone || null,
      order_for: updated.orderFor || null,
      discount: updated.discount || 'none',
      has_cookies: products.cookies,
      has_figures: products.figures,
      has_sets: products.sets,
      has_toppers: products.toppers,
      has_prints: products.prints,
      has_other: products.other,
      product_details: productDetails,
      remarks: updated.remarks || null,
      communication_method: updated.communicationMethod || null,
      communication_value: updated.communicationValue || null,
    }
    const { data, error } = await supabase.from('orders').update(updatePayload).eq('id', orderId).select('*').single()
    if (error) { alert('Σφάλμα ενημέρωσης: ' + error.message); return }
    const mapped = mapRow(data)
    setOrders(prev => prev.map(o => o.id === orderId ? mapped : o))
    setEditingOrder(null)
    // If the order details modal is currently open for this order, update it too
    setSelectedOrder(prev => prev && prev.id === orderId ? mapped : prev)
  }

  const handleDeleteOrder = async (orderId: string) => {
    const { error } = await supabase.from('orders').delete().eq('id', orderId)
    if (error) { alert('Σφάλμα διαγραφής: ' + error.message); return }
    setOrders(prev => prev.filter(o => o.id !== orderId))
    setSelectedOrder(null)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 w-fit">
          <Image src="/logo.png" alt="Εταιρικό Λογότυπο" width={140} height={140} className="object-contain" priority />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Διαχείριση Παραγγελιών</h1>
        <p className="text-muted-foreground">Διαχειριστείτε όλες τις παραγγελίες σας από ένα μέρος</p>
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input placeholder="Αναζήτηση παραγγελιών..." value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} className="pl-10" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Όλες οι καταστάσεις</SelectItem>
              <SelectItem value="pending">Εκκρεμής</SelectItem>
              <SelectItem value="proforma_sent">Αποστ. Προτιμολογίου</SelectItem>
              <SelectItem value="payment">Πληρωμή</SelectItem>
              <SelectItem value="shipped">Αποστολή</SelectItem>
              <SelectItem value="shipped_unpaid">Αποστολή χωρίς εξόφληση</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Dialog open={showNewOrderForm} onOpenChange={setShowNewOrderForm}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Νέα Παραγγελία
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Νέα Παραγγελία</DialogTitle></DialogHeader>
            <OrderForm onSubmit={addNewOrder} />
          </DialogContent>
        </Dialog>
        {editingOrder && (
          <Dialog open={!!editingOrder} onOpenChange={(open) => { if (!open) setEditingOrder(null) }}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Επεξεργασία Παραγγελίας #{editingOrder.orderNumber ?? editingOrder.id}</DialogTitle></DialogHeader>
              <OrderForm
                mode="edit"
                initialData={{
                  id: editingOrder.id,
                  afm: editingOrder.afm,
                  customerName: editingOrder.customerName,
                  phone: editingOrder.phone,
                  orderFor: editingOrder.orderFor || undefined,
                  remarks: editingOrder.remarks || undefined,
                  communicationMethod: editingOrder.communicationMethod || undefined,
                  communicationValue: editingOrder.communicationValue || undefined,
                  discount: editingOrder.discount,
                  products: editingOrder.products,
                  productDetails: editingOrder.productDetails,
                }}
                onSubmit={handleUpdateOrder}
                onCancel={() => setEditingOrder(null)}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* State handling */}
      {loading && <p className="text-sm text-muted-foreground py-8 text-center">Φόρτωση...</p>}
      {error && !loading && <p className="text-sm text-red-600 py-4 text-center">Σφάλμα: {error}</p>}

      {/* Orders List */}
      {!loading && !error && (
        <div className="grid gap-4">
          {filteredOrders.length === 0 ? (
            <Card><CardContent className="text-center py-12"><p className="text-muted-foreground">Δεν βρέθηκαν παραγγελίες</p></CardContent></Card>
          ) : (
            filteredOrders.map(order => (
              <Card key={order.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1" onClick={() => setSelectedOrder(order)}>
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="font-semibold text-lg">#{order.orderNumber ?? order.id}</h3>
                        <Badge className={getStatusColor(order.status)}>{getStatusText(order.status)}</Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="font-medium">{order.customerName}</p>
                          <p className="text-muted-foreground">ΑΦΜ: {order.afm}</p>
                          <p className="text-muted-foreground">{order.phone}</p>
                        </div>
                        <div>
                          <p className="font-medium">Προϊόντα:</p>
                          <p className="text-muted-foreground">{getProductsList(order.products, order.productDetails)}</p>
                          {getTotalCookies(order.productDetails) > 0 && (
                            <p className="text-primary font-medium">Σύνολο μπισκότα: {getTotalCookies(order.productDetails)}</p>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">Ημερομηνία:</p>
                          <p className="text-muted-foreground">{order.createdAt.toLocaleDateString('el-GR')}</p>
                          {order.orderFor && (
                            <p className="text-primary font-medium">Παράδοση: {new Date(order.orderFor).toLocaleDateString('el-GR')}</p>
                          )}
                          {order.discount !== 'none' && (
                            <p className="text-green-600 font-medium">Έκπτωση: {order.discount}%</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <Button variant="outline" size="sm" onClick={(e)=>{e.stopPropagation(); handlePrintOrder(order)}}>
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button variant="secondary" size="sm" onClick={(e)=>{e.stopPropagation(); setEditingOrder(order)}}>
                        Επεξ.
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onPrint={() => handlePrintOrder(selectedOrder)}
          onStatusChange={handleStatusChange}
          onDelete={handleDeleteOrder}
          onEdit={(order) => { setSelectedOrder(null); setEditingOrder(order) }}
        />
      )}
    </div>
  )
}
