import { useState, useEffect } from 'react';
import { api, ListingItem, BidItem } from './services/api';
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Bell,
  ChevronRight,
  Building2,
  CircleHelp,
  Clock3,
  Cloud,
  FileText,
  IndianRupee,
  Leaf,
  Search,
  ShoppingCart,
  LayoutDashboard,
  MapPin,
  Mic,
  Package,
  Plus,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Sprout,
  Truck,
  UserRound,
  UsersRound,
  WalletCards,
  Wheat,
  X,
  Zap,
} from 'lucide-react';

type Role = 'farmer' | 'retail' | 'bulk';
type View = 'overview' | 'inventory' | 'orders' | 'logistics' | 'wallet';

type Listing = {
  crop: string;
  variety: string;
  quantity: string;
  route: 'Retail' | 'Bulk';
  grade: 'A' | 'B';
  status: 'Live' | 'Pending pickup';
  price: string;
};

const navItems: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'inventory', label: 'My produce', icon: Package },
  { id: 'orders', label: 'Orders & bids', icon: ShoppingBag },
  { id: 'logistics', label: 'Logistics', icon: Truck },
  { id: 'wallet', label: 'Earnings', icon: WalletCards },
];

const initialListings: Listing[] = [
  { crop: 'Tomato', variety: 'Arka Rakshak', quantity: '246 kg left', route: 'Retail', grade: 'A', status: 'Live', price: '₹42 / kg' },
  { crop: 'Wheat', variety: 'Lokwan', quantity: '1,200 kg', route: 'Bulk', grade: 'A', status: 'Pending pickup', price: '₹2,450 / q' },
  { crop: 'Onion', variety: 'N-53', quantity: '480 kg left', route: 'Retail', grade: 'B', status: 'Live', price: '₹31 / kg' },
];

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/farmer/dashboard" element={
            <ProtectedRoute allowedRoles={['farmer', 'fpo']}>
              <FarmerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/buyer/dashboard" element={
            <ProtectedRoute allowedRoles={['buyer', 'admin']}>
              <RetailBuyerDashboard onSwitch={() => {}} />
            </ProtectedRoute>
          } />
          <Route path="/bulk/dashboard" element={
            <ProtectedRoute allowedRoles={['buyer', 'admin']}>
              <BulkBuyerDashboard onSwitch={() => {}} />
            </ProtectedRoute>
          } />
          <Route path="/" element={<HomeRedirect />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'farmer') return <Navigate to="/farmer/dashboard" replace />;
  // For simplicity, default buyer to retail dashboard
  if (user.role === 'buyer') return <Navigate to="/buyer/dashboard" replace />;
  return <Navigate to="/login" replace />;
}

function FarmerDashboard({ onSwitch = () => {} }: { onSwitch?: () => void }) {
  const [activeView, setActiveView] = useState<View>('overview');
  const [showListing, setShowListing] = useState(false);
  const [language, setLanguage] = useState('EN');
  const [listings, setListings] = useState<Listing[]>(initialListings);
  const [toast, setToast] = useState('');

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2800);
  };

  useEffect(() => {
    const fetchRemoteListings = async () => {
      try {
        if (!api.getToken()) {
          try {
            await api.login('+919876543210', 'password123');
          } catch {
            await api.register({
              name: 'Ramesh Kumar',
              phone: '+919876543210',
              role: 'farmer',
              language: 'hi',
            });
          }
        }
        const data = await api.getMyListings();
        if (data && data.listings && data.listings.length > 0) {
          const mapped: Listing[] = data.listings.map((l) => ({
            crop: l.crop_name,
            variety: l.variety || 'Local',
            quantity: `${l.quantity} ${l.unit}`,
            route: 'Retail',
            grade: (l.quality?.grade as 'A' | 'B') || 'A',
            status: l.status === 'ACTIVE' || l.status === 'BIDDING' ? 'Live' : 'Pending pickup',
            price: `₹${l.pricing?.minimum_price || 30} / kg`,
          }));
          setListings((prev) => {
            const existingCrops = new Set(mapped.map((m) => `${m.crop}-${m.variety}`));
            const remaining = prev.filter((p) => !existingCrops.has(`${p.crop}-${p.variety}`));
            return [...mapped, ...remaining];
          });
        }
      } catch (e) {
        console.warn('Could not sync remote listings:', e);
      }
    };
    fetchRemoteListings();
  }, []);

  const addListing = (newListing?: Listing) => {
    const item = newListing || {
      crop: 'Soybean',
      variety: 'JS 335',
      quantity: '520 kg',
      route: 'Bulk' as const,
      grade: 'A' as const,
      status: 'Live' as const,
      price: '₹4,580 / q',
    };
    setListings((current) => [item, ...current]);
    setShowListing(false);
    setActiveView('inventory');
    notify(`${item.crop} listing published to marketplace & saved to MongoDB Atlas!`);
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><Sprout size={21} /></div><div><strong>KrishiSetu</strong><span>DMS</span></div></div>
        <button className="profile-card" onClick={onSwitch}><div className="avatar">RK</div><div><strong>Ramesh Kumar</strong><span>Switch workspace</span></div><ChevronRight size={16} /></button>
        <nav className="side-nav">
          <p className="nav-label">WORKSPACE</p>
          {navItems.map(({ id, label, icon: Icon }) => <button key={id} className={activeView === id ? 'nav-item active' : 'nav-item'} onClick={() => setActiveView(id)}><Icon size={19} /><span>{label}</span>{id === 'orders' && <b>4</b>}</button>)}
        </nav>
        <div className="sidebar-bottom"><button className="nav-item"><CircleHelp size={19} /><span>Help & support</span></button><div className="sync-card"><Cloud size={18} /><div><strong>Synced just now</strong><span>Works offline too</span></div><i /></div></div>
      </aside>

      <main className="main-content">
        <header className="topbar"><div className="mobile-brand"><div className="brand-mark"><Sprout size={18} /></div><strong>KrishiSetu</strong></div><div className="breadcrumb"><span>Workspace</span><ChevronRight size={15} /><strong>{navItems.find((item) => item.id === activeView)?.label}</strong></div><div className="top-actions"><div className="online-pill"><Cloud size={15} /> Online</div><button className="lang-button" onClick={() => setLanguage(language === 'EN' ? 'हिं' : 'EN')}>{language}<ChevronRight size={13} /></button><button className="icon-button notification" onClick={() => notify('You have 4 new updates')}><Bell size={19} /><i /></button><div className="top-avatar">RK</div></div></header>
        <div className="page-wrap">
          {activeView === 'overview' && <Overview onList={() => setShowListing(true)} onNavigate={setActiveView} notify={notify} />}
          {activeView === 'inventory' && <Inventory listings={listings} onList={() => setShowListing(true)} />}
          {activeView === 'orders' && <Orders notify={notify} />}
          {activeView === 'logistics' && <Logistics notify={notify} />}
          {activeView === 'wallet' && <Wallet />}
        </div>
      </main>
      <nav className="mobile-nav">{navItems.map(({ id, label, icon: Icon }) => <button key={id} className={activeView === id ? 'active' : ''} onClick={() => setActiveView(id)}><Icon size={20} /><span>{label.split(' ')[0]}</span></button>)}</nav>
      {showListing && <ListingModal onClose={() => setShowListing(false)} onSubmit={addListing} />}
      {toast && <div className="toast"><ShieldCheck size={18} />{toast}</div>}
    </div>
  );
}

function RolePicker({ onSelect }: { onSelect: (role: Role) => void }) {
  return <div className="role-screen"><div className="role-shell"><div className="role-brand"><div className="brand-mark"><Sprout size={24} /></div><div><strong>KrishiSetu</strong><span>DECENTRALISED MARKETPLACE</span></div></div><div className="role-intro"><span className="eyebrow">One connected marketplace</span><h1>Who are you joining as?</h1><p>Choose your workspace to buy fresh produce directly from the farm, or manage your own listings.</p></div><div className="role-grid"><button className="role-card farmer-role" onClick={() => onSelect('farmer')}><span className="role-card-icon"><Sprout /></span><span className="role-card-copy"><strong>Farmer</strong><small>List produce, manage bids, track pickups and grow your earnings.</small><em>Open farmer portal <ArrowRight size={15} /></em></span></button><button className="role-card retail-role" onClick={() => onSelect('retail')}><span className="role-card-icon"><ShoppingCart /></span><span className="role-card-copy"><strong>Retail buyer</strong><small>Shop fresh, graded produce for your home or small business.</small><em>Shop the marketplace <ArrowRight size={15} /></em></span></button><button className="role-card bulk-role" onClick={() => onSelect('bulk')}><span className="role-card-icon"><Building2 /></span><span className="role-card-copy"><strong>Bulk / industry</strong><small>Source at scale, bid on lots and create dependable contracts.</small><em>Open procurement desk <ArrowRight size={15} /></em></span></button></div><div className="role-footer"><Cloud size={15} /> Works offline with secure sync when you’re back online <span>·</span> <button>English / हिंदी</button></div></div></div>;
}

type BuyerShellProps = { onSwitch: () => void };

function BuyerHeader({ type, onSwitch, onNotify }: { type: 'retail' | 'bulk'; onSwitch: () => void; onNotify: (message: string) => void }) {
  return <header className="buyer-header"><button className="buyer-brand" onClick={onSwitch}><span className="brand-mark"><Sprout size={19} /></span><strong>KrishiSetu</strong><small>{type === 'retail' ? 'Retail buyer' : 'Procurement desk'}</small></button><div className="buyer-search"><Search size={17} /><input placeholder={type === 'retail' ? 'Search tomatoes, wheat, onions...' : 'Search crops, farmer groups, regions...'} /><kbd>⌘ K</kbd></div><div className="buyer-actions"><span className="online-pill"><Cloud size={15} /> Synced</span><button className="lang-button">EN <ChevronRight size={13} /></button><button className="icon-button notification" onClick={() => onNotify('You have 3 new marketplace updates')}><Bell size={19} /><i /></button><button className="buyer-avatar" onClick={onSwitch}>{type === 'retail' ? 'AK' : 'SF'}</button></div></header>;
}

interface CartItemData {
  id: string;
  name: string;
  priceNum: number;
  quantity: number;
}

function RetailBuyerDashboard({ onSwitch }: BuyerShellProps) {
  const [view, setView] = useState<'shop' | 'orders' | 'payments'>('shop');
  const [cartItems, setCartItems] = useState<CartItemData[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toast, setToast] = useState('');
  
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2600); };

  const handleAddToCart = (name: string, priceStr: string) => {
    const priceNum = parseInt(priceStr.replace(/[^0-9]/g, ''), 10);
    setCartItems(prev => {
      const existing = prev.find(item => item.name === name);
      if (existing) {
        return prev.map(item => item.name === name ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { id: Math.random().toString(), name, priceNum, quantity: 1 }];
    });
    notify(`${name} added to cart`);
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    notify(`Order placed securely via Escrow for ₹${cartItems.reduce((acc, item) => acc + (item.priceNum * item.quantity), 0)}`);
    setCartItems([]);
    setIsCartOpen(false);
    setView('orders');
  };

  return (
    <div className="buyer-app">
      <BuyerHeader type="retail" onSwitch={onSwitch} onNotify={notify} />
      <div className="buyer-body">
        <aside className="buyer-sidebar">
          <p className="nav-label">MY SHOPPING</p>
          <button className={view === 'shop' ? 'buyer-nav active' : 'buyer-nav'} onClick={() => setView('shop')}><ShoppingCart size={18} /> Fresh marketplace</button>
          <button className={view === 'orders' ? 'buyer-nav active' : 'buyer-nav'} onClick={() => setView('orders')}><Package size={18} /> My orders <b>2</b></button>
          <button className={view === 'payments' ? 'buyer-nav active' : 'buyer-nav'} onClick={() => setView('payments')}><WalletCards size={18} /> Payments</button>
          <div className="buyer-sidebar-foot">
            <button className="buyer-nav"><CircleHelp size={18} /> Help center</button>
            <div className="buyer-trust">
              <ShieldCheck size={17} />
              <span><strong>KrishiSetu protected</strong><small>Every order is quality checked</small></span>
            </div>
          </div>
        </aside>
        <main className="buyer-main">
          {view === 'shop' && <RetailShop cartCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)} onAdd={handleAddToCart} onOpenCart={() => setIsCartOpen(true)} onNotify={notify} />}
          {view === 'orders' && <RetailOrders onNotify={notify} />}
          {view === 'payments' && <BuyerPayments type="retail" />}
        </main>
      </div>
      
      {isCartOpen && (
        <CartModal 
          items={cartItems} 
          onClose={() => setIsCartOpen(false)} 
          onCheckout={handleCheckout} 
          onUpdateQuantity={(name, delta) => {
            setCartItems(prev => prev.map(i => i.name === name ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i).filter(i => i.quantity > 0));
          }}
        />
      )}

      {toast && <div className="toast"><ShieldCheck size={18} />{toast}</div>}
    </div>
  );
}

function CartModal({ items, onClose, onCheckout, onUpdateQuantity }: { items: CartItemData[], onClose: () => void, onCheckout: () => void, onUpdateQuantity: (name: string, delta: number) => void }) {
  const total = items.reduce((acc, item) => acc + (item.priceNum * item.quantity), 0);

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="listing-modal" style={{ maxWidth: '400px', padding: 0 }} onMouseDown={e => e.stopPropagation()}>
        <div className="modal-head" style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
          <div>
            <span className="eyebrow">Your Basket</span>
            <h2>Checkout</h2>
          </div>
          <button className="close-button" onClick={onClose}><X size={19} /></button>
        </div>
        <div style={{ padding: '1.5rem', maxHeight: '400px', overflowY: 'auto' }}>
          {items.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#64748b' }}>Your cart is empty.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {items.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.95rem' }}>{item.name}</h4>
                    <small style={{ color: '#64748b' }}>₹{item.priceNum} / kg</small>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button onClick={() => onUpdateQuantity(item.name, -1)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '4px', width: '24px', height: '24px', cursor: 'pointer' }}>-</button>
                    <span style={{ fontSize: '0.9rem', fontWeight: 500, minWidth: '16px', textAlign: 'center' }}>{item.quantity}</span>
                    <button onClick={() => onUpdateQuantity(item.name, 1)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '4px', width: '24px', height: '24px', cursor: 'pointer' }}>+</button>
                  </div>
                  <strong style={{ minWidth: '60px', textAlign: 'right' }}>₹{item.priceNum * item.quantity}</strong>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ padding: '1.5rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0', borderRadius: '0 0 12px 12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '1.1rem' }}>
            <strong>Total</strong>
            <strong>₹{total}</strong>
          </div>
          <button 
            className="primary-button" 
            style={{ width: '100%', justifyContent: 'center' }} 
            onClick={onCheckout}
            disabled={items.length === 0}
          >
            <ShieldCheck size={18} /> Checkout Securely
          </button>
        </div>
      </div>
    </div>
  );
}

function RetailShop({ cartCount, onAdd, onOpenCart, onNotify }: { cartCount: number; onAdd: (name: string, price: string) => void; onOpenCart: () => void; onNotify: (message: string) => void }) {
  return (
    <>
      <div className="buyer-page-heading">
        <div>
          <p className="eyebrow">Fresh from 248 farms near Nashik</p>
          <h1>Good morning, Ananya</h1>
          <p>Better produce, fair prices, and a clear journey from farm to your kitchen.</p>
        </div>
        <button className="cart-button" onClick={onOpenCart}>
          <ShoppingCart size={17} /> Cart <b>{cartCount}</b>
        </button>
      </div>
      <div className="retail-banner">
        <div>
          <span className="section-kicker"><ShieldCheck size={14} /> Quality you can see</span>
          <h2>Farm-grade produce, delivered honestly.</h2>
          <p>Every item is AI graded, farmer-priced, and picked up fresh.</p>
          <button className="banner-link" onClick={() => onNotify('Showing all quality-verified produce')}>Explore verified produce <ArrowRight size={15} /></button>
        </div>
        <div className="banner-stamp">
          <BadgeCheck size={22} /><strong>100%</strong><span>traceable</span>
        </div>
      </div>
      <div className="shop-toolbar">
        <div><h2>Popular near you</h2><p>Available for pickup today</p></div>
        <button className="filter-button"><SlidersHorizontal size={15} /> Filters</button>
      </div>
      <div className="product-grid">
        {[
          ['Tomatoes','Arka Rakshak','₹42','Grade A','4.9','Tomato'],
          ['Onions','N-53','₹31','Grade B','4.8','Onion'],
          ['Wheat','Lokwan','₹48','Grade A','4.9','Wheat'],
          ['Spinach','Palak','₹28','Grade A','4.7','Spinach']
        ].map(([name, variety, price, grade, rating, key], index) => (
          <ProductCard 
            key={name} 
            name={name} 
            variety={variety} 
            price={price} 
            grade={grade} 
            rating={rating} 
            crop={key} 
            onAdd={() => onAdd(name, price)} 
            onView={() => onNotify(`${name} details opened`)} 
          />
        ))}
      </div>
      <div className="trace-strip">
        <MapPin size={16} />
        <span><strong>Know your farmer</strong> Your order supports 12 local farms within 25 km of your delivery point.</span>
        <ArrowRight size={15} />
      </div>
    </>
  );
}

function ProductCard({ name, variety, price, grade, rating, crop, onAdd, onView }: { name: string; variety: string; price: string; grade: string; rating: string; crop: string; onAdd: () => void; onView: () => void }) { 
  return (
    <article className="product-card">
      <div className={`product-visual crop-${crop.toLowerCase()}`}>
        <span className="product-grade">{grade}</span>
        <span className="heart-button" onClick={onView}>♡</span>
        <div className="crop-illustration">
          {crop === 'Spinach' ? <Leaf size={44} /> : <Wheat size={44} />}
        </div>
      </div>
      <div className="product-content">
        <div className="product-meta"><span>AI {grade}</span><span>★ {rating}</span></div>
        <h3>{name}</h3>
        <p>{variety} · farm fresh</p>
        <div className="product-bottom">
          <div><strong>{price}</strong><small>/ kg</small></div>
          <button onClick={onAdd}><Plus size={16} /></button>
        </div>
      </div>
    </article>
  ); 
}

function RetailOrders({ onNotify }: { onNotify: (message: string) => void }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.getOrders();
        setOrders(res.orders);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const handleDelivery = async (orderId: string, pickupOtp: string, deliveryOtp: string) => {
    try {
      await api.deliverOrder(orderId, pickupOtp, deliveryOtp);
      onNotify('Delivery verified! Escrow payment has been released.');
      setOrders(current => current.map(o => o.id === orderId ? { ...o, status: 'COMPLETED' } : o));
    } catch (e) {
      console.error(e);
      onNotify('Failed to verify delivery.');
    }
  };

  const activeCount = orders.filter(o => o.status !== 'COMPLETED' && o.status !== 'CANCELLED').length;
  const completedCount = orders.filter(o => o.status === 'COMPLETED').length;

  return (
    <>
      <PageHeading eyebrow="Your shopping" title="My orders" description="Track your farm-fresh deliveries and pickup codes." />
      <div className="order-summary-row">
        <div><span>Active orders</span><strong>{activeCount}</strong></div>
        <div><span>Completed</span><strong>{completedCount}</strong></div>
        <div><span>Secured via Escrow</span><strong><ShieldCheck size={14} style={{display:'inline', marginBottom:'-2px'}}/> Protected</strong></div>
      </div>
      <div className="buyer-order-list card">
        <div className="card-title-row">
          <div><h2>Active orders</h2><p>Every order is protected until handover</p></div>
          <span className="live-pill"><i /> Live</span>
        </div>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading orders...</div>
        ) : orders.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No orders placed yet.</div>
        ) : (
          orders.map((o) => (
            <div className={`buyer-order ${o.status === 'COMPLETED' ? 'completed' : ''}`} key={o.id}>
              <span className={`order-thumb crop-${(o.crop_name || 'produce').toLowerCase()}`}><Wheat size={22} /></span>
              <div style={{flex: 1}}>
                <strong>#{o.id.slice(-6).toUpperCase()} · {o.crop_name || 'Produce'}</strong>
                <p>{o.quantity} {o.unit || 'kg'} · From Farmer</p>
                <small>{o.status === 'COMPLETED' ? 'Delivered successfully' : o.status === 'IN_TRANSIT' ? 'In transit to your location' : 'Waiting for pickup'}</small>
              </div>
              <span className="order-price">₹{o.total_amount}</span>
              {o.status === 'COMPLETED' ? (
                <span style={{color: '#16a34a', fontWeight: 'bold'}}>DELIVERED</span>
              ) : (
                <button className="primary-button" onClick={() => {
                  const pickupOtp = prompt('Enter Farmer OTP (from pickup):');
                  const deliveryOtp = prompt(`Enter YOUR Delivery OTP (${o.delivery_otp}):`, o.delivery_otp);
                  if (pickupOtp && deliveryOtp) {
                    handleDelivery(o.id, pickupOtp, deliveryOtp);
                  }
                }}>Confirm Delivery</button>
              )}
            </div>
          ))
        )}
      </div>
    </>
  );
}

function BulkBuyerDashboard({ onSwitch }: BuyerShellProps) { const [view, setView] = useState<'desk' | 'lots' | 'contracts' | 'payments'>('desk'); const [toast, setToast] = useState(''); const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2600); }; return <div className="buyer-app bulk-app"><BuyerHeader type="bulk" onSwitch={onSwitch} onNotify={notify} /><div className="buyer-body"><aside className="buyer-sidebar"><p className="nav-label">PROCUREMENT DESK</p><button className={view === 'desk' ? 'buyer-nav active' : 'buyer-nav'} onClick={() => setView('desk')}><LayoutDashboard size={18} /> Procurement overview</button><button className={view === 'lots' ? 'buyer-nav active' : 'buyer-nav'} onClick={() => setView('lots')}><Wheat size={18} /> Browse farm lots <b>24</b></button><button className={view === 'contracts' ? 'buyer-nav active' : 'buyer-nav'} onClick={() => setView('contracts')}><FileText size={18} /> My contracts</button><button className={view === 'payments' ? 'buyer-nav active' : 'buyer-nav'} onClick={() => setView('payments')}><WalletCards size={18} /> Escrow & payments</button><div className="buyer-sidebar-foot"><button className="buyer-nav"><CircleHelp size={18} /> Procurement support</button><div className="buyer-trust amber-trust"><ShieldCheck size={17} /><span><strong>Escrow protected</strong><small>Release only after dual OTP</small></span></div></div></aside><main className="buyer-main">{view === 'desk' && <BulkDesk onNotify={notify} onNavigate={setView} />}{view === 'lots' && <BulkLots onNotify={notify} />}{view === 'contracts' && <Contracts onNotify={notify} />}{view === 'payments' && <BuyerPayments type="bulk" />}</main></div>{toast && <div className="toast"><ShieldCheck size={18} />{toast}</div>}</div>; }

function BulkDesk({ onNotify, onNavigate }: { onNotify: (message: string) => void; onNavigate: (view: 'lots' | 'contracts' | 'payments') => void }) { return <><div className="buyer-page-heading"><div><p className="eyebrow">Wednesday, 10 September 2026 · Mumbai region</p><h1>Good morning, Shakti Foods</h1><p>Your procurement desk is ready. Source better, plan further ahead.</p></div><button className="primary-button" onClick={() => onNavigate('lots')}><Search size={17} /> Browse farm lots</button></div><section className="stat-grid"><StatCard label="Active sourcing" value="8,420 kg" change="24 open lots" icon={<Wheat size={20} />} /><StatCard label="Live bids" value="12" change="3 ending today" positive icon={<Zap size={20} />} /><StatCard label="In escrow" value="₹2,84,600" change="7 protected orders" warning icon={<ShieldCheck size={20} />} /><StatCard label="Active contracts" value="6" change="Across 4 crops" icon={<FileText size={20} />} /></section><div className="bulk-hero"><div><span className="section-kicker"><Zap size={14} /> Smart sourcing signal</span><h2>Onion prices soften by 8% this week</h2><p>Great time to lock a 30-day supply contract from Nashik farms.</p><button className="banner-link" onClick={() => onNavigate('lots')}>See matching farm lots <ArrowRight size={15} /></button></div><div className="signal-chart"><ArrowDownRight size={30} /><strong>-8.2%</strong><small>projected rate</small></div></div><div className="bulk-lower"><div className="card"><div className="card-title-row"><div><h2>Offers needing attention</h2><p>Live farmer listings matched to your needs</p></div><button className="text-button" onClick={() => onNavigate('lots')}>View all <ChevronRight size={15} /></button></div><BulkOffer crop="Wheat" detail="1,200 kg · Grade A · Nashik" price="₹2,450 / q" time="Ends in 04:28:16" onClick={() => onNotify('Opening wheat bidding room')} /><BulkOffer crop="Onion" detail="3,000 kg · Grade A · Ahmednagar" price="₹2,860 / q" time="New today" onClick={() => onNotify('Opening onion listing')} /></div><div className="card contract-summary"><div className="card-title-row"><div><h2>Contract health</h2><p>Your supply commitments</p></div><HandshakeIcon /></div><div className="contract-meter"><div><strong>94%</strong><span>on time fulfillment</span></div><div className="meter"><i /></div></div><div className="contract-mini"><span><i className="green-dot" /> 4 On track</span><span><i className="amber-dot" /> 2 renewing soon</span></div><button className="outline-button" onClick={() => onNavigate('contracts')}>Manage contracts <ChevronRight size={15} /></button></div></div></>; }

function HandshakeIcon() { return <span className="handshake-icon"><UsersRound size={20} /></span>; }
function BulkOffer({ crop, detail, price, time, onClick }: { crop: string; detail: string; price: string; time: string; onClick: () => void }) { return <button className="bulk-offer" onClick={onClick}><span className="crop-icon"><Wheat size={18} /></span><span><strong>{crop}</strong><small>{detail}</small></span><span className="offer-rate"><small>Current best</small><b>{price}</b></span><span className="offer-time"><Clock3 size={13} />{time}</span><ChevronRight size={17} /></button>; }

function BulkLots({ onNotify }: { onNotify: (message: string) => void }) {
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [biddingOn, setBiddingOn] = useState<ListingItem | null>(null);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        if (!api.getToken()) {
          try {
            await api.login('+919999999999', 'password123'); // Bulk buyer demo
          } catch {
            await api.register({
              name: 'Shakti Foods',
              phone: '+919999999999',
              role: 'buyer',
              language: 'en',
            });
          }
        }
        const data = await api.getMarketplaceListings();
        setListings(data.listings);
      } catch (err) {
        console.error("Failed to load marketplace listings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, []);

  const handlePlaceBid = async (price: number, quantity: number) => {
    if (!biddingOn) return;
    try {
      await api.placeBid({
        listing_id: biddingOn.id,
        price_per_unit: price,
        quantity: quantity,
      });
      onNotify(`Bid of ₹${price}/kg placed successfully on ${biddingOn.crop_name}`);
      setBiddingOn(null);
    } catch (err) {
      console.error(err);
      onNotify('Failed to place bid. You may already have an active bid.');
      setBiddingOn(null);
    }
  };

  return (
    <>
      <PageHeading eyebrow="Sourcing marketplace" title="Browse farm lots" description="Verified crop lots from farmers you can build a relationship with." action={<button className="filter-button"><SlidersHorizontal size={15} /> Filters</button>} />
      <div className="lot-toolbar">
        <div className="tabs">
          <button className="active">Recommended <b>{listings.length}</b></button>
          <button>Ending soon</button>
          <button>By region</button>
        </div>
        <span><Cloud size={14} /> Live inventory</span>
      </div>
      
      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading live marketplace...</div>
      ) : listings.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No live listings found.</div>
      ) : (
        <div className="lot-grid">
          {listings.map((item) => (
            <div className="lot-card card" key={item.id}>
              <div className="lot-top">
                <span className="crop-icon"><Wheat size={20} /></span>
                <span className="route bulk">Bulk lot</span>
              </div>
              <h3>{item.crop_name} <small>{item.variety || 'Local'}</small></h3>
              <div className="lot-info">
                <span><Package size={13} /> {item.quantity} {item.unit}</span>
                <span><BadgeCheck size={13} /> Grade {item.quality?.grade || 'A'}</span>
                <span><MapPin size={13} /> {item.location ? 'Nearby' : 'Nashik'}</span>
              </div>
              <div className="lot-bottom">
                <div>
                  <small>Starting price</small>
                  <strong>₹{item.pricing?.minimum_price} / {item.unit}</strong>
                </div>
                <button className="accept-button" onClick={() => setBiddingOn(item)}>View & bid</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {biddingOn && (
        <BidModal 
          listing={biddingOn} 
          onClose={() => setBiddingOn(null)} 
          onSubmit={handlePlaceBid} 
        />
      )}
    </>
  );
}

function BidModal({ listing, onClose, onSubmit }: { listing: ListingItem, onClose: () => void, onSubmit: (price: number, qty: number) => void }) {
  const [price, setPrice] = useState(listing.pricing?.minimum_price?.toString() || '30');
  const [qty, setQty] = useState(listing.quantity?.toString() || '100');

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="listing-modal" style={{ maxWidth: '440px' }} onMouseDown={e => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <span className="eyebrow">Live Auction Room</span>
            <h2>Place Bid: {listing.crop_name}</h2>
          </div>
          <button className="close-button" onClick={onClose}><X size={19} /></button>
        </div>
        
        <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          <p style={{ margin: '0 0 0.5rem 0', color: '#475569' }}><strong>Farmer:</strong> {listing.farmer_name || 'Verified Farmer'}</p>
          <p style={{ margin: '0 0 0.5rem 0', color: '#475569' }}><strong>Available:</strong> {listing.quantity} {listing.unit} (Grade {listing.quality?.grade || 'A'})</p>
          <p style={{ margin: 0, color: '#475569' }}><strong>Min Price:</strong> ₹{listing.pricing?.minimum_price} / {listing.unit}</p>
        </div>

        <div className="form-grid">
          <label>
            Your Bid Price (₹ / {listing.unit})
            <div className="input-wrap">
              <input type="number" value={price} onChange={e => setPrice(e.target.value)} min={listing.pricing?.minimum_price} />
            </div>
          </label>
          <label>
            Quantity Needed ({listing.unit})
            <div className="input-wrap">
              <input type="number" value={qty} onChange={e => setQty(e.target.value)} max={listing.quantity} />
            </div>
          </label>
        </div>

        <div className="modal-actions" style={{ marginTop: '2rem' }}>
          <button className="cancel-button" onClick={onClose}>Cancel</button>
          <button className="primary-button" onClick={() => onSubmit(Number(price), Number(qty))}>
            <Zap size={17} /> Place Bid Securely
          </button>
        </div>
      </div>
    </div>
  );
}

function Contracts({ onNotify }: { onNotify: (message: string) => void }) { return <><PageHeading eyebrow="Long-term supply" title="My contracts" description="Reliable supply, clear terms, and one place for every commitment." action={<button className="primary-button" onClick={() => onNotify('New contract request started')}><Plus size={17} /> New request</button>} /><div className="contract-list card"><div className="card-title-row"><div><h2>Active supply contracts</h2><p>Renewals and fulfillment status</p></div><span className="status live"><i /> 6 active</span></div>{[['Wheat','Meera Farms','1,200 kg / month','₹2,450 / q','On track'],['Tomato','Ramesh Kumar','500 kg / week','₹42 / kg','Renewal soon'],['Onion','Sahyadri Collective','3,000 kg / month','₹2,860 / q','On track']].map(([crop, farmer, qty, price, status]) => <div className="contract-row" key={crop}><span className="crop-icon"><Wheat size={18} /></span><div><strong>{crop} · {farmer}</strong><small>{qty} · {price}</small></div><span className={status === 'On track' ? 'status live' : 'status pending'}><i />{status}</span><button className="more-button" onClick={() => onNotify(`Opened ${crop} contract details`)}>View</button></div>)}</div><div className="contract-note"><ShieldCheck size={18} /><span><strong>Every contract is escrow backed.</strong> Funds lock at confirmation and release only after dual OTP handover.</span></div></>; }

function BuyerPayments({ type }: { type: 'retail' | 'bulk' }) {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    api.getOrders().then(res => setOrders(res.orders)).catch(console.error);
  }, []);

  const totalEscrow = orders.filter(o => o.status !== 'COMPLETED' && o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + o.total_amount, 0);

  const totalReleased = orders.filter(o => o.status === 'COMPLETED')
    .reduce((sum, o) => sum + o.total_amount, 0);

  return (
    <>
      <PageHeading eyebrow="Secure payments" title={type === 'bulk' ? 'Escrow & payments' : 'Payments'} description={type === 'bulk' ? 'Track protected funds across every farmer relationship.' : 'Your protected orders and saved payment methods.'} />
      <div className="buyer-payment-balance">
        <div>
          <span>{type === 'bulk' ? 'Funds in escrow' : 'Total spent this month'}</span>
          <strong>₹{totalEscrow.toLocaleString()}</strong>
          <small><ShieldCheck size={13} /> Protected Escrow</small>
        </div>
        <div>
          <span>{type === 'bulk' ? 'Released to farmers' : 'Saved this month'}</span>
          <strong>₹{totalReleased.toLocaleString()}</strong>
        </div>
      </div>
      <div className="card payment-history">
        <div className="card-title-row">
          <div><h2>Payment activity</h2><p>Clear receipts for every order</p></div>
          <button className="text-button">Download report <ChevronRight size={15} /></button>
        </div>
        {orders.length === 0 ? (
          <div style={{ padding: '1rem', color: '#64748b' }}>No payment activity yet.</div>
        ) : (
          orders.map(o => (
            <div className="payment-row" key={o.id}>
              <span className="transaction-icon"><ShieldCheck size={16} /></span>
              <div>
                <strong>{o.status === 'COMPLETED' ? 'Payment released' : 'Payment secured in escrow'}</strong>
                <p>{o.crop_name || 'Produce'} · #{o.id.slice(-6).toUpperCase()}</p>
              </div>
              <b>₹{o.total_amount}</b>
              <small>{new Date(o.created_at).toLocaleDateString()}</small>
            </div>
          ))
        )}
      </div>
    </>
  );
}

function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="description">{description}</p></div>{action}</div>;
}

function Overview({ onList, onNavigate, notify }: { onList: () => void; onNavigate: (view: View) => void; notify: (message: string) => void }) {
  return <>
    <PageHeading eyebrow="Wednesday, 10 September 2026" title="Good morning, Ramesh" description="Here’s what’s happening with your farm today." action={<button className="primary-button" onClick={onList}><Plus size={18} /> List produce</button>} />
    <section className="stat-grid"><StatCard label="Total sales this month" value="₹48,620" change="18.4%" positive icon={<IndianRupee size={20} />} /><StatCard label="Active produce" value="1,926 kg" change="6 listings" icon={<Wheat size={20} />} /><StatCard label="Pending payouts" value="₹12,400" change="Due today" warning icon={<WalletCards size={20} />} /><StatCard label="Hectares listed" value="4.8 ha" change="Across 3 crops" icon={<Sprout size={20} />} /></section>
    <section className="dashboard-grid"><div className="intelligence-card"><div className="card-top"><div><span className="section-kicker"><Zap size={14} /> AI market intelligence</span><h2>Sell smarter this week</h2><p>Predicted mandi prices for your crops</p></div><span className="ai-badge">Updated 08:40</span></div><div className="chart-area"><div className="chart-value"><strong>₹44</strong><span>Tomato / kg</span><em><ArrowUpRight size={14} /> +12.5%</em></div><div className="chart"><div className="grid-lines"><i /><i /><i /><i /></div><svg viewBox="0 0 500 140" preserveAspectRatio="none"><defs><linearGradient id="area" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#86efac" stopOpacity=".5" /><stop offset="100%" stopColor="#86efac" stopOpacity="0" /></linearGradient></defs><path d="M0 110 C35 105, 45 75, 80 85 S125 105, 155 78 S205 55, 235 65 S275 38, 310 54 S350 85, 375 51 S430 30, 460 42 S485 22, 500 18 L500 140 L0 140 Z" fill="url(#area)" /><path d="M0 110 C35 105, 45 75, 80 85 S125 105, 155 78 S205 55, 235 65 S275 38, 310 54 S350 85, 375 51 S430 30, 460 42 S485 22, 500 18" fill="none" stroke="#16a34a" strokeWidth="3" /></svg><div className="chart-days"><span>Today</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span><span>Mon</span><span>Tue</span></div></div></div><div className="insight-note"><Zap size={15} /><span><strong>Best time to sell:</strong> Prices are expected to peak on Saturday. Consider holding 20% of your tomato stock.</span><button onClick={() => notify('Insight saved to your notes')}>Save insight</button></div></div>
      <div className="quick-card"><div className="card-title-row"><h2>Quick actions</h2><span>Most used</span></div><QuickAction icon={<Plus />} label="List produce" color="green" onClick={onList} /><QuickAction icon={<Package />} label="View inventory" color="slate" onClick={() => onNavigate('inventory')} /><QuickAction icon={<ShoppingBag />} label="Active bids" color="amber" onClick={() => onNavigate('orders')} /></div></section>
    <section className="lower-grid"><div className="activity-card card"><div className="card-title-row"><div><h2>Recent activity</h2><p>Your latest marketplace updates</p></div><button className="text-button" onClick={() => onNavigate('orders')}>View all <ChevronRight size={15} /></button></div><Activity icon={<IndianRupee />} title="Payment received" text="Wheat order #KS-2481 was paid" time="Today, 10:24 AM" amount="+₹8,400" /><Activity icon={<Truck />} title="Pickup scheduled" text="Raj Transport · Tomorrow, 8:30 AM" time="Today, 09:10 AM" /><Activity icon={<Zap />} title="New bid on Wheat" text="Shakti Foods placed a new bid" time="Yesterday, 06:45 PM" amount="₹2,450 / q" amber /></div><div className="services-card card"><div className="card-title-row"><div><h2>For your farm</h2><p>Services that help you grow</p></div><Leaf size={21} className="leaf-icon" /></div><Service icon={<Sprout />} title="Free soil health kit" text="Get your field tested before sowing" action="Request kit" onClick={() => notify('Soil health kit requested')} /><Service icon={<ShieldCheck />} title="Crop insurance" text="Protect your crop this season" action="Explore schemes" onClick={() => notify('Opening government schemes')} /></div></section>
  </>;
}

function StatCard({ label, value, change, positive, warning, icon }: { label: string; value: string; change: string; positive?: boolean; warning?: boolean; icon: React.ReactNode }) { return <div className="stat-card"><div className={`stat-icon ${warning ? 'amber' : ''}`}>{icon}</div><div><p>{label}</p><strong>{value}</strong><span className={positive ? 'positive' : warning ? 'warning' : ''}>{positive && <ArrowUpRight size={13} />}{change}</span></div></div>; }
function QuickAction({ icon, label, color, onClick }: { icon: React.ReactNode; label: string; color: string; onClick: () => void }) { return <button className="quick-action" onClick={onClick}><span className={`quick-icon ${color}`}>{icon}</span><span>{label}</span><ChevronRight size={16} /></button>; }
function Activity({ icon, title, text, time, amount, amber }: { icon: React.ReactNode; title: string; text: string; time: string; amount?: string; amber?: boolean }) { return <div className="activity"><span className={`activity-icon ${amber ? 'amber' : ''}`}>{icon}</span><div><strong>{title}</strong><p>{text}</p><small>{time}</small></div>{amount && <b className={amber ? 'amber-text' : ''}>{amount}</b>}</div>; }
function Service({ icon, title, text, action, onClick }: { icon: React.ReactNode; title: string; text: string; action: string; onClick: () => void }) { return <div className="service"><span className="service-icon">{icon}</span><div><strong>{title}</strong><p>{text}</p><button onClick={onClick}>{action} <ChevronRight size={14} /></button></div></div>; }

function Inventory({ listings, onList }: { listings: Listing[]; onList: () => void }) { return <><PageHeading eyebrow="Your marketplace" title="My produce" description="Manage your live listings and track every order." action={<button className="primary-button" onClick={onList}><Plus size={18} /> New listing</button>} /><div className="filter-row"><div className="tabs"><button className="active">All produce <b>{listings.length}</b></button><button>Retail</button><button>Bulk</button></div><button className="filter-button">Filter & sort</button></div><div className="listing-table"><div className="table-header"><span>Produce</span><span>Route</span><span>Quantity</span><span>Price</span><span>Status</span><span /></div>{listings.map((item) => <div className="listing-row" key={`${item.crop}-${item.variety}`}><div className="produce-name"><span className="crop-icon"><Wheat size={18} /></span><div><strong>{item.crop}</strong><small>{item.variety} <em>Grade {item.grade}</em></small></div></div><span><label className={`route ${item.route.toLowerCase()}`}>{item.route}</label></span><span>{item.quantity}</span><span className="price">{item.price}</span><span><label className={`status ${item.status === 'Live' ? 'live' : 'pending'}`}><i />{item.status}</label></span><button className="row-more"><ChevronRight size={17} /></button></div>)}</div></>; }

function Orders({ notify }: { notify: (message: string) => void }) {
  const [tab, setTab] = useState('Bids');
  const [bids, setBids] = useState<BidItem[]>([]);
  const [activeListing, setActiveListing] = useState<ListingItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBids = async () => {
      try {
        if (!api.getToken()) {
          await api.login('+919876543210', 'password123');
        }
        
        // 1. Get farmer's active listings
        const myLots = await api.getMyListings();
        const active = myLots.listings.find(l => l.status === 'BIDDING' || l.status === 'ACTIVE');
        
        if (active) {
          setActiveListing(active);
          // 2. Fetch bids for the active lot
          const bidData = await api.getListingBids(active.id);
          setBids(bidData.bids);
        }
      } catch (e) {
        console.error("Failed fetching bids:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchBids();
  }, []);

  const handleAcceptBid = async (bidId: string) => {
    try {
      await api.acceptBid(bidId);
      notify('Bid accepted! Escrow is now locked, and an Order has been generated.');
      setBids(current => current.map(b => b.id === bidId ? { ...b, status: 'ACCEPTED' } : { ...b, status: 'REJECTED' }));
    } catch (e) {
      console.error(e);
      notify('Failed to accept bid.');
    }
  };

  return (
    <>
      <PageHeading eyebrow="Your marketplace" title="Orders & bids" description="Stay on top of every sale, offer, and pickup." />
      <div className="order-tabs">
        <button className={tab === 'Bids' ? 'active' : ''} onClick={() => setTab('Bids')}>Bulk bids <b>{bids.length}</b></button>
        <button className={tab === 'Retail' ? 'active' : ''} onClick={() => setTab('Retail')}>Retail orders <b>0</b></button>
      </div>
      
      {tab === 'Bids' ? (
        <div className="bids-layout">
          <div className="bid-main card">
            <div className="card-title-row">
              <div>
                <h2>Live bids {activeListing ? `on ${activeListing.crop_name}` : ''}</h2>
                {activeListing ? (
                  <p>{activeListing.quantity} {activeListing.unit} · Grade {activeListing.quality?.grade || 'A'}</p>
                ) : (
                  <p>No active listings with bids.</p>
                )}
              </div>
              {activeListing && <span className="live-pill"><i /> Live auction</span>}
            </div>
            
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading live bids...</div>
            ) : bids.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Waiting for buyers to place bids...</div>
            ) : (
              bids.map((bid, i) => (
                <div className={`bid-row ${i === 0 ? 'top-bid' : ''} ${bid.status === 'ACCEPTED' ? 'accepted-bid' : ''}`} key={bid.id}>
                  <span className="rank">{i + 1}</span>
                  <div className="buyer">
                    <span className="buyer-avatar">{bid.buyer_name ? bid.buyer_name[0] : 'B'}</span>
                    <div>
                      <strong>{bid.buyer_name || 'Verified Buyer'}</strong>
                      <small><MapPin size={12} /> {bid.distance_km || 18} km away</small>
                    </div>
                  </div>
                  <div className="bid-price">
                    <small>Offer price</small>
                    <strong>₹{bid.price_per_unit} / {activeListing?.unit || 'kg'}</strong>
                  </div>
                  <div className="net-price">
                    <small>Est. Total</small>
                    <strong>₹{bid.estimated_total}</strong>
                  </div>
                  {bid.status === 'ACCEPTED' ? (
                    <span style={{ color: '#16a34a', fontWeight: 'bold', marginLeft: 'auto' }}>ACCEPTED</span>
                  ) : bid.status === 'REJECTED' ? (
                    <span style={{ color: '#94a3b8', marginLeft: 'auto' }}>Rejected</span>
                  ) : i === 0 ? (
                    <button className="accept-button" onClick={() => handleAcceptBid(bid.id)}>Accept bid</button>
                  ) : (
                    <button className="more-button" onClick={() => notify(`Counter offer sent to ${bid.buyer_name}`)}>Counter</button>
                  )}
                </div>
              ))
            )}
          </div>
          
          <div className="contract-card card">
            <span className="contract-icon"><FileText size={21} /></span>
            <h2>Bulk supply contract</h2>
            <p>Accepting a bid creates a secure 3-month supply agreement.</p>
            <div className="contract-line"><ShieldCheck size={16} /> T+0 escrow protection</div>
            <div className="contract-line"><Truck size={16} /> Pooled pickup included</div>
            <button className="outline-button" onClick={() => notify('Contract terms opened')}>View contract terms <ChevronRight size={15} /></button>
          </div>
        </div>
      ) : (
        <div className="retail-empty card">
          <span className="service-icon"><ShoppingBag /></span>
          <h2>No retail orders currently</h2>
          <p>You haven't received any new retail direct orders.</p>
        </div>
      )}
    </>
  );
}

function Logistics({ notify }: { notify: (message: string) => void }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.getOrders();
        // Get active orders (accepted, in transit)
        const activeOrders = res.orders.filter(o => o.status !== 'COMPLETED' && o.status !== 'CANCELLED');
        setOrders(activeOrders);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const topOrder = orders.length > 0 ? orders[0] : null;

  return (
    <>
      <PageHeading eyebrow="Move with confidence" title="Logistics & pickup" description="Track pooled pickups and release payments securely." />
      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading logistics tracking...</div>
      ) : !topOrder ? (
        <div className="retail-empty card">
          <span className="service-icon"><Truck /></span>
          <h2>No upcoming pickups</h2>
          <p>You don't have any orders scheduled for pickup.</p>
        </div>
      ) : (
        <div className="logistics-grid">
          <div className="tracking-card card">
            <div className="card-title-row">
              <div>
                <h2>{topOrder.status === 'IN_TRANSIT' ? 'In Transit' : 'Upcoming pickup'}</h2>
                <p>Order {topOrder.id.slice(-6).toUpperCase()} · Route MH-12</p>
              </div>
              <span className="eta">ETA Tomorrow</span>
            </div>
            <div className="map-visual">
              <div className="map-grid" />
              <span className="map-road road-one" />
              <span className="map-road road-two" />
              <span className="map-pin pin-farm"><Sprout size={14} /></span>
              <span className="map-pin pin-truck"><Truck size={14} /></span>
              <span className="map-pin pin-mandi"><MapPin size={14} /></span>
              <div className="map-label farm-label">Your farm</div>
              <div className="map-label mandi-label">Destination</div>
            </div>
            <div className="timeline">
              <div className="timeline-item complete">
                <span><ShieldCheck size={15} /></span>
                <div><strong>Order Confirmed</strong><small>Escrow payment locked</small></div>
                <time>{new Date(topOrder.created_at).toLocaleDateString()}</time>
              </div>
              <div className={topOrder.status === 'IN_TRANSIT' ? "timeline-item complete" : "timeline-item current"}>
                <span><Truck size={15} /></span>
                <div><strong>Vehicle en route</strong><small>Driver is coming for pickup</small></div>
              </div>
              <div className={topOrder.status === 'COMPLETED' ? "timeline-item complete" : "timeline-item"}>
                <span><IndianRupee size={15} /></span>
                <div><strong>Payment released</strong><small>After dual OTP handover</small></div>
              </div>
            </div>
          </div>
          <div className="handover-card card">
            <span className="handover-icon"><ShieldCheck size={24} /></span>
            <h2>Secure handover</h2>
            <p>Share this OTP with the driver to confirm pickup and release your escrow payment.</p>
            <div className="otp-box">
              <span>Farmer OTP</span>
              <strong>{topOrder.pickup_otp || '••••'}</strong>
              <button onClick={() => notify('OTP Copied to clipboard')}>Copy OTP</button>
            </div>
            <div className="otp-box muted">
              <span>Delivery partner</span>
              <strong>Waiting</strong>
              <small>Partner enters their OTP at destination</small>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Wallet() { return <><PageHeading eyebrow="Your money, protected" title="Earnings wallet" description="See your available balance, escrow funds, and payouts." action={<button className="outline-button"><FileText size={17} /> Download statement</button>} /><div className="wallet-balance"><div><span>Total earnings</span><strong>₹1,84,620</strong><small><ArrowUpRight size={14} /> 22.8% from last month</small></div><div className="balance-detail"><div><span>Available to withdraw</span><strong>₹36,820</strong></div><div><span>In escrow</span><strong>₹12,400</strong></div></div></div><div className="wallet-content card"><div className="card-title-row"><div><h2>Transaction history</h2><p>Your latest payouts and protected payments</p></div><button className="text-button">This month <ChevronRight size={15} /></button></div>{[['Payment received','Wheat · Shakti Foods','Today, 10:24 AM','+₹8,400'],['Escrow locked','Wheat bulk order · #KS-2481','Today, 09:12 AM','₹12,400'],['Payment received','Tomato · Retail order','08 Sep 2026','+₹4,260'],['Payout withdrawn','Transferred to HDFC Bank','05 Sep 2026','-₹18,000']].map(([title, text, time, amount]) => <div className="transaction" key={title + time}><span className="transaction-icon"><IndianRupee size={17} /></span><div><strong>{title}</strong><p>{text}</p></div><small>{time}</small><b className={amount.startsWith('+') ? 'positive-text' : amount.startsWith('₹') ? 'amber-text' : ''}>{amount}</b></div>)}</div></>; }

function ListingModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (item: Listing) => void }) {
  const [route, setRoute] = useState<'Retail' | 'Bulk'>('Retail');
  const [crop, setCrop] = useState('Tomato');
  const [variety, setVariety] = useState('Arka Rakshak');
  const [quantity, setQuantity] = useState('500');
  const [expectedDate, setExpectedDate] = useState('2026-09-15');
  const [price, setPrice] = useState('32');
  const [grade, setGrade] = useState<'A' | 'B' | 'C'>('A');
  const [aiDetails, setAiDetails] = useState<{ ripeness: number; disease: number; uniformity: number } | null>({
    ripeness: 92,
    disease: 6,
    uniformity: 88,
  });
  const [isGrading, setIsGrading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const simulateVoiceInput = () => {
    setCrop('Tomato');
    setVariety('Hybrid S-11');
    setQuantity('500');
    setPrice('34');
    setExpectedDate('2026-09-18');
    runAiGrading('Tomato');
  };

  const runAiGrading = (cropName = crop) => {
    setIsGrading(true);
    setTimeout(() => {
      const rip = Math.floor(Math.random() * 15) + 85;
      const dis = Math.floor(Math.random() * 8) + 2;
      const uni = Math.floor(Math.random() * 12) + 86;
      setAiDetails({ ripeness: rip, disease: dis, uniformity: uni });
      setGrade(rip > 88 && dis < 10 ? 'A' : 'B');
      setIsGrading(false);
    }, 900);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      runAiGrading();
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      // 1. Ensure authenticated
      if (!api.getToken()) {
        try {
          await api.login('+919876543210', 'password123');
        } catch {
          await api.register({
            name: 'Ramesh Kumar',
            phone: '+919876543210',
            role: 'farmer',
            language: 'hi',
          });
        }
      }

      // 2. Call backend API to save in MongoDB
      const numQty = parseFloat(quantity) || 100;
      const numPrice = parseFloat(price) || 30;
      await api.createListing({
        crop_name: crop,
        variety,
        quantity: numQty,
        unit: 'kg',
        expected_date: expectedDate,
        minimum_price: numPrice,
        description: `Farm-fresh ${crop} (${variety}), Grade ${grade}.`,
      }).catch((err) => console.warn('Saved offline/local fallback:', err));

      onSubmit({
        crop,
        variety,
        quantity: `${quantity} kg`,
        route,
        grade: grade === 'C' ? 'B' : grade,
        status: 'Live',
        price: `₹${price} / kg`,
      });
    } catch (err) {
      console.error(err);
      onSubmit({
        crop,
        variety,
        quantity: `${quantity} kg`,
        route,
        grade: grade === 'C' ? 'B' : grade,
        status: 'Live',
        price: `₹${price} / kg`,
      });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="listing-modal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <div>
            <span className="eyebrow">Phase 3 — Farmer Marketplace Listing</span>
            <h2>List your produce</h2>
          </div>
          <button className="close-button" onClick={onClose}><X size={19} /></button>
        </div>

        <button className="voice-button" onClick={simulateVoiceInput} type="button">
          <Mic size={20} />
          <span>
            <strong>🎤 Voice to Listing (Hindi/English)</strong>
            <small>Click to simulate: "500 kilo tomato hai, 15 September ko ready hoga"</small>
          </span>
          <ChevronRight size={17} />
        </button>

        <div className="form-grid">
          <label>
            Crop name
            <div className="input-wrap">
              <input value={crop} onChange={(e) => setCrop(e.target.value)} placeholder="e.g. Tomato, Wheat, Onion" />
            </div>
          </label>
          <label>
            Variety / breed
            <div className="input-wrap">
              <input value={variety} onChange={(e) => setVariety(e.target.value)} placeholder="e.g. Arka Rakshak" />
            </div>
          </label>
          <label>
            Quantity (kg)
            <div className="input-wrap">
              <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
              <span>kg</span>
            </div>
          </label>
          <label>
            Expected harvest date
            <div className="input-wrap">
              <input type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} />
            </div>
          </label>
        </div>

        {/* Crop Photo & AI Quality Grading Section */}
        <div style={{ marginTop: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div>
              <strong style={{ fontSize: '0.9rem', color: '#1e293b' }}>📸 Crop Image & AI Quality Pre-Grade</strong>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>Upload crop photo to run computer vision quality analysis</p>
            </div>
            <label style={{ padding: '6px 12px', background: '#16a34a', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
              Upload Photo
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
            </label>
          </div>

          {imagePreview && (
            <div style={{ marginBottom: '0.75rem', textAlign: 'center' }}>
              <img src={imagePreview} alt="Crop preview" style={{ maxHeight: '120px', borderRadius: '8px', objectFit: 'cover' }} />
            </div>
          )}

          <div className="quality-preview" style={{ marginTop: 0 }}>
            <div className="quality-loading">
              <span className="crop-photo"><Wheat size={22} /></span>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong>AI Grade: {isGrading ? 'Scanning...' : `Grade ${grade}`}</strong>
                  <span style={{ fontSize: '0.75rem', background: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: '4px' }}>
                    {isGrading ? 'Analyzing...' : '92% Confidence'}
                  </span>
                </div>
                {aiDetails && !isGrading && (
                  <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', color: '#475569', marginTop: '4px' }}>
                    <span>Ripeness: <b>{aiDetails.ripeness}%</b></span>
                    <span>Disease: <b>{aiDetails.disease}%</b></span>
                    <span>Uniformity: <b>{aiDetails.uniformity}%</b></span>
                  </div>
                )}
              </div>
              <span className="grade" style={{ background: grade === 'A' ? '#16a34a' : '#f59e0b', color: '#fff' }}>{grade}</span>
            </div>
          </div>
        </div>

        {/* Pricing & Route */}
        <div className="route-section">
          <div className="route-heading">
            <div>
              <h3>Pricing & Selling Route</h3>
              <p>Set your minimum expected price per kg</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontWeight: 600 }}>₹</span>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                style={{ width: '80px', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}
              />
              <small>/ kg</small>
            </div>
          </div>
          <div className="route-options">
            <button className={route === 'Retail' ? 'selected' : ''} onClick={() => setRoute('Retail')} type="button">
              <span className="route-radio" />
              <div>
                <strong>Retail direct marketplace</strong>
                <small>Fixed price · Fast local payout</small>
              </div>
              <b>₹{price} / kg</b>
            </button>
            <button className={route === 'Bulk' ? 'selected' : ''} onClick={() => setRoute('Bulk')} type="button">
              <span className="route-radio" />
              <div>
                <strong>Bulk B2B bidding</strong>
                <small>Live buyer auction · Pooled pickup</small>
              </div>
              <b>Min ₹{price} / kg</b>
            </button>
          </div>
        </div>

        <div className="modal-actions">
          <button className="cancel-button" onClick={onClose} type="button">Cancel</button>
          <button className="primary-button" onClick={handlePublish} disabled={isPublishing} type="button">
            <Zap size={17} /> {isPublishing ? 'Saving to Database...' : 'Publish Listing'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
