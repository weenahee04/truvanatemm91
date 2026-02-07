import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Package, ShoppingBag, Settings, LogOut, Users, Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/Button';
import { useGlobal } from '../context/GlobalContext';
import { getProductsBySeller, getSellingHistoryBySeller } from '../services/adminService';
import { logout as authLogout } from '../services/authService';

interface Product {
  id: string;
  name: string;
  title?: string;
  sku?: string;
  price?: number;
  priceTHB?: number;
  priceUSD?: number;
  stock?: number;
  inventory?: number;
  image?: string;
  images?: string[];
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const SellerProducts: React.FC = () => {
  const { user, logout, showToast } = useGlobal();
  const navigate = useNavigate();
  const { t } = useTranslation('seller');
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'soldout'>('all');
  const [productSales, setProductSales] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user || !user.id) {
      showToast(t('dashboard.pleaseLogin'), 'error');
      navigate('/seller/login');
      return;
    }

    // Check if user is seller
    if (user.role !== 'seller' && user.role !== 'SELLER') {
      showToast(t('dashboard.noAccess'), 'error');
      navigate('/seller/login');
      return;
    }

    loadProducts();
  }, [user]);

  const loadProducts = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const [sellerProducts, orders] = await Promise.all([
        getProductsBySeller(user.id),
        getSellingHistoryBySeller(user.id)
      ]);

      setProducts(sellerProducts);

      // Calculate sales count for each product
      const salesMap: Record<string, number> = {};
      orders.forEach((order: any) => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach((item: any) => {
            const isSellerItem = item.sellerId === user.id ||
                                item.seller === user.id ||
                                item.userId === user.id ||
                                (item.product && item.product.sellerId === user.id);
            
            if (isSellerItem) {
              const productId = item.productId || item.id || item.product?.id;
              if (productId) {
                salesMap[productId] = (salesMap[productId] || 0) + (item.quantity || 1);
              }
            }
          });
        }
      });
      setProductSales(salesMap);

      // Apply initial filter
      filterProducts(sellerProducts, activeFilter, searchTerm, salesMap);
    } catch (error) {
      console.error('Error loading products:', error);
      showToast(t('productsPage.loadError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    filterProducts(products, activeFilter, searchTerm, productSales);
  }, [activeFilter, searchTerm, products, productSales]);

  const filterProducts = (productList: Product[], filter: string, search: string, sales: Record<string, number>) => {
    let filtered = [...productList];

    // Apply search filter
    if (search.trim()) {
      filtered = filtered.filter(product => {
        const name = (product.name || product.title || '').toLowerCase();
        const sku = (product.sku || '').toLowerCase();
        return name.includes(search.toLowerCase()) || sku.includes(search.toLowerCase());
      });
    }

    // Apply status filter
    if (filter === 'active') {
      filtered = filtered.filter(product => {
        const stock = product.stock ?? product.inventory ?? 0;
        return stock > 0;
      });
    } else if (filter === 'soldout') {
      filtered = filtered.filter(product => {
        const stock = product.stock ?? product.inventory ?? 0;
        return stock === 0;
      });
    }

    setFilteredProducts(filtered);
  };

  const handleLogout = async () => {
    try {
      await authLogout();
      logout();
      navigate('/seller/login');
      showToast(t('dashboard.logoutSuccess'), 'success');
    } catch (error) {
      console.error('Logout error:', error);
      showToast(t('dashboard.logoutError'), 'error');
    }
  };

  const formatCurrency = (amount: number) => {
    return `฿${amount.toLocaleString('th-TH')}`;
  };

  const getProductPrice = (product: Product) => {
    return product.price || product.priceTHB || (product.priceUSD ? product.priceUSD * 35 : 0);
  };

  const getProductStock = (product: Product) => {
    return product.stock ?? product.inventory ?? 0;
  };

  const getProductSales = (productId: string) => {
    return productSales[productId] || 0;
  };

  const getProductImage = (product: Product) => {
    if (product.image) return product.image;
    if (product.images && product.images.length > 0) return product.images[0];
    return 'https://via.placeholder.com/100?text=No+Image';
  };
  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50 items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-navy border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">{t('dashboard.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-brand-navy text-white hidden lg:flex flex-col shrink-0">
        <div className="p-6">
          <h2 className="text-2xl font-bold tracking-tighter text-brand-gold uppercase">Truvamate</h2>
          <span className="text-xs uppercase tracking-widest text-slate-400">Seller Center</span>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-1">
          <Link to="/seller" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            <LayoutDashboard size={20} /> Dashboard
          </Link>
          <Link to="/seller/products" className="flex items-center gap-3 px-4 py-3 bg-slate-800 text-white rounded-lg">
            <Package size={20} /> Products
          </Link>
          <Link to="/seller/orders" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            <ShoppingBag size={20} /> Orders
          </Link>
          <Link to="/seller/customers" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            <Users size={20} /> Customers
          </Link>
          <Link to="/seller/settings" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            <Settings size={20} /> Shop Settings
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-700">
           <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-white transition-colors w-full"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 w-full overflow-hidden">
        <header className="bg-white shadow-sm border-b border-slate-200 h-16 flex items-center justify-between px-8">
           <h1 className="font-bold text-slate-800 text-lg">Product Management</h1>
           <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-bold text-slate-900">{user?.shopName || user?.name || 'Seller'}</div>
                <div className="text-xs text-slate-500">Verified Seller</div>
              </div>
              <div className="h-10 w-10 bg-brand-navy rounded-full flex items-center justify-center text-white font-bold">
                {(user?.shopName || user?.name || 'S')[0].toUpperCase()}
              </div>
           </div>
        </header>

        <div className="p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setActiveFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeFilter === 'all' 
                    ? 'bg-brand-navy text-white' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                All Products
              </button>
              <button 
                onClick={() => setActiveFilter('active')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeFilter === 'active' 
                    ? 'bg-brand-navy text-white' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Active
              </button>
              <button 
                onClick={() => setActiveFilter('soldout')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeFilter === 'soldout' 
                    ? 'bg-brand-navy text-white' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Sold Out
              </button>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:flex-none">
                <Search size={18} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-brand-navy w-full md:w-64"
                />
              </div>
              <Link to="/seller/products/new">
                <Button className="gap-2"><Plus size={18} /> Add New Product</Button>
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {filteredProducts.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 font-medium">Product Name</th>
                        <th className="px-6 py-4 font-medium">SKU</th>
                        <th className="px-6 py-4 font-medium">Price</th>
                        <th className="px-6 py-4 font-medium">Stock</th>
                        <th className="px-6 py-4 font-medium">Sales</th>
                        <th className="px-6 py-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredProducts.map((product, index) => {
                        const stock = getProductStock(product);
                        const sales = getProductSales(product.id);
                        const price = getProductPrice(product);
                        const productImage = getProductImage(product);
                        const productName = product.name || product.title || 'Product';
                        const productSku = product.sku || product.id?.substring(0, 8) || `SKU-${index + 1}`;

                        return (
                          <tr key={`${product.id}-${index}`} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-slate-100 rounded object-cover overflow-hidden shrink-0">
                                  <img 
                                    src={productImage} 
                                    className="w-full h-full object-cover" 
                                    alt={productName}
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100?text=No+Image';
                                    }}
                                  />
                                </div>
                                <span className="font-medium text-slate-900 line-clamp-1 max-w-xs">{productName}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-slate-600">{productSku}</td>
                            <td className="px-6 py-4 font-medium text-slate-900">{formatCurrency(price)}</td>
                            <td className="px-6 py-4">
                              <span className={`${stock > 0 ? 'text-green-600' : 'text-red-600'} font-medium`}>
                                {stock}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-600">{sales}</td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button 
                                  className="p-1.5 text-slate-500 hover:bg-slate-100 rounded"
                                  title="Edit"
                                >
                                  <Pencil size={16} />
                                </button>
                                <button 
                                  className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded"
                                  title="Delete"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="px-6 py-4 border-t border-slate-200 flex justify-between items-center text-sm text-slate-500">
                  <span>
                    Showing {filteredProducts.length} of {products.length} products
                  </span>
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-slate-400">
                <Package size={48} className="mx-auto mb-4 opacity-50" />
                <p className="font-medium">
                  {searchTerm || activeFilter !== 'all' 
                    ? t('productsPage.noProductsSearch') 
                    : t('productsPage.noProducts')}
                </p>
                {!searchTerm && activeFilter === 'all' && (
                  <p className="text-sm mt-1">{t('productsPage.noProductsDesc')}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};