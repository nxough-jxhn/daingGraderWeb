import React, { useEffect, useState } from 'react'
import { ShoppingBag, DollarSign, Package, ShoppingCart, Star, RefreshCcw } from 'lucide-react'
import PageTitleHero from '../../components/layout/PageTitleHero'
import SalesBarChart from '../../components/SalesBarChart'
import SalesCategoryDonut from '../../components/SalesCategoryDonut'
import { useToast } from '../../contexts/ToastContext'
import {
  getSellerKPIs,
  getSellerRecentOrders,
  getSellerTopProducts,
  type SellerKPIs,
  type RecentOrder,
  type TopProduct
} from '../../services/api'

export default function SellerDashboardPage() {
  const { showToast } = useToast()
  const [kpis, setKpis] = useState<SellerKPIs | null>(null)
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [topProductsTotal, setTopProductsTotal] = useState(0)
  const [topProductsPage, setTopProductsPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const [kpisRes, ordersRes, productsRes] = await Promise.all([
        getSellerKPIs(),
        getSellerRecentOrders(3),
        getSellerTopProducts(topProductsPage, 4)
      ])
      
      setKpis(kpisRes.kpis)
      setRecentOrders(ordersRes.orders)
      setTopProducts(productsRes.products)
      setTopProductsTotal(productsRes.total)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      showToast('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [topProductsPage])

  const loadTopProducts = async (page: number) => {
    try {
      const res = await getSellerTopProducts(page, 4)
      setTopProducts(res.products)
      setTopProductsPage(page)
    } catch (error) {
      showToast('Failed to load top products')
    }
  }

  const kpiConfigs = [
    { label: 'Total Products', value: kpis?.total_products.toString() || '0', icon: Package, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Total Orders', value: kpis?.total_orders.toString() || '0', icon: ShoppingCart, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Total Earnings', value: `₱${kpis?.total_earnings.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}`, icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-100' },
    { label: 'Average Rating', value: kpis?.average_rating.toFixed(1) || '0.0', icon: Star, color: 'text-purple-600', bg: 'bg-purple-100' },
  ]

  const totalTopProductsPages = Math.ceil(topProductsTotal / 4)

  const statusStyles: Record<string, string> = {
    confirmed: 'text-slate-600',
    pending: 'text-amber-600',
    shipped: 'text-blue-600',
    delivered: 'text-emerald-600',
    cancelled: 'text-red-600',
  }

  return (
    <>
      <PageTitleHero
        title="Seller Dashboard"
        subtitle="Manage your store, track sales, and grow your business"
        backgroundImage="/assets/page-hero/hero-bg.jpg"
      />
      
      <div className="space-y-6 px-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-blue-900">Dashboard Overview</h1>
            <p className="text-sm text-slate-600">Real-time store performance metrics</p>
          </div>
          <button
            onClick={loadDashboardData}
            className="inline-flex items-center gap-2 px-4 py-2 border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors text-sm font-medium"
          >
            <RefreshCcw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64 text-slate-500">
            <div className="text-center">
              <Package className="w-12 h-12 mx-auto mb-3 animate-pulse text-blue-300" />
              <p>Loading dashboard...</p>
            </div>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {kpiConfigs.map(({ label, value, icon: Icon, color, bg }) => (
                <div
                  key={label}
                  className="bg-gradient-to-b from-white to-blue-50 border border-blue-200 shadow-md p-4 rounded-xl"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-500 font-medium uppercase tracking-wide">{label}</div>
                    <div className={`w-9 h-9 rounded-lg ${bg} text-blue-700 flex items-center justify-center`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3 text-2xl font-bold text-blue-900">{value}</div>
                </div>
              ))}
            </div>

            {/* Sales Overview & Recent Orders */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div className="xl:col-span-2 bg-gradient-to-br from-white to-blue-50 border border-blue-200 shadow-md p-4 rounded-lg">
                <h2 className="text-base font-bold text-blue-900 mb-4">Sales Overview</h2>
                <SalesBarChart />
              </div>

              <div className="bg-gradient-to-br from-white to-blue-50 border border-blue-200 shadow-md p-4 rounded-lg">
                <h3 className="text-base font-bold text-blue-900 mb-4">Recent Orders</h3>
                {recentOrders.length === 0 ? (
                  <div className="text-center text-slate-500 py-8">
                    <ShoppingCart className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm">No orders yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentOrders.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between border border-slate-200 p-3 hover:bg-slate-50 transition-colors"
                      >
                        <div>
                          <div className="text-sm font-semibold text-slate-800">{order.customer}</div>
                          <div className="text-xs text-slate-500">{order.order_number}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-blue-900">
                            ₱{order.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </div>
                          <div className={`text-xs font-medium capitalize ${statusStyles[order.status.toLowerCase()] || 'text-slate-500'}`}>
                            {order.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Top Products & Category Breakdown */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div className="xl:col-span-2 bg-gradient-to-br from-white to-blue-50 border border-blue-200 shadow-md p-4 rounded-lg overflow-hidden">
                <h3 className="text-base font-bold text-blue-900 mb-4">Top Products</h3>

                {topProducts.length === 0 ? (
                  <div className="text-center text-slate-500 py-8">
                    <Package className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm">No products yet</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-blue-50 border-b border-blue-200">
                          <tr>
                            <th className="text-left px-3 py-2 text-xs font-bold text-blue-900">Product</th>
                            <th className="text-right px-3 py-2 text-xs font-bold text-blue-900">Sold</th>
                            <th className="text-right px-3 py-2 text-xs font-bold text-blue-900">Price</th>
                            <th className="text-right px-3 py-2 text-xs font-bold text-blue-900">Stock</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {topProducts.map((product) => (
                            <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-3 py-2">
                                <div className="text-sm font-medium text-slate-800">{product.name}</div>
                                {product.category_name && (
                                  <div className="text-xs text-slate-500">{product.category_name}</div>
                                )}
                              </td>
                              <td className="px-3 py-2 text-right text-sm text-slate-700">{product.sold}</td>
                              <td className="px-3 py-2 text-right text-sm font-semibold text-blue-700">
                                ₱{product.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-3 py-2 text-right">
                                <span
                                  className={`text-xs font-bold ${
                                    product.stock === 0
                                      ? 'text-red-600'
                                      : product.stock < 10
                                        ? 'text-amber-600'
                                        : 'text-emerald-600'
                                  }`}
                                >
                                  {product.stock === 0 ? 'Out' : product.stock < 10 ? `${product.stock} (Low)` : product.stock}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {totalTopProductsPages > 1 && (
                      <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
                        <div className="text-sm text-slate-600">
                          Page {topProductsPage} of {totalTopProductsPages}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => loadTopProducts(topProductsPage - 1)}
                            disabled={topProductsPage === 1}
                            className="px-3 py-1.5 text-sm border border-blue-200 text-blue-700 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Previous
                          </button>
                          <button
                            onClick={() => loadTopProducts(topProductsPage + 1)}
                            disabled={topProductsPage === totalTopProductsPages}
                            className="px-3 py-1.5 text-sm border border-blue-200 text-blue-700 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="bg-gradient-to-br from-white to-blue-50 border border-blue-200 shadow-md p-4 rounded-lg">
                <h3 className="text-base font-bold text-blue-900 mb-4">Sales by Category</h3>
                <SalesCategoryDonut />
              </div>
            </div>

          </>
        )}
      </div>
    </>
  )
}
