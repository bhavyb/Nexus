import React, { useState, useEffect } from 'react';
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
import { useLanguage } from '../context/LanguageContext.jsx';

export default function StakeholderDashboard({ user, onNavigate }) {
  const { t } = useLanguage();
  const [logisticsStats, setLogisticsStats] = useState({
    activeTrips: 0,
    deliveredTrips: 0,
    fleetStatus: 'Ready for Dispatch'
  });

  useEffect(() => {
    if (user?.role === 'logistics') {
      const carrierParam = user?.organization || user?.name || user?.email ? `&stakeholder=${encodeURIComponent(user.organization || user.name || user.email)}` : '';
      fetch(`/api/deliveries?role=logistics${carrierParam}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.deliveries) {
            const deliveries = data.deliveries.filter(
              (d) => !(d.farmer_name || '').toLowerCase().includes('test') &&
                     !(d.buyer_name || '').toLowerCase().includes('test') &&
                     d.reference !== 'ADH-1001' &&
                     (d.farmer_name || '').toLowerCase() !== 'matched farmer'
            );
            const active = deliveries.filter((d) => d.status !== 'Delivered').length;
            const delivered = deliveries.filter((d) => d.status === 'Delivered').length;
            setLogisticsStats({
              activeTrips: active,
              deliveredTrips: delivered,
              fleetStatus: active > 0 ? `${active} En Route` : 'Available for Orders'
            });
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const roleConfigs = {
    farmer: {
      title: t('farmerTitle'),
      description: t('farmerDesc'),
      icon: Sprout,
      badge: t('farmerBadge'),
      actions: [
        ['farmer-hub', t('actionAddHarvest')],
        ['demand-forecast', t('actionSeeDemand')]
      ],
      stats: [
        [t('activeListings'), '12 Lots'],
        [t('matchedBuyers'), '8 Verified'],
        [t('avgPriceUplift'), '+18.4%']
      ]
    },
    customer: {
      title: t('buyerTitle'),
      description: t('buyerDesc'),
      icon: ShoppingBag,
      badge: t('buyerBadge'),
      actions: [
        ['marketplace', t('actionBrowseProduce')],
        ['smart-match', t('actionMatchRequirement')]
      ],
      stats: [
        [t('availableListings'), '68 Lots'],
        [t('nearbyFarms'), '24 Farms'],
        [t('avgProcurementSavings'), '21.5%']
      ]
    },
    logistics: {
      title: t('logisticsTitle'),
      description: t('logisticsDesc'),
      icon: Truck,
      badge: t('logisticsBadge'),
      actions: [
        ['logistics', t('actionManageRoutes')],
        ['logistics', t('actionReviewAssignments')]
      ],
      stats: [
        [t('activeDispatches'), `${logisticsStats.activeTrips} Trips`],
        [t('completedDeliveries', 'Completed Deliveries'), `${logisticsStats.deliveredTrips} Delivered`],
        [t('fleetStatus', 'Fleet Status'), logisticsStats.fleetStatus]
      ]
    }
  };

  const data = roleConfigs[user.role] || roleConfigs.customer;
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
              {t('loggedInAs')}: {user?.name || user?.email || 'User'} ({user?.role || 'member'})
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
              {t('commandPortalsHeading')}
            </h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
              {t('commandPortalsSub')}
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
                🌾 {t('directMarketTitle')}
              </span>
            </div>
            <div className="dashboard-feature-body">
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--palette-forest)', marginBottom: '4px' }}>
                  {t('directMarketTitle')}
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.4, margin: '0 0 14px 0' }}>
                  {t('directMarketDesc')}
                </p>
              </div>
              <button
                className="btn-primary"
                onClick={() => onNavigate('marketplace')}
                style={{ width: '100%', padding: '9px 14px', fontSize: '0.84rem' }}
              >
                <ShoppingBag size={15} /> {t('openMarketplace')}
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
                🚚 {t('sharedLogisticsTitle')}
              </span>
            </div>
            <div className="dashboard-feature-body">
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--palette-forest)', marginBottom: '4px' }}>
                  {t('sharedLogisticsTitle')}
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.4, margin: '0 0 14px 0' }}>
                  {t('sharedLogisticsDesc')}
                </p>
              </div>
              <button
                className="btn-primary"
                onClick={() => onNavigate('logistics')}
                style={{ width: '100%', padding: '9px 14px', fontSize: '0.84rem' }}
              >
                <Truck size={15} /> {t('openLogisticsGrid')}
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
                📈 {t('fairPriceTitle')}
              </span>
            </div>
            <div className="dashboard-feature-body">
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--palette-forest)', marginBottom: '4px' }}>
                  {t('fairPriceTitle')}
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.4, margin: '0 0 14px 0' }}>
                  {t('fairPriceDesc')}
                </p>
              </div>
              <button
                className="btn-primary"
                onClick={() => onNavigate('fair-price')}
                style={{ width: '100%', padding: '9px 14px', fontSize: '0.84rem' }}
              >
                <TrendingUp size={15} /> {t('checkPriceBands')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Quick Actions Grid */}
      <div className="dashboard-actions">
        <h2>{t('quickActionsTitle')}</h2>
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
      <DeliveryStatusPanel
        role={user?.role}
        stakeholder={user?.organization || user?.name || user?.email}
        user={user}
      />
    </div>
  );
}
