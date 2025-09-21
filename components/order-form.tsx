"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2 } from "lucide-react"

interface ProductItem {
  id: string
  type: string
  // quantity stored as string so it can be blank in the UI; parse when needed
  quantity: string
}

interface OrderData {
  afm: string
  customerName: string
  phone: string
  orderFor: string // Added order for date field
  remarks?: string // Optional remarks
  communicationMethod?: string
  communicationValue?: string
  products: {
    cookies: boolean
    figures: boolean
    sets: boolean
    toppers: boolean
    prints: boolean
    other: boolean // Added other category
  }
  productDetails: {
    cookies: ProductItem[]
    figures: ProductItem[]
    sets: ProductItem[]
    toppers: ProductItem[]
    prints: ProductItem[]
    other: ProductItem[] // Added other category details
  }
  discount: string
}

interface OrderFormProps {
  onSubmit?: (orderData: OrderData, orderId?: string) => void
  /** When mode = 'edit', we pre-fill the form and call onSubmit with the existing order id */
  mode?: 'create' | 'edit'
  /** Minimal initial data coming from an existing order. Quantity may be number or string */
  initialData?: {
    id?: string
    afm?: string
    customerName?: string
    phone?: string
    orderFor?: string | null
    remarks?: string | null
    communicationMethod?: string | null
    communicationValue?: string | null
    discount?: string
    products?: Partial<OrderData['products']>
    productDetails?: Partial<{ [K in keyof OrderData['productDetails']]: Array<{ id: string; type: string; quantity: string | number }> }>
  }
  onCancel?: () => void
}

export function OrderForm({ onSubmit, mode = 'create', initialData, onCancel }: OrderFormProps) {
  const [orderData, setOrderData] = useState<OrderData>({
    afm: "",
    customerName: "",
    phone: "",
    orderFor: "", // Initialize order for date
    products: {
      cookies: false,
      figures: false,
      sets: false,
      toppers: false,
      prints: false,
      other: false, // Initialize other category
    },
    productDetails: {
      cookies: [],
      figures: [],
      sets: [],
      toppers: [],
      prints: [],
      other: [], // Initialize other category details
    },
    discount: "none",
    remarks: "",
    communicationMethod: "",
    communicationValue: "",
  })

  // Hydrate state when editing
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setOrderData(prev => ({
        ...prev,
        afm: initialData.afm || "",
        customerName: initialData.customerName || "",
        phone: initialData.phone || "",
        orderFor: initialData.orderFor || "",
        remarks: initialData.remarks || "",
        communicationMethod: initialData.communicationMethod || "",
        communicationValue: initialData.communicationValue || "",
        discount: initialData.discount || initialData.discount === 'none' ? (initialData.discount as string) : (prev.discount || 'none'),
        products: {
          cookies: initialData.products?.cookies ?? false,
            figures: initialData.products?.figures ?? false,
            sets: initialData.products?.sets ?? false,
            toppers: initialData.products?.toppers ?? false,
            prints: initialData.products?.prints ?? false,
            other: initialData.products?.other ?? false,
        },
        productDetails: {
          cookies: (initialData.productDetails?.cookies || []).map(i => ({ ...i, quantity: String(i.quantity ?? '') })),
          figures: (initialData.productDetails?.figures || []).map(i => ({ ...i, quantity: String(i.quantity ?? '') })),
          sets: (initialData.productDetails?.sets || []).map(i => ({ ...i, quantity: String(i.quantity ?? '') })),
          toppers: (initialData.productDetails?.toppers || []).map(i => ({ ...i, quantity: String(i.quantity ?? '') })),
          prints: (initialData.productDetails?.prints || []).map(i => ({ ...i, quantity: String(i.quantity ?? '') })),
          other: (initialData.productDetails?.other || []).map(i => ({ ...i, quantity: String(i.quantity ?? '') })),
        }
      }))
    }
  }, [mode, initialData])

  const handleProductChange = (product: keyof OrderData["products"], checked: boolean) => {
    setOrderData((prev: OrderData) => ({
      ...prev,
      products: {
        ...prev.products,
        [product]: checked,
      },
      productDetails: {
        ...prev.productDetails,
        [product]: checked ? prev.productDetails[product] : [],
      },
    }))
  }

  const addProductItem = (category: keyof OrderData["productDetails"]) => {
    const newItem: ProductItem = {
      id: Date.now().toString(),
      type: "",
      quantity: "", // start empty instead of 1
    }
    setOrderData((prev: OrderData) => ({
      ...prev,
      productDetails: {
        ...prev.productDetails,
        [category]: [...prev.productDetails[category], newItem],
      },
    }))
  }

  const removeProductItem = (category: keyof OrderData["productDetails"], itemId: string) => {
    setOrderData((prev: OrderData) => ({
      ...prev,
      productDetails: {
        ...prev.productDetails,
        [category]: prev.productDetails[category].filter((item: ProductItem) => item.id !== itemId),
      },
    }))
  }

  const updateProductItem = (
    category: keyof OrderData["productDetails"],
    itemId: string,
    field: "type" | "quantity",
    value: string,
  ) => {
    setOrderData((prev: OrderData) => ({
      ...prev,
      productDetails: {
        ...prev.productDetails,
        [category]: prev.productDetails[category].map((item: ProductItem) =>
          item.id === itemId ? { ...item, [field]: value } : item,
        ),
      },
    }))
  }

  const getTotalCookies = () => {
    return orderData.productDetails.cookies.reduce((total: number, item: ProductItem) => {
      const q = parseInt(item.quantity, 10)
      return total + (Number.isNaN(q) ? 0 : q)
    }, 0)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSubmit) {
      onSubmit(orderData, initialData?.id)
      if (mode === 'create') {
        setOrderData({
          afm: "",
          customerName: "",
          phone: "",
          orderFor: "", // Reset order for date
          products: {
            cookies: false,
            figures: false,
            sets: false,
            toppers: false,
            prints: false,
            other: false, // Reset other category
          },
          productDetails: {
            cookies: [],
            figures: [],
            sets: [],
            toppers: [],
            prints: [],
            other: [], // Reset other category details
          },
            discount: "none",
            remarks: "",
            communicationMethod: "",
            communicationValue: "",
        })
      }
    }
  }

  return (
    <Card className="w-full shadow-lg border-border/50">
      <CardHeader className="text-center pb-6">
        <h1 className="text-2xl font-bold text-foreground">
          {mode === 'edit' ? 'Επεξεργασία Παραγγελίας' : 'Καταχώρηση Παραγγελίας'}
        </h1>
      </CardHeader>

      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Στοιχεία Πελάτη */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">Στοιχεία Πελάτη</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="afm" className="text-sm font-medium">
                  ΑΦΜ
                </Label>
                <Input
                  id="afm"
                  type="text"
                  placeholder="Εισάγετε ΑΦΜ"
                  value={orderData.afm}
                  onChange={(e) => setOrderData((prev) => ({ ...prev, afm: e.target.value }))}
                  className="bg-input border-border focus:ring-ring"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerName" className="text-sm font-medium">
                  Όνομα Πελάτη
                </Label>
                <Input
                  id="customerName"
                  type="text"
                  placeholder="Εισάγετε όνομα"
                  value={orderData.customerName}
                  onChange={(e) => setOrderData((prev) => ({ ...prev, customerName: e.target.value }))}
                  className="bg-input border-border focus:ring-ring"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Τηλέφωνο
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Εισάγετε τηλέφωνο"
                  value={orderData.phone}
                  onChange={(e) => setOrderData((prev) => ({ ...prev, phone: e.target.value }))}
                  className="bg-input border-border focus:ring-ring"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="orderFor" className="text-sm font-medium">
                  Ημερομηνία Παράδοσης (προαιρετικό)
                </Label>
                <Input
                  id="orderFor"
                  type="date"
                  value={orderData.orderFor}
                  onChange={(e) => setOrderData((prev) => ({ ...prev, orderFor: e.target.value }))}
                  className="bg-input border-border focus:ring-ring"
                />
              </div>
            </div>

            {/* Τέλος στοιχείων πελάτη */}
          </div>

          {/* Επικοινωνία */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">Επικοινωνία</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 md:col-span-1">
                <Label htmlFor="communicationMethod" className="text-sm font-medium">Τρόπος Επικοινωνίας</Label>
                <Select
                  value={orderData.communicationMethod || ""}
                  onValueChange={(value) => setOrderData(prev => ({ ...prev, communicationMethod: value }))}
                >
                  <SelectTrigger id="communicationMethod" className="bg-input border-border">
                    <SelectValue placeholder="Επιλέξτε" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="phone">Τηλέφωνο</SelectItem>
                    <SelectItem value="viber">Viber</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="communicationValue" className="text-sm font-medium">Στοιχείο Επικοινωνίας</Label>
                <Input
                  id="communicationValue"
                  type="text"
                  placeholder="Email, username, αριθμός κ.λπ. (προαιρετικό)"
                  value={orderData.communicationValue || ""}
                  onChange={(e) => setOrderData(prev => ({ ...prev, communicationValue: e.target.value }))}
                  className="bg-input border-border focus:ring-ring"
                />
              </div>
            </div>
          </div>

          {/* Προϊόντα */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">Προϊόντα</h2>

            <div className="space-y-6">
              {[
                { key: "cookies", label: "Μπισκότα" },
                { key: "figures", label: "Φιγούρα" },
                { key: "sets", label: "Σετάκια" },
                { key: "toppers", label: "Τόπερς" },
                { key: "prints", label: "Εκτυπώσεις" },
                { key: "other", label: "Άλλο" }, // Added other category
              ].map(({ key, label }) => (
                <div key={key} className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30">
                    <Checkbox
                      id={key}
                      checked={orderData.products[key as keyof OrderData["products"]]}
                      onCheckedChange={(checked) =>
                        handleProductChange(key as keyof OrderData["products"], checked as boolean)
                      }
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <Label htmlFor={key} className="text-sm font-medium cursor-pointer">
                      {label}
                    </Label>
                  </div>

                  {orderData.products[key as keyof OrderData["products"]] && (
                    <div className="ml-6 space-y-3 p-4 bg-muted/20 rounded-lg border border-border/50">
                      {orderData.productDetails[key as keyof OrderData["productDetails"]].map((item) => (
                        <div key={item.id} className="flex items-center gap-3">
                          <Input
                            placeholder={key === "other" ? "Περιγραφή προϊόντος" : `Τύπος ${label.toLowerCase()}`} // Different placeholder for other category
                            value={item.type}
                            onChange={(e) =>
                              updateProductItem(
                                key as keyof OrderData["productDetails"],
                                item.id,
                                "type",
                                e.target.value,
                              )
                            }
                            className="flex-1"
                          />
                          <Input
                            type="text"
                            inputMode="numeric"
                            placeholder="Ποσότητα"
                            value={item.quantity}
                            onChange={(e) => {
                              const raw = e.target.value
                              // Allow blank, otherwise digits only
                              const cleaned = raw.replace(/\D/g, "")
                              updateProductItem(
                                key as keyof OrderData["productDetails"],
                                item.id,
                                "quantity",
                                cleaned,
                              )
                            }}
                            className="w-24"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeProductItem(key as keyof OrderData["productDetails"], item.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addProductItem(key as keyof OrderData["productDetails"])}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Προσθήκη {label}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {orderData.products.cookies && getTotalCookies() > 0 && (
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-lg font-semibold text-primary">Συνολικά Μπισκότα: {getTotalCookies()} τεμάχια</p>
              </div>
            )}
          </div>

          {/* Παρατηρήσεις */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">Πρόσθετες Παρατηρήσεις (προαιρετικό)</h2>
            <div className="space-y-2">
              <Label htmlFor="remarks" className="text-sm font-medium">Παρατηρήσεις</Label>
              <Textarea
                id="remarks"
                placeholder="Προσθέστε τυχόν σχόλια, διευκρινίσεις ή ειδικές οδηγίες..."
                value={orderData.remarks || ""}
                onChange={(e) => setOrderData(prev => ({ ...prev, remarks: e.target.value }))}
                className="bg-input border-border focus:ring-ring min-h-32 placeholder:text-base"
              />
            </div>
          </div>

          {/* Έκπτωση */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">Έκπτωση</h2>

            <div className="space-y-2">
              <Label htmlFor="discount" className="text-sm font-medium">
                Ποσοστό Έκπτωσης
              </Label>
              <Select
                value={orderData.discount}
                onValueChange={(value) => setOrderData((prev) => ({ ...prev, discount: value }))}
              >
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="Επιλέξτε έκπτωση" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Χωρίς έκπτωση</SelectItem>
                  <SelectItem value="5">5%</SelectItem>
                  <SelectItem value="10">10%</SelectItem>
                  <SelectItem value="20">20%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Κουμπί Υποβολής */}
          <div className="pt-4">
            <div className="flex gap-3">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-1/3"
                  onClick={onCancel}
                >
                  Άκυρο
                </Button>
              )}
              <Button
                type="submit"
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3"
              >
                {mode === 'edit' ? 'Αποθήκευση Αλλαγών' : 'Καταχώρηση Παραγγελίας'}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
