import React, { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { CreditCard, ArrowLeft, Loader, CheckCircle } from 'lucide-react'
import { createOrder, getCart, type CartItem } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import PageTitleHero from '../components/layout/PageTitleHero'

interface AddressForm {
  full_name: string
  phone: string
  address_line: string
  city: string
  province: string
  postal_code: string
  notes: string
}

const STORAGE_KEY = 'checkout_address'

export default function CheckoutPaymentPage() {
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()
  const { showToast } = useToast()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [address, setAddress] = useState<AddressForm | null>(null)
  const [paymentMethod, setPaymentMethod] = useState('cod')

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login')
      return
    }

    const saved = sessionStorage.getItem(STORAGE_KEY)
    if (!saved) {
      navigate('/checkout/address')
      return
    }

    try {
      setAddress(JSON.parse(saved))
    } catch {
      navigate('/checkout/address')
      return
    }

    const loadCart = async () => {
      setLoading(true)
      try {
        const res = await getCart()
        setCartItems(res.items || [])
      } catch (err: any) {
        showToast(err?.response?.data?.detail || 'Failed to load cart')
      } finally {
        setLoading(false)
      }
    }

    loadCart()
  }, [isLoggedIn, navigate])

  const handleConfirmOrder = async () => {
    if (!address) return
    if (cartItems.length === 0) {
      showToast('Your cart is empty')
      return
    }
    setSubmitting(true)
    try {
      const res = await createOrder({ address, payment_method: paymentMethod })
      sessionStorage.removeItem(STORAGE_KEY)
      navigate(`/order-confirmed/${res.order.id}`)
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to place order')
    } finally {
      setSubmitting(false)
    }
  }

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.qty, 0)

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-slate-600">Loading payment...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 pb-6">
      <PageTitleHero
        title="Payment"
        subtitle="Confirm your payment method and place the order"
        backgroundImage="/assets/daing/danggit/slide1.jfif"
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Checkout Steps */}
        <div className="mb-8">
          <div className="flex items-center gap-4 justify-center">
            {/* Step 1 - Cart */}
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm mb-2">
                1
              </div>
              <span className="text-xs font-medium text-slate-700">Cart</span>
            </div>

            {/* Divider */}
            <div className="flex-1 h-0.5 bg-blue-200 max-w-xs mx-2" />

            {/* Step 2 - Address */}
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm mb-2">
                2
              </div>
              <span className="text-xs font-medium text-slate-700">Address</span>
            </div>

            {/* Divider */}
            <div className="flex-1 h-0.5 bg-blue-200 max-w-xs mx-2" />

            {/* Step 3 - Payment */}
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm mb-2">
                3
              </div>
              <span className="text-xs font-medium text-slate-700">Payment</span>
            </div>
          </div>
        </div>

        <Link
          to="/checkout/address"
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Address
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-slate-900">Payment Method</h2>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg cursor-pointer hover:border-blue-300">
                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                />
                <span className="text-slate-700 font-medium">Cash on Delivery</span>
              </label>
              <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg cursor-pointer hover:border-blue-300">
                <input
                  type="radio"
                  name="payment"
                  value="gcash"
                  checked={paymentMethod === 'gcash'}
                  onChange={() => setPaymentMethod('gcash')}
                />
                <span className="text-slate-700 font-medium">GCash</span>
              </label>
              <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg cursor-pointer hover:border-blue-300">
                <input
                  type="radio"
                  name="payment"
                  value="card"
                  checked={paymentMethod === 'card'}
                  onChange={() => setPaymentMethod('card')}
                />
                <span className="text-slate-700 font-medium">Credit / Debit Card</span>
              </label>
            </div>

            <button
              onClick={handleConfirmOrder}
              disabled={submitting}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {submitting ? 'Placing order...' : 'Confirm Order'}
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-6 h-fit">
            <h3 className="font-semibold text-slate-900 mb-4">Order Summary</h3>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-600">Items</span>
              <span className="text-slate-900">{cartItems.length}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-600">Subtotal</span>
              <span className="text-slate-900">₱{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm mb-4">
              <span className="text-slate-600">Delivery</span>
              <span className="text-green-600">Free</span>
            </div>
            <div className="flex justify-between font-semibold text-slate-900 border-t border-slate-200 pt-4">
              <span>Total</span>
              <span>₱{subtotal.toLocaleString()}</span>
            </div>
            <div className="mt-4 text-xs text-slate-500">
              By placing your order, you agree to our terms and policies.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
