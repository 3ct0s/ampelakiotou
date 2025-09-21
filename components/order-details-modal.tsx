"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent as ConfirmContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Printer, X } from "lucide-react"
import type { Order } from "./order-dashboard"
import { useState } from "react"

interface OrderDetailsModalProps {
  order: Order
  isOpen: boolean
  onClose: () => void
  onPrint: () => void
  onStatusChange?: (orderId: string, newStatus: Order["status"]) => void
  onDelete?: (orderId: string) => Promise<void> | void
  onEdit?: (order: Order) => void
}

export function OrderDetailsModal({ order, isOpen, onClose, onPrint, onStatusChange, onDelete, onEdit }: OrderDetailsModalProps) {
  const [currentStatus, setCurrentStatus] = useState<Order["status"]>(order.status)
  const [deleting, setDeleting] = useState(false)

  const getProductsList = (products: Order["products"], productDetails: Order["productDetails"]) => {
    const productNames = {
      cookies: "Μπισκότα",
      figures: "Φιγούρα",
      sets: "Σετάκια",
      toppers: "Τόπερς",
      prints: "Εκτυπώσεις",
      other: "Άλλο",
    }

    return Object.entries(products)
      .filter(([_, selected]) => selected)
      .map(([key, _]) => {
        const categoryKey = key as keyof typeof productDetails
        const items = productDetails[categoryKey]
        return {
          category: productNames[categoryKey],
          items: items,
        }
      })
  }

  const getTotalCookies = (productDetails: Order["productDetails"]) => {
    return productDetails.cookies.reduce((total, item) => total + item.quantity, 0)
  }

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "proforma_sent":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "payment":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "shipped":
        return "bg-green-100 text-green-800 border-green-200"
      case "shipped_unpaid":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusText = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "Εκκρεμής"
      case "proforma_sent":
        return "Αποστ. Προτιμολογίου"
      case "payment":
        return "Πληρωμή"
      case "shipped":
        return "Αποστολή"
      case "shipped_unpaid":
        return "Αποστολή χωρίς εξόφληση"
      default:
        return status
    }
  }

  const handleStatusChange = (newStatus: Order["status"]) => {
    setCurrentStatus(newStatus)
    onStatusChange?.(order.id, newStatus)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-[95vw] h-[95vh] p-0 gap-0" showCloseButton={false}>
        <div className="flex flex-col h-full">
          {/* Fixed header */}
          <DialogHeader className="flex-shrink-0 p-4 sm:p-6 border-b border-border bg-background">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl md:text-2xl">Λεπτομέρειες Παραγγελίας #{order.orderNumber ?? order.id}</DialogTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={onPrint}>
                  <Printer className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Εκτύπωση</span>
                </Button>
                {onDelete && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" disabled={deleting}>
                        {deleting ? "Διαγραφή..." : "Διαγραφή"}
                      </Button>
                    </AlertDialogTrigger>
                    <ConfirmContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Επιβεβαίωση Διαγραφής</AlertDialogTitle>
                        <AlertDialogDescription>
                          Είστε σίγουροι ότι θέλετε να διαγράψετε αυτήν την παραγγελία; Η ενέργεια δεν μπορεί να αναιρεθεί.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Ακύρωση</AlertDialogCancel>
                        <AlertDialogAction
                          disabled={deleting}
                          onClick={async (e) => {
                            e.preventDefault()
                            if (!onDelete) return
                            try {
                              setDeleting(true)
                              await onDelete(order.id)
                            } finally {
                              setDeleting(false)
                            }
                          }}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Επιβεβαίωση
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </ConfirmContent>
                  </AlertDialog>
                )}
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Scrollable content */}
          <div 
            className="flex-1 min-h-0" 
            style={{ 
              overflowY: 'scroll',
              maxHeight: 'calc(95vh - 120px)', // Account for header height
              scrollbarWidth: 'thin',
              scrollbarColor: '#9CA3AF #F3F4F6'
            }}
          >
            <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
              {onEdit && (
                <div className="flex justify-end -mt-2">
                  <Button variant="secondary" size="sm" onClick={() => onEdit(order)}>
                    Επεξεργασία
                  </Button>
                </div>
              )}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Κατάσταση Παραγγελίας</h3>
                  <Badge className={getStatusColor(currentStatus)}>{getStatusText(currentStatus)}</Badge>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Αλλαγή κατάστασης:</label>
                  <Select value={currentStatus} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Εκκρεμής</SelectItem>
                      <SelectItem value="proforma_sent">Αποστ. Προτιμολογίου</SelectItem>
                      <SelectItem value="payment">Πληρωμή</SelectItem>
                      <SelectItem value="shipped">Αποστολή</SelectItem>
                      <SelectItem value="shipped_unpaid">Αποστολή χωρίς εξόφληση</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Customer Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Στοιχεία Πελάτη</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-muted/30 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Όνομα Πελάτη</p>
                    <p className="font-medium">{order.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ΑΦΜ</p>
                    <p className="font-medium">{order.afm}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Τηλέφωνο</p>
                    <p className="font-medium">{order.phone}</p>
                  </div>
                  {order.communicationMethod && order.communicationValue && (
                    <div className="sm:col-span-2">
                      <p className="text-sm text-muted-foreground">Επικοινωνία</p>
                      <p className="font-medium">{order.communicationMethod}: {order.communicationValue}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Ημερομηνία Παραγγελίας</p>
                    <p className="font-medium">{order.createdAt.toLocaleDateString("el-GR")}</p>
                  </div>
                  {order.orderFor && (
                    <div>
                      <p className="text-sm text-muted-foreground">Ημερομηνία Παράδοσης</p>
                      <p className="font-medium">{new Date(order.orderFor).toLocaleDateString("el-GR")}</p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Products */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Προϊόντα</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {getProductsList(order.products, order.productDetails).map((productCategory, index) => (
                    <div key={index} className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                      <h4 className="font-semibold text-primary mb-3">{productCategory.category}</h4>
                      {productCategory.items.length > 0 ? (
                        <div className="space-y-2">
                          {productCategory.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex justify-between items-center p-2 bg-background rounded border"
                            >
                              <span className="font-medium text-sm">{item.type}</span>
                              <Badge variant="secondary">{item.quantity} τεμάχια</Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground italic text-sm">Δεν έχουν καθοριστεί λεπτομέρειες</p>
                      )}
                    </div>
                  ))}
                </div>
                {getProductsList(order.products, order.productDetails).length === 0 && (
                  <p className="text-muted-foreground italic">Δεν έχουν επιλεγεί προϊόντα</p>
                )}

                {getTotalCookies(order.productDetails) > 0 && (
                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <h4 className="text-lg font-semibold text-primary">
                      Συνολικά Μπισκότα: {getTotalCookies(order.productDetails)} τεμάχια
                    </h4>
                  </div>
                )}
              </div>

              <Separator />

              {/* Remarks */}
              {order.remarks && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Παρατηρήσεις</h3>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm whitespace-pre-line">{order.remarks}</p>
                  </div>
                </div>
              )}

              <Separator />

              {/* Discount */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Έκπτωση</h3>
                <div className="p-4 bg-muted/30 rounded-lg">
                  {order.discount === "none" ? (
                    <p className="text-muted-foreground">Χωρίς έκπτωση</p>
                  ) : (
                    <p className="text-green-600 font-semibold text-lg">{order.discount}% έκπτωση</p>
                  )}
                </div>
              </div>

              {/* Extra spacing to ensure scrolling works */}
              <div className="h-20"></div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
