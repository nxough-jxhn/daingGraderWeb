import React, { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { MapPin, ArrowLeft, Loader, ShoppingCart } from 'lucide-react'
import { getCart, type CartItem } from '../services/api'
import { authService } from '../services/auth.service'
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
const PROFILE_PROMPT_KEY = 'checkout_profile_prompted'

export default function CheckoutAddressPage() {
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()
  const { showToast } = useToast()

  const [loading, setLoading] = useState(true)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [profileIncomplete, setProfileIncomplete] = useState(false)
  const [form, setForm] = useState<AddressForm>({
    full_name: '',
    phone: '',
    address_line: '',
    city: '',
    province: '',
    postal_code: '',
    notes: '',
  })

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login')
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

    const saved = sessionStorage.getItem(STORAGE_KEY)
    const hasSaved = Boolean(saved)
    if (saved) {
      try {
        setForm(JSON.parse(saved))
      } catch {
        // ignore
      }
    }

    const loadProfile = async () => {
      try {
        const currentUser = await authService.getCurrentUser()
        const fullName = currentUser.full_name || currentUser.name || ''
        const phone = currentUser.phone || ''
        const addressLine = currentUser.street_address || ''
        const city = currentUser.city || ''
        const province = currentUser.province || ''
        const missing = !fullName || !phone || !addressLine || !city || !province

        setProfileIncomplete(missing)

        if (!hasSaved) {
          setForm((prev) => ({
            ...prev,
            full_name: fullName || prev.full_name,
            phone: phone || prev.phone,
            address_line: addressLine || prev.address_line,
            city: city || prev.city,
            province: province || prev.province,
          }))
        }

        if (missing) {
          const prompted = sessionStorage.getItem(PROFILE_PROMPT_KEY)
          if (!prompted) {
            sessionStorage.setItem(PROFILE_PROMPT_KEY, '1')
            showToast('Please complete your profile details before placing an order.')
            navigate('/profile')
          }
        } else {
          sessionStorage.removeItem(PROFILE_PROMPT_KEY)
        }
      } catch {
        // ignore
      }
    }
    loadProfile()
  }, [isLoggedIn, navigate, showToast])

  const handleChange = (key: keyof AddressForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (profileIncomplete) {
      showToast('Please update your profile details before continuing.')
      navigate('/profile')
      return
    }
    if (cartItems.length === 0) {
      showToast('Your cart is empty')
      return
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(form))
    navigate('/checkout/payment')
  }

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.qty, 0)

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-slate-600">Loading checkout...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 pb-6">
      <PageTitleHero
        title="Shipping Address"
        subtitle="Set your delivery details before payment"
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
            <div className="flex-1 h-0.5 bg-slate-300 max-w-xs mx-2" />

            {/* Step 3 - Payment */}
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-slate-300 text-slate-600 flex items-center justify-center font-bold text-sm mb-2">
                3
              </div>
              <span className="text-xs font-medium text-slate-600">Payment</span>
            </div>
          </div>
        </div>

        <Link
          to="/cart"
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Cart
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-slate-900">Delivery Address</h2>
            </div>

            {profileIncomplete && (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Please complete your profile details first. After updating your profile, return here and the form will be
                auto-filled (you can still edit it for a different delivery location).
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-600">Full Name</label>
                  <input
                    value={form.full_name}
                    onChange={(e) => handleChange('full_name', e.target.value)}
                    required
                    className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Phone</label>
                  <input
                    value={form.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    required
                    className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600">Street Address</label>
                <input
                  value={form.address_line}
                  onChange={(e) => handleChange('address_line', e.target.value)}
                  required
                  className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-600">City</label>
                  <input
                    value={form.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    required
                    className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Province</label>
                  <input
                    value={form.province}
                    onChange={(e) => handleChange('province', e.target.value)}
                    required
                    className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Postal Code</label>
                  <input
                    value={form.postal_code}
                    onChange={(e) => handleChange('postal_code', e.target.value)}
                    required
                    className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600">Notes (Optional)</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  rows={3}
                  className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Continue to Payment
              </button>
            </form>
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
              Your order will be processed after payment confirmation.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
