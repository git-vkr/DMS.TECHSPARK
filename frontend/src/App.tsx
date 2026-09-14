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

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';

function App() {
  const [currentRole, setCurrentRole] = useState<Role | null>(() => {
    return (localStorage.getItem('dms_role') as Role) || null;
  });

  const handleRoleSelect = (role: Role) => {
    setCurrentRole(role);
    localStorage.setItem('dms_role', role);
  };

  const handleSwitch = () => {
    setCurrentRole(null);
    localStorage.removeItem('dms_role');
  };

  return (
    <AuthProvider>
      <Router>
        {/* Floating Quick Switcher Toolbar */}
        {currentRole && (
          <div style={{
            position: 'fixed',
            bottom: '16px',
            right: '16px',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#0f172a',
            color: '#fff',
            padding: '8px 14px',
            borderRadius: '999px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
            fontSize: '13px',
            fontWeight: 500,
          }}>
            <span style={{ color: '#94a3b8' }}>Mode:</span>
            <button
              onClick={() => handleRoleSelect('farmer')}
              style={{
                background: currentRole === 'farmer' ? '#16a34a' : 'transparent',
                color: '#fff',
                border: 'none',
                padding: '4px 10px',
                borderRadius: '999px',
                cursor: 'pointer',
                fontWeight: currentRole === 'farmer' ? 700 : 500
              }}
            >
              🌾 Farmer
            </button>
            <button
              onClick={() => handleRoleSelect('retail')}
              style={{
                background: currentRole === 'retail' ? '#0284c7' : 'transparent',
                color: '#fff',
                border: 'none',
                padding: '4px 10px',
                borderRadius: '999px',
                cursor: 'pointer',
                fontWeight: currentRole === 'retail' ? 700 : 500
              }}
            >
              🛒 Retail
            </button>
            <button
              onClick={() => handleRoleSelect('bulk')}
              style={{
                background: currentRole === 'bulk' ? '#d97706' : 'transparent',
                color: '#fff',
                border: 'none',
                padding: '4px 10px',
                borderRadius: '999px',
                cursor: 'pointer',
                fontWeight: currentRole === 'bulk' ? 700 : 500
              }}
            >
              🏢 Bulk
            </button>
            <button
              onClick={handleSwitch}
              style={{
                background: '#334155',
                color: '#cbd5e1',
                border: 'none',
                padding: '4px 10px',
                borderRadius: '999px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
              title="Switch role"
            >
              🔄 Change
            </button>
          </div>
        )}

        <Routes>
          <Route path="/login" element={<LoginForm onDemoSelect={handleRoleSelect} />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/farmer/dashboard" element={<FarmerDashboard onSwitch={handleSwitch} />} />
          <Route path="/buyer/dashboard" element={<RetailBuyerDashboard onSwitch={handleSwitch} />} />
          <Route path="/bulk/dashboard" element={<BulkBuyerDashboard onSwitch={handleSwitch} />} />
          <Route
            path="*"
            element={
              !currentRole ? (
                <RolePicker onSelect={handleRoleSelect} />
              ) : currentRole === 'farmer' ? (
                <FarmerDashboard onSwitch={handleSwitch} />
              ) : currentRole === 'retail' ? (
                <RetailBuyerDashboard onSwitch={handleSwitch} />
              ) : (
                <BulkBuyerDashboard onSwitch={handleSwitch} />
              )
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
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
    if (newListing) {
      setListings((prev) => [newListing, ...prev]);
      notify(`Produce listed: ${newListing.crop} (${newListing.quantity})`);
      setShowListing(false);
      return;
    }
    const sampleCrops = [
      { crop: 'Potato', variety: 'Kufri Jyoti', quantity: '800 kg', route: 'Bulk' as const, grade: 'A' as const, status: 'Live' as const, price: '₹18 / kg' },
      { crop: 'Chilli', variety: 'Guntur Sannam', quantity: '120 kg', route: 'Retail' as const, grade: 'A' as const, status: 'Live' as const, price: '₹95 / kg' },
      { crop: 'Mustard', variety: 'Pusa Bold', quantity: '500 kg', route: 'Bulk' as const, grade: 'B' as const, status: 'Pending pickup' as const, price: '₹5,200 / q' },
    ];
    const pick = sampleCrops[Math.floor(Math.random() * sampleCrops.length)];
    setListings((prev) => [pick, ...prev]);
    notify(`New lot added: ${pick.crop} (${pick.quantity})`);
    setShowListing(false);
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

  const handleUpdateQuantity = (name: string, delta: number) => {
    setCartItems(prev => {
      return prev.map(item => {
        if (item.name === name) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean) as CartItemData[];
    });
  };

  const totalCartAmount = cartItems.reduce((sum, item) => sum + item.priceNum * item.quantity, 0);

  return (
    <div className="buyer-layout">
      <BuyerHeader type="retail" onSwitch={onSwitch} onNotify={notify} />
      <div className="buyer-body">
        <aside className="buyer-sidebar">
          <p className="nav-label">RETAIL BUYER</p>
          <button className={`buyer-nav-item ${view === 'shop' ? 'active' : ''}`} onClick={() => setView('shop')}>
            <ShoppingCart size={18} /><span>Marketplace</span>
          </button>
          <button className={`buyer-nav-item ${view === 'orders' ? 'active' : ''}`} onClick={() => setView('orders')}>
            <ShoppingBag size={18} /><span>My orders</span><b>2</b>
          </button>
          <button className={`buyer-nav-item ${view === 'payments' ? 'active' : ''}`} onClick={() => setView('payments')}>
            <WalletCards size={18} /><span>Payments & Escrow</span>
          </button>
          <div className="buyer-sidebar-note">
            <ShieldCheck size={16} />
            <div>
              <strong>KrishiSetu Protected</strong>
              <p>Escrow payment released only after quality acceptance.</p>
            </div>
          </div>
        </aside>
        <main className="buyer-main">
          {view === 'shop' && <RetailShop onNotify={notify} onAddToCart={handleAddToCart} />}
          {view === 'orders' && <RetailOrders onNotify={notify} />}
          {view === 'payments' && <BuyerPayments type="retail" />}
        </main>
      </div>

      {/* Floating Cart Button */}
      {cartItems.length > 0 && (
        <button 
          onClick={() => setIsCartOpen(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: '#16a34a',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '50px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 4px 15px rgba(22, 163, 74, 0.4)',
            zIndex: 90,
            border: 'none',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          <ShoppingCart size={20} />
          <span>View Cart ({cartItems.reduce((sum, item) => sum + item.quantity, 0)})</span>
          <span style={{ background: '#15803d', padding: '2px 8px', borderRadius: '12px', fontSize: '13px' }}>
            ₹{totalCartAmount}
          </span>
        </button>
      )}

      {/* Cart Drawer */}
      {isCartOpen && (
        <CartDrawer 
          items={cartItems} 
          onClose={() => setIsCartOpen(false)} 
          onUpdateQuantity={handleUpdateQuantity}
          onCheckout={() => {
            setIsCartOpen(false);
            setCartItems([]);
            notify('Order placed successfully! Funds secured in escrow.');
            setView('orders');
          }}
        />
      )}

      {toast && <div className="toast"><ShieldCheck size={18} />{toast}</div>}
    </div>
  );
}

function CartDrawer({ items, onClose, onUpdateQuantity, onCheckout }: { items: CartItemData[]; onClose: () => void; onUpdateQuantity: (name: string, delta: number) => void; onCheckout: () => void }) {
  const total = items.reduce((sum, item) => sum + item.priceNum * item.quantity, 0);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', justifyContent: 'flex-end' }}>
      <div style={{ width: 'min(400px, 100%)', background: '#fff', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Your Cart ({items.length})</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {items.map(item => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              <div>
                <strong style={{ display: 'block', fontSize: '0.95rem' }}>{item.name}</strong>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>₹{item.priceNum} / unit</span>
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
        <div style={{ padding: '1.25rem', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontWeight: 700, fontSize: '1.1rem' }}>
            <span>Total:</span>
            <span>₹{total}</span>
          </div>
          <button onClick={onCheckout} className="primary-button" style={{ width: '100%', justifyContent: 'center', padding: '0.8rem' }}>
            Proceed to Escrow Checkout
          </button>
        </div>
      </div>
    </div>
  );
}

function RetailShop({ onNotify, onAddToCart }: { onNotify: (message: string) => void; onAddToCart: (name: string, price: string) => void }) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [remoteListings, setRemoteListings] = useState<ListingItem[]>([]);

  useEffect(() => {
    const fetchMarket = async () => {
      try {
        const data = await api.getMarketplace();
        if (data && data.listings) setRemoteListings(data.listings);
      } catch (e) {
        console.warn('Could not sync remote marketplace listings:', e);
      }
    };
    fetchMarket();
  }, []);

  const categories = ['All', 'Vegetables', 'Fruits', 'Grains & pulses', 'Spices'];

  const products = [
    { name: 'Fresh Farm Tomatoes', variety: 'Arka Rakshak', category: 'Vegetables', grade: 'A', price: '₹42 / kg', minOrder: '50 kg', farmer: 'Ramesh Kumar', location: 'Nashik, Maharashtra', harvest: 'Today', verified: true, rating: '4.8', deals: '12 orders this week' },
    { name: 'Red Onions (Grade A)', variety: 'N-53', category: 'Vegetables', grade: 'A', price: '₹34 / kg', minOrder: '100 kg', farmer: 'Sunita Patil', location: 'Pune, Maharashtra', harvest: 'Yesterday', verified: true, rating: '4.9', deals: '34 orders this week' },
    { name: 'Sharbati Wheat Grain', variety: 'C-306', category: 'Grains & pulses', grade: 'A', price: '₹2,650 / q', minOrder: '1 quintal', farmer: 'Gurpreet Singh', location: 'Ludhiana, Punjab', harvest: '3 days ago', verified: true, rating: '4.7', deals: '8 orders this week' },
    { name: 'Green Bell Peppers', variety: 'Indra', category: 'Vegetables', grade: 'B', price: '₹58 / kg', minOrder: '40 kg', farmer: 'Devendra Yadav', location: 'Indore, MP', harvest: 'Today', verified: true, rating: '4.6', deals: '6 orders this week' },
    { name: 'Fresh Green Chillies', variety: 'Guntur Sannam', category: 'Spices', grade: 'A', price: '₹92 / kg', minOrder: '20 kg', farmer: 'K. Venkatesh', location: 'Guntur, AP', harvest: 'Today', verified: true, rating: '5.0', deals: '19 orders this week' },
    { name: 'Kufri Jyoti Potatoes', variety: 'Table Grade', category: 'Vegetables', grade: 'B', price: '₹22 / kg', minOrder: '150 kg', farmer: 'Mahesh Verma', location: 'Agra, UP', harvest: '2 days ago', verified: false, rating: '4.4', deals: '15 orders this week' },
  ];

  const filtered = products
    .filter(p => activeCategory === 'All' || p.category === activeCategory)
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.farmer.toLowerCase().includes(search.toLowerCase()) || p.location.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <div className="retail-banner">
        <div>
          <span className="eyebrow">Direct from farm gates</span>
          <h1>Farm-fresh wholesale & retail produce</h1>
          <p>Graded quality, direct farm pricing, backed by automated escrow protection.</p>
        </div>
        <div className="banner-stats">
          <div><strong>₹0</strong><span>Middlemen margin</span></div>
          <div><strong>100%</strong><span>Escrow protected</span></div>
          <div><strong>Grade A/B</strong><span>Lab checked</span></div>
        </div>
      </div>

      <div className="buyer-search-bar">
        <Search size={18} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vegetables, grains, farmer names, mandi regions..." />
        {search && <button onClick={() => setSearch('')} className="search-clear"><X size={16} /></button>}
      </div>

      <div className="category-tabs">
        {categories.map(c => (
          <button key={c} className={activeCategory === c ? 'active' : ''} onClick={() => setActiveCategory(c)}>
            {c}
          </button>
        ))}
      </div>

      <div className="product-grid">
        {filtered.map(p => (
          <div className="product-card" key={p.name}>
            <div className="product-top">
              <span className={`grade-badge grade-${p.grade.toLowerCase()}`}>Grade {p.grade}</span>
              <span className="product-deal">{p.deals}</span>
            </div>
            <div className="product-header">
              <h3>{p.name}</h3>
              <p>{p.variety} · Min {p.minOrder}</p>
            </div>
            <div className="product-farmer">
              <div className="farmer-avatar">{p.farmer.split(' ').map(n => n[0]).join('')}</div>
              <div>
                <strong>{p.farmer} {p.verified && <BadgeCheck size={14} className="verified-badge" />}</strong>
                <p><MapPin size={12} /> {p.location}</p>
              </div>
            </div>
            <div className="product-footer">
              <div>
                <span className="price-label">Farm gate price</span>
                <strong>{p.price}</strong>
              </div>
              <button className="primary-button" onClick={() => onAddToCart(p.name, p.price)}>
                <ShoppingCart size={15} /> Buy now
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function RetailOrders({ onNotify }: { onNotify: (message: string) => void }) {
  const [remoteOrders, setRemoteOrders] = useState<any[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await api.getOrders();
        if (data && data.orders) setRemoteOrders(data.orders);
      } catch (e) {
        console.warn('Could not sync orders:', e);
      }
    };
    fetchOrders();
  }, []);

  const orders = [
    { id: '#KS-8902', crop: 'Fresh Farm Tomatoes', qty: '120 kg', total: '₹5,040', status: 'In Transit', driver: 'Suresh Yadav', truck: 'MH-12-AB-3421', eta: 'Today, 4:30 PM', otp: '4821', escrow: 'Secured' },
    { id: '#KS-8841', crop: 'Red Onions (Grade A)', qty: '250 kg', total: '₹8,500', status: 'Delivered', driver: 'Mahesh Rao', truck: 'MH-14-CC-9011', eta: 'Yesterday', otp: 'Completed', escrow: 'Released to farmer' },
  ];

  return (
    <>
      <div className="buyer-page-heading">
        <div>
          <span className="eyebrow">Track and manage</span>
          <h1>My orders</h1>
          <p>Monitor your active dispatches, transit status and delivery OTPs.</p>
        </div>
      </div>

      <div className="buyer-orders-list">
        {orders.map(o => (
          <div className="buyer-order card" key={o.id}>
            <div className="order-main-info">
              <div className="order-icon-wrap"><Truck size={20} /></div>
              <div>
                <div className="order-title-row">
                  <strong>{o.crop}</strong>
                  <span className={`order-status-pill ${o.status.toLowerCase().replace(' ', '-')}`}>{o.status}</span>
                </div>
                <p>{o.id} · {o.qty} · Vehicle: {o.truck} · Driver: {o.driver}</p>
              </div>
            </div>
            <div className="order-price">
              <strong>{o.total}</strong>
              <small><ShieldCheck size={13} /> Escrow: {o.escrow}</small>
            </div>
            {o.status === 'In Transit' ? (
              <div className="order-actions">
                <div className="otp-box">
                  <small>Share OTP at delivery:</small>
                  <strong>{o.otp}</strong>
                </div>
                <button className="primary-button" onClick={() => onNotify(`Order ${o.id} delivery accepted! Escrow released to farmer.`)}>
                  Accept delivery
                </button>
              </div>
            ) : (
              <div className="order-actions">
                <button className="outline-button" onClick={() => onNotify(`Receipt for ${o.id} downloaded.`)}>
                  View receipt
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

function BulkBuyerDashboard({ onSwitch }: BuyerShellProps) {
  const [view, setView] = useState<'lots' | 'contracts' | 'payments'>('lots');
  const [toast, setToast] = useState('');

  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2600); };

  return (
    <div className="buyer-layout">
      <BuyerHeader type="bulk" onSwitch={onSwitch} onNotify={notify} />
      <div className="buyer-body">
        <aside className="buyer-sidebar">
          <p className="nav-label">PROCUREMENT DESK</p>
          <button className={`buyer-nav-item ${view === 'lots' ? 'active' : ''}`} onClick={() => setView('lots')}>
            <Building2 size={18} /><span>Live lots & reverse bids</span><b>5</b>
          </button>
          <button className={`buyer-nav-item ${view === 'contracts' ? 'active' : ''}`} onClick={() => setView('contracts')}>
            <FileText size={18} /><span>Contract farming</span>
          </button>
          <button className={`buyer-nav-item ${view === 'payments' ? 'active' : ''}`} onClick={() => setView('payments')}>
            <WalletCards size={18} /><span>Escrow accounts</span>
          </button>
          <div className="buyer-sidebar-note">
            <Zap size={16} />
            <div>
              <strong>Institutional SLA</strong>
              <p>Direct supply contracts, moisture test reports, multi-truck logistics.</p>
            </div>
          </div>
        </aside>
        <main className="buyer-main">
          {view === 'lots' && <BulkLots onNotify={notify} />}
          {view === 'contracts' && <BulkContracts onNotify={notify} />}
          {view === 'payments' && <BuyerPayments type="bulk" />}
        </main>
      </div>
      {toast && <div className="toast"><ShieldCheck size={18} />{toast}</div>}
    </div>
  );
}

function BulkLots({ onNotify }: { onNotify: (message: string) => void }) {
  const [biddingLot, setBiddingLot] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState('2420');

  const lots = [
    { id: 'LOT-WHT-092', crop: 'Lokwan Milling Wheat', volume: '45 Metric Tonnes (450 q)', location: 'Kota Mandi, Rajasthan', basePrice: '₹2,380 / q', currentBid: '₹2,420 / q', moisture: '10.8%', bidderCount: 6, timeLeft: '02h 15m' },
    { id: 'LOT-SOY-114', crop: 'Yellow Soybean Grade 1', volume: '30 Metric Tonnes (300 q)', location: 'Indore Mandi, MP', basePrice: '₹4,650 / q', currentBid: '₹4,780 / q', moisture: '9.5%', bidderCount: 9, timeLeft: '00h 48m' },
    { id: 'LOT-MAZ-058', crop: 'Industrial Maize / Corn', volume: '60 Metric Tonnes (600 q)', location: 'Davangere, Karnataka', basePrice: '₹2,100 / q', currentBid: '₹2,180 / q', moisture: '12.0%', bidderCount: 4, timeLeft: '04h 30m' },
  ];

  return (
    <>
      <div className="bulk-hero">
        <div>
          <span className="eyebrow">Institutional procurement</span>
          <h1>Direct farm aggregation & spot mandi bidding</h1>
          <p>Participate in live farm-gate auctions with automated lab assays and batch escrow.</p>
        </div>
        <div className="banner-stats">
          <div><strong>450 MT</strong><span>Available today</span></div>
          <div><strong>9 Mandis</strong><span>Connected</span></div>
          <div><strong>NABL</strong><span>Assayed labs</span></div>
        </div>
      </div>

      <div className="bulk-tabs-row">
        <h2>Live wholesale auction lots</h2>
        <span className="live-pulse"><i /> Live trading open</span>
      </div>

      <div className="lot-grid">
        {lots.map(l => (
          <div className="lot-card" key={l.id}>
            <div className="lot-top">
              <span className="lot-id">{l.id}</span>
              <span className="lot-timer"><Clock3 size={14} /> {l.timeLeft}</span>
            </div>
            <h3>{l.crop}</h3>
            <p className="lot-volume">{l.volume}</p>
            <div className="lot-specs">
              <div><span>Moisture</span><strong>{l.moisture}</strong></div>
              <div><span>Location</span><strong>{l.location.split(',')[0]}</strong></div>
              <div><span>Active bids</span><strong>{l.bidderCount} buyers</strong></div>
            </div>
            <div className="lot-bidding">
              <div>
                <span className="price-label">Highest active bid</span>
                <strong className="lot-price">{l.currentBid}</strong>
              </div>
              <button className="primary-button" onClick={() => setBiddingLot(l.id)}>
                <Zap size={15} /> Place bid
              </button>
            </div>
          </div>
        ))}
      </div>

      {biddingLot && (
        <div className="modal-backdrop">
          <div className="modal card" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <div>
                <p className="eyebrow">Direct institutional auction</p>
                <h2>Place counter bid</h2>
                <p>Selected Lot: <strong>{biddingLot}</strong></p>
              </div>
              <button className="icon-button" onClick={() => setBiddingLot(null)}><X size={18} /></button>
            </div>
            <div className="bid-form">
              <label>Your bid price (per quintal)</label>
              <div className="price-input">
                <span>₹</span>
                <input type="number" value={bidAmount} onChange={e => setBidAmount(e.target.value)} />
              </div>
              <div className="escrow-notice">
                <ShieldCheck size={16} />
                <p>A refundable 2% earnest deposit (₹{(parseInt(bidAmount || '0') * 9).toLocaleString()}) will be reserved in your DMS escrow.</p>
              </div>
              <div className="modal-actions">
                <button className="outline-button" onClick={() => setBiddingLot(null)}>Cancel</button>
                <button className="primary-button" onClick={() => { onNotify(`Bid of ₹${bidAmount}/q placed on ${biddingLot}`); setBiddingLot(null); }}>
                  Confirm bid
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function BulkContracts({ onNotify }: { onNotify: (message: string) => void }) {
  return (
    <>
      <div className="buyer-page-heading">
        <div>
          <span className="eyebrow">Advance procurement</span>
          <h1>Contract farming & buyback agreements</h1>
          <p>Secure future harvest volumes with FPOs and farmer clusters at guaranteed pre-sowing prices.</p>
        </div>
        <button className="primary-button" onClick={() => onNotify('New procurement SLA proposal drafted.')}>
          <Plus size={16} /> Create contract
        </button>
      </div>

      <div className="contracts-grid">
        <div className="contract-card card">
          <div className="contract-status-row">
            <span className="order-status-pill in-transit">Sowing active</span>
            <span className="contract-tag">Kharif 2026</span>
          </div>
          <h3>Organic Basmati 1121 Paddy</h3>
          <p>AgriGrow FPO (48 farmers) · Karnal Cluster, Haryana</p>
          <div className="contract-meta">
            <div><span>Committed volume</span><strong>120 Metric Tonnes</strong></div>
            <div><span>Guaranteed minimum price</span><strong>₹3,850 / q</strong></div>
            <div><span>Expected harvest window</span><strong>15 - 30 Oct 2026</strong></div>
          </div>
          <div className="contract-footer">
            <span className="escrow-badge"><ShieldCheck size={14} /> 25% Advance in Escrow</span>
            <button className="outline-button" onClick={() => onNotify('Viewing agreement SLA #AG-26-041')}>View agreement</button>
          </div>
        </div>

        <div className="contract-card card">
          <div className="contract-status-row">
            <span className="order-status-pill live">Open for farmer join</span>
            <span className="contract-tag">Rabi 2026-27</span>
          </div>
          <h3>Processing Quality Potato (Chip grade)</h3>
          <p>SnackCraft Foods Ltd · Banaskantha Cluster, Gujarat</p>
          <div className="contract-meta">
            <div><span>Target volume</span><strong>300 Metric Tonnes</strong></div>
            <div><span>Guaranteed price</span><strong>₹1,650 / q</strong></div>
            <div><span>Seed & input support</span><strong>Included (Certified)</strong></div>
          </div>
          <div className="contract-footer">
            <span className="escrow-badge"><ShieldCheck size={14} /> 100% Bank Guarantee</span>
            <button className="outline-button" onClick={() => onNotify('Joining agreement SLA #SC-26-102')}>Join cluster</button>
          </div>
        </div>
      </div>
    </>
  );
}

function BuyerPayments({ type }: { type: 'retail' | 'bulk' }) {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await api.getOrders();
        if (data && data.orders) setOrders(data.orders);
      } catch (e) {
        console.warn('Could not sync orders for payments:', e);
      }
    };
    fetchOrders();
  }, []);

  const totalEscrow = type === 'bulk' ? 142800 : 5040;
  const totalReleased = type === 'bulk' ? 528000 : 18450;

  return (
    <>
      <PageHeading eyebrow="Payments & Security" title="Escrow & transaction records" description={type === 'bulk' ? 'Institutional escrow balances, earnest money deposits and released payments.' : 'Your protected orders and saved payment methods.'} />
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
function Service({ icon, title, text, action, onClick }: { icon: React.ReactNode; title: string; text: string; action: string; onClick: () => void }) { return <div className="service"><span className="service-icon">{icon}</span><div><strong>{title}</strong><p>{text}</p><button onClick={onClick}>{action} <ChevronRight size={13} /></button></div></div>; }

function Inventory({ listings, onList }: { listings: Listing[]; onList: () => void }) {
  return <>
    <PageHeading eyebrow="Manage listings" title="Your produce lots" description="Manage real-time prices, quantities and quality grading." action={<button className="primary-button" onClick={onList}><Plus size={18} /> Add new lot</button>} />
    <div className="filter-pill-row"><button className="filter-pill active">All produce ({listings.length})</button><button className="filter-pill">Grade A</button><button className="filter-pill">Grade B</button><button className="filter-pill">Retail</button><button className="filter-pill">Bulk</button><button className="filter-pill icon-only"><SlidersHorizontal size={15} /></button></div>
    <div className="card-table"><div className="table-head"><span>CROP & VARIETY</span><span>QUANTITY</span><span>ROUTE</span><span>GRADE</span><span>PRICE</span><span>STATUS</span><span>ACTIONS</span></div>{listings.map((item, index) => <div className="table-row" key={index}><div><strong>{item.crop}</strong><small>{item.variety}</small></div><span>{item.quantity}</span><span><span className={`route-tag ${item.route.toLowerCase()}`}>{item.route}</span></span><span><span className="grade-tag">{item.grade}</span></span><b>{item.price}</b><span><span className={`status-tag ${item.status.toLowerCase().replace(' ', '-')}`}>{item.status}</span></span><div><button className="ghost-button">Manage</button></div></div>)}</div>
  </>;
}

function Orders({ notify }: { notify: (message: string) => void }) {
  const [bids, setBids] = useState<BidItem[]>([]);

  useEffect(() => {
    const fetchBids = async () => {
      try {
        const data = await api.getMyBids();
        if (data && data.bids) setBids(data.bids);
      } catch (e) {
        console.warn('Could not sync bids:', e);
      }
    };
    fetchBids();
  }, []);

  const dummyBids = [
    { buyer: 'BigBasket Wholesale', crop: 'Tomato (Arka Rakshak)', qty: '200 kg', offer: '₹40 / kg', min: '₹42 / kg', status: 'Pending review', time: '12m ago' },
    { buyer: 'Reliance Fresh', crop: 'Onion (N-53)', qty: '400 kg', offer: '₹30 / kg', min: '₹31 / kg', status: 'Counter offer sent', time: '1h ago' },
    { buyer: 'Shakti Foods', crop: 'Wheat (Lokwan)', qty: '1,200 kg', offer: '₹2,450 / q', min: '₹2,400 / q', status: 'Matched & locked', time: '3h ago' },
  ];

  return <>
    <PageHeading eyebrow="Direct negotiation" title="Incoming bids & orders" description="Accept, counter or reject buyer offers in real time." action={<button className="primary-button" onClick={() => notify('Auto-accept rules updated')}><Zap size={17} /> Auto-accept rules</button>} />
    <div className="orders-summary"><div className="summary-pill active"><span>Pending bids</span><b>4</b></div><div className="summary-pill"><span>Accepted & in escrow</span><b>₹28,400</b></div><div className="summary-pill"><span>Ready for pickup</span><b>2 lots</b></div></div>
    <div className="card bids-card"><div className="card-title-row"><div><h2>Real-time buyer bids</h2><p>Tap accept to lock funds in automated escrow</p></div><span className="live-pill"><i /> Live bidding open</span></div>
      <div className="bid-list">{dummyBids.map((bid, i) => <div className="bid-row" key={i}><div className="bid-buyer"><div className="buyer-icon"><ShoppingBag size={18} /></div><div><strong>{bid.buyer}</strong><p>{bid.crop} · {bid.qty}</p></div></div><div className="bid-pricing"><small>Offer vs Minimum</small><div><b>{bid.offer}</b><span>{bid.min}</span></div></div><div className="bid-status"><span className={`status-pill ${bid.status.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>{bid.status}</span><small>{bid.time}</small></div><div className="bid-actions"><button className="primary-button small" onClick={() => notify(`Accepted ${bid.buyer} offer! Payment locked in escrow.`)}>Accept</button><button className="outline-button small" onClick={() => notify(`Counter-offer sent to ${bid.buyer}.`)}>Counter</button></div></div>)}</div>
    </div>
  </>;
}

function Logistics({ notify }: { notify: (message: string) => void }) {
  const pickups = [
    { lot: 'Wheat (1,200 kg)', partner: 'Raj Surface Logistics', vehicle: 'MH-12-Q-4521', driver: 'Sanjay Shinde', time: 'Tomorrow, 08:30 AM', status: 'Assigned', phone: '+91 98234 11204' },
    { lot: 'Tomato (246 kg)', partner: 'Kisan Cold Express', vehicle: 'MH-14-BT-9810', driver: 'Vinod Pawar', time: 'Tomorrow, 11:00 AM', status: 'Cold chain verified', phone: '+91 94220 88319' },
  ];

  return <>
    <PageHeading eyebrow="Farm gate dispatch" title="Logistics & transport tracking" description="Coordinated pickups, vehicle tracking and cold storage." action={<button className="primary-button" onClick={() => notify('Booking shared truck route...')}><Truck size={17} /> Request pickup</button>} />
    <div className="logistics-grid"><div className="pickup-card card"><div className="card-title-row"><div><h2>Scheduled pickups</h2><p>Drivers assigned to your lots</p></div><span className="active-pill"><Truck size={14} /> 2 scheduled</span></div>
      <div className="pickup-list">{pickups.map((p, i) => <div className="pickup-row" key={i}><div className="pickup-icon"><Truck size={20} /></div><div className="pickup-info"><strong>{p.lot}</strong><p>{p.partner} · {p.vehicle}</p><small>Driver: {p.driver} ({p.phone})</small></div><div className="pickup-time"><span>Scheduled</span><strong>{p.time}</strong><span className="logistics-status">{p.status}</span></div><div className="pickup-actions"><button className="outline-button small" onClick={() => notify(`Calling ${p.driver}...`)}>Call driver</button><button className="ghost-button small" onClick={() => notify('Pickup receipt generated.')}>Receipt</button></div></div>)}</div></div>
      <div className="route-card card"><div className="card-title-row"><div><h2>Route pooling</h2><p>Save 35% on freight with shared trucks</p></div><Zap size={18} className="amber-text" /></div><div className="route-insight"><p><strong>Nashik → Vashi APMC Route</strong></p><p>Truck arriving tomorrow at 8:30 AM has <strong>600 kg spare capacity</strong>. Pool your onion listing to save freight charges.</p><button className="primary-button" style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }} onClick={() => notify('Produce added to shared truck pool.')}>Pool produce into route</button></div></div>
    </div>
  </>;
}

function Wallet() {
  return <>
    <PageHeading eyebrow="Instant settlement" title="Earnings & escrow payments" description="Payments released directly to your bank upon delivery verification." action={<button className="primary-button"><IndianRupee size={17} /> Withdraw to bank</button>} />
    <div className="wallet-cards"><div className="wallet-balance-card"><span>Available for withdrawal</span><strong>₹48,620</strong><p>Bank: HDFC Bank ···· 4921</p><div className="wallet-quick-actions"><button className="white-button">Instant UPI transfer</button><button className="trans-button">View bank details</button></div></div>
      <div className="escrow-card"><div><ShieldCheck size={26} /><div><p>Protected in escrow</p><strong>₹12,400</strong><small>Locked by buyers · Releases on delivery OTP</small></div></div></div></div>
  </>;
}

function ListingModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (listing?: Listing) => void }) {
  const [crop, setCrop] = useState('');
  const [variety, setVariety] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [route, setRoute] = useState<'Retail' | 'Bulk'>('Retail');
  const [grade, setGrade] = useState<'A' | 'B'>('A');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!crop || !quantity) {
      onSubmit();
      return;
    }
    onSubmit({
      crop,
      variety: variety || 'Standard',
      quantity: quantity.includes('kg') ? quantity : `${quantity} kg`,
      price: price ? `₹${price} / kg` : '₹40 / kg',
      route,
      grade,
      status: 'Live',
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal card">
        <div className="modal-header">
          <div><p className="eyebrow">Direct produce listing</p><h2>List your harvest</h2><p>Enter details below to publish your lot to retail and bulk buyers.</p></div>
          <button className="icon-button" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="listing-form">
          <div className="form-row">
            <div className="form-field"><label>Crop name</label><input placeholder="e.g. Tomato, Wheat, Potato" value={crop} onChange={e => setCrop(e.target.value)} required /></div>
            <div className="form-field"><label>Variety</label><input placeholder="e.g. Arka Rakshak, Lokwan" value={variety} onChange={e => setVariety(e.target.value)} /></div>
          </div>
          <div className="form-row">
            <div className="form-field"><label>Total quantity (kg or quintals)</label><input placeholder="e.g. 500 kg or 10 quintals" value={quantity} onChange={e => setQuantity(e.target.value)} required /></div>
            <div className="form-field"><label>Expected price per unit (₹)</label><input placeholder="e.g. 42" value={price} onChange={e => setPrice(e.target.value)} required /></div>
          </div>
          <div className="form-row">
            <div className="form-field"><label>Target market</label><select value={route} onChange={e => setRoute(e.target.value as 'Retail' | 'Bulk')}><option value="Retail">Retail buyers (small batches)</option><option value="Bulk">Bulk procurement (truckloads)</option></select></div>
            <div className="form-field"><label>Assayed quality grade</label><select value={grade} onChange={e => setGrade(e.target.value as 'A' | 'B')}><option value="A">Grade A (Premium)</option><option value="B">Grade B (Standard)</option></select></div>
          </div>
          <div className="modal-actions">
            <button type="button" className="outline-button" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-button"><Plus size={16} /> Publish lot</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;
