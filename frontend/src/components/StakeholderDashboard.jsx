import React from 'react';
import {
  ArrowRight,
  BarChart3,
  ShoppingBag,
  Sprout,
  Truck,
  TrendingUp,
  MapPin,
  Sparkles,
  ShieldCheck,
  PackageCheck
} from 'lucide-react';
import DeliveryStatusPanel from './DeliveryStatusPanel.jsx';

const content = {
  farmer: {
    title: 'Farmer & FPO Producer Workspace',
    description: 'Turn your harvest into dependable fair prices, connect with direct buyers, and eliminate distress sales.',
    icon: Sprout,
    badge: '🌾 Producer Command Center',
    actions: [
      ['farmer-hub', 'Add a harvest listing (ફસલ લિસ્ટ કરો)'],
      ['demand-forecast', 'See demand forecast (માંગ આગાહી)']
    ],
    stats: [
      ['Active listings', '12 Lots'],
      ['Matched buyers', '8 Verified'],
      ['Avg. price uplift', '+18.4%']
    ]
  },
  customer: {
    title: 'Buyer & Retailer Procurement Workspace',
    description: 'Source fresh farmgate produce directly, lock pre-harvest supply, and plan bulk orders with confidence.',
    icon: ShoppingBag,
    badge: '🛒 Buyer Direct Hub',
    actions: [
      ['marketplace', 'Browse fresh produce (તાજી ફસલ જુઓ)'],
      ['smart-match', 'Match a requirement (સ્માર્ટ મેચિંગ)']
    ],
    stats: [
      ['Available listings', '68 Lots'],
      ['Nearby farms', '24 Farms'],
      ['Avg. procurement savings', '21.5%']
    ]
  },
  logistics: {
    title: 'Logistics Fleet & Dispatch Workspace',
    description: 'Keep vehicles moving efficiently with shared multi-farm routes, live tracking, and guaranteed earnings.',
    icon: Truck,
    badge: '🚚 Fleet & Route Grid',
    actions: [
      ['logistics', 'Manage delivery routes (ડિલિવરી રૂટ જુઓ)'],
      ['logistics', 'Review delivery assignments (ઓર્ડર્સ તપાસો)']
    ],
    stats: [
      ['Active dispatches', '16 Trips'],
      ['On-time rate', '98.2%'],
      ['Shared route fuel savings', '24.8%']
    ]
  }
};

export default function StakeholderDashboard({ user, onNavigate }) {
  const data = content[user.role] || content.customer;
  const Icon = data.icon;

  return (
    <div className="dashboard-page" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* 1. Cinematic Photographic Hero Banner */}
      <div className="dashboard-hero">
        <div style={{ maxWidth: '640px', zIndex: 2 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 800, color: '#DDA15E', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
            <Sparkles size={15} /> {data.badge}
          </div>
          <h1 style={{ color: '#FEFAE0', fontSize: '2.2rem', margin: '2px 0 8px 0', lineHeight: 1.15 }}>
            {data.title}
          </h1>
          <p style={{ color: '#EFF3DF', fontSize: '0.94rem', lineHeight: 1.45 }}>
            {data.description}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '14px' }}>
            <span style={{ background: 'rgba(254, 250, 224, 0.22)', backdropFilter: 'blur(8px)', border: '1px solid rgba(254, 250, 224, 0.35)', color: '#FEFAE0', padding: '4px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700 }}>
              Logged in as: {user.name} ({user.role})
            </span>
          </div>
        </div>

        <div className="dashboard-hero-icon" style={{ zIndex: 2 }}>
          <Icon size={44} />
        </div>
      </div>

      {/* 2. Key Metrics Row */}
      <div className="dashboard-stats">
        {data.stats.map(([label, value]) => (
          <div className="dashboard-stat" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      {/* 3. Visual Dashboard Feature Image Cards */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--palette-forest)', margin: 0 }}>
              Nexus Platform Command Portals
            </h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
              Explore real-time trade signals, live shared dispatch routes, and direct farmgate supply
            </div>
          </div>
        </div>

        <div className="dashboard-feature-grid">
          {/* Feature Card 1: Direct Mandi Marketplace */}
          <div className="dashboard-feature-card">
            <div className="dashboard-feature-img-wrap">
              <img
                src="/images/hero_market.jpg"
                alt="Direct Farm Marketplace"
                className="dashboard-feature-img"
              />
              <span className="dashboard-feature-badge" style={{ background: 'rgba(40, 54, 24, 0.88)' }}>
                🌾 Direct Farmgate Market
              </span>
            </div>
            <div className="dashboard-feature-body">
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--palette-forest)', marginBottom: '4px' }}>
                  Direct Farm Produce Marketplace
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.4, margin: '0 0 14px 0' }}>
                  Browse 68+ verified farmer lots with live photographs, Fair Price benchmarks, and Farm-to-Fork QR traceability.
                </p>
              </div>
              <button
                className="btn-primary"
                onClick={() => onNavigate('marketplace')}
                style={{ width: '100%', padding: '9px 14px', fontSize: '0.84rem' }}
              >
                <ShoppingBag size={15} /> Open Marketplace (બજાર જુઓ)
              </button>
            </div>
          </div>

          {/* Feature Card 2: Shared Logistics & Fleet Dispatch */}
          <div className="dashboard-feature-card">
            <div className="dashboard-feature-img-wrap">
              <img
                src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80"
                alt="Shared Route Logistics"
                className="dashboard-feature-img"
              />
              <span className="dashboard-feature-badge" style={{ background: 'rgba(188, 108, 37, 0.92)' }}>
                🚚 Shared Transport Fleet
              </span>
            </div>
            <div className="dashboard-feature-body">
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--palette-forest)', marginBottom: '4px' }}>
                  Smart Shared Logistics Engine
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.4, margin: '0 0 14px 0' }}>
                  Pool neighboring orders into unified delivery runs, eliminating empty return miles and lowering costs by up to 25%.
                </p>
              </div>
              <button
                className="btn-primary"
                onClick={() => onNavigate('logistics')}
                style={{ width: '100%', padding: '9px 14px', fontSize: '0.84rem' }}
              >
                <Truck size={15} /> Open Logistics Grid (લોજિસ્ટિક્સ)
              </button>
            </div>
          </div>

          {/* Feature Card 3: AI Price & Mandi Analytics */}
          <div className="dashboard-feature-card">
            <div className="dashboard-feature-img-wrap">
              <img
                src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80"
                alt="AI Price Intelligence"
                className="dashboard-feature-img"
              />
              <span className="dashboard-feature-badge" style={{ background: 'rgba(96, 108, 56, 0.92)' }}>
                📈 AI Price Intelligence
              </span>
            </div>
            <div className="dashboard-feature-body">
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--palette-forest)', marginBottom: '4px' }}>
                  Fair Price & Market Intelligence
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.4, margin: '0 0 14px 0' }}>
                  Prophet AI price forecasts calibrated against 185 Agmarknet commodities protect both farmers and buyers.
                </p>
              </div>
              <button
                className="btn-primary"
                onClick={() => onNavigate('fair-price')}
                style={{ width: '100%', padding: '9px 14px', fontSize: '0.84rem' }}
              >
                <TrendingUp size={15} /> Check Price Bands (ભાવ આગાહી)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Quick Actions Grid */}
      <div className="dashboard-actions">
        <h2>Quick Workflow Actions</h2>
        <div className="dashboard-action-grid">
          {data.actions.map(([id, label]) => (
            <button key={id + label} onClick={() => onNavigate(id)}>
              <span><BarChart3 size={18} color="var(--palette-terracotta)" />{label}</span>
              <ArrowRight size={17} />
            </button>
          ))}
        </div>
      </div>

      {/* 5. Live Orders & Delivery Tracking */}
      <DeliveryStatusPanel role={user.role} stakeholder={user.name} />
    </div>
  );
}
