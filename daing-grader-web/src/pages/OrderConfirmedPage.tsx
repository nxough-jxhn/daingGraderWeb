import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CheckCircle, Package, ArrowLeft, Loader } from 'lucide-react'
import { getOrderById, type OrderDetail } from '../services/api'
import PageTitleHero from '../components/layout/PageTitleHero'

export default function OrderConfirmedPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<OrderDetail | null>(null)

  useEffect(() => {
    if (!orderId) return
    const loadOrder = async () => {
      setLoading(true)
      try {
        const res = await getOrderById(orderId)
        setOrder(res.order)
      } finally {
        setLoading(false)
      }
    }
    loadOrder()
  }, [orderId])

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-slate-600">Loading order...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 pb-6">
      <PageTitleHero
        title="Order Confirmed"
        subtitle="Your order has been placed successfully"
        backgroundImage="/assets/daing/danggit/slide1.jfif"
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Thank you for your order!</h2>
          {order ? (
            <p className="text-slate-600 mb-6">
              Order <span className="font-semibold">{order.order_number}</span> has been confirmed.
            </p>
          ) : (
            <p className="text-slate-600 mb-6">Your order has been confirmed.</p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/orders"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Orders
            </Link>
            <Link
              to="/catalog"
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
