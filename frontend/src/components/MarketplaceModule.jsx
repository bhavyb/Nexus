import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  PlusCircle,
  Phone,
  MessageCircle,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Tag,
  Search,
  Filter,
  X,
  User,
  ShieldCheck,
  Scale,
  Building2,
  Users,
  Utensils,
  QrCode,
  Calendar,
  Clock,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { getCropDisplayName, getCropGujaratiOnly } from '../utils/cropTranslations';
import TraceabilityModal from './TraceabilityModal.jsx';

export default function MarketplaceModule({ commodities = [], locationsData = { states: [], districts: [], markets: [] } }) {
  const [marketSubTab, setMarketSubTab] = useState('direct'); // 'direct', 'bulk', 'community'
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterCrop, setFilterCrop] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [selectedRegionDropdown, setSelectedRegionDropdown] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedTraceListing, setSelectedTraceListing] = useState(null);

  // Bulk demands state
  const [bulkDemands, setBulkDemands] = useState([]);
  const [loadingBulk, setLoadingBulk] = useState(false);

  // Community pools state
  const [communityPools, setCommunityPools] = useState([]);
  const [loadingPools, setLoadingPools] = useState(false);
  const [pledgePushed, setPledgePushed] = useState({});

  // Form State
  const [formData, setFormData] = useState({
    farmer_name: '',
    phone: '',
    crop: commodities[0] || 'Onion',
    variety: '',
    quantity_kg: '',
    asking_price_kg: '',
    location: 'Junagadh, Gujarat',
    notes: ''
  });

  // Reference Fair Price fetched from Module 1 for this crop
  const [referenceFairPrice, setReferenceFairPrice] = useState(null);
  const [loadingFairRef, setLoadingFairRef] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(null);
  const [formError, setFormError] = useState(null);

  const fetchListings = () => {
    setLoading(true);
    let url = '/api/listings?';
    if (filterCrop) url += `crop=${encodeURIComponent(filterCrop)}&`;
    if (filterLocation) url += `location=${encodeURIComponent(filterLocation)}&`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setListings(data.listings);
        }
      })
      .catch((err) => console.error('Error fetching listings:', err))
      .finally(() => setLoading(false));
  };

  const fetchBulkDemands = () => {
    setLoadingBulk(true);
    fetch('/api/bulk-demands')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setBulkDemands(data.demands);
        }
      })
      .catch((err) => console.error('Error fetching bulk demands:', err))
      .finally(() => setLoadingBulk(false));
  };

  const fetchCommunityPools = () => {
    setLoadingPools(true);
    fetch('/api/community-pools')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCommunityPools(data.pools);
        }
      })
      .catch((err) => console.error('Error fetching pools:', err))
      .finally(() => setLoadingPools(false));
  };

  useEffect(() => {
    fetchListings();
    fetchBulkDemands();
    fetchCommunityPools();
  }, [filterCrop, filterLocation]);

  // When farmer selects a crop in the listing form, fetch fair price benchmark
  useEffect(() => {
    if (!formData.crop) return;
    setLoadingFairRef(true);
    fetch(`/api/mandis?commodity=${encodeURIComponent(formData.crop)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.mandis.length > 0) {
          const defaultMandi = data.mandis[0].market;
          return fetch(`/api/fair-price?crop=${encodeURIComponent(formData.crop)}&mandi=${encodeURIComponent(defaultMandi)}`);
        }
        return null;
      })
      .then((res) => (res ? res.json() : null))
      .then((res) => {
        if (res && res.success && res.data) {
          setReferenceFairPrice(res.data);
          if (res.data.current_modal_price_kg) {
            setFormData((prev) => ({
              ...prev,
              asking_price_kg: res.data.current_modal_price_kg
            }));
          }
        } else {
          setReferenceFairPrice(null);
        }
      })
      .catch(() => setReferenceFairPrice(null))
      .finally(() => setLoadingFairRef(false));
  }, [formData.crop]);

  const handleSubmitListing = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    const payload = {
      ...formData,
      quantity_kg: Number(formData.quantity_kg),
      asking_price_kg: Number(formData.asking_price_kg),
      fair_price_min: referenceFairPrice?.fair_price_band_kg?.min || 0,
      fair_price_max: referenceFairPrice?.fair_price_band_kg?.max || 0,
      mandi_reference: referenceFairPrice?.mandi || ''
    };

    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        setFormSuccess('फसल लिस्टिंग सफलतापूर्वक प्रकाशित हुई! (Listing published successfully)');
        fetchListings();
        setTimeout(() => {
          setShowModal(false);
          setFormSuccess(null);
          setFormData({
            farmer_name: '',
            phone: '',
            crop: commodities[0] || 'Onion',
            variety: '',
            quantity_kg: '',
            asking_price_kg: '',
            location: 'Junagadh, Gujarat',
            notes: ''
          });
        }, 1200);
      } else {
        setFormError(data.error || 'Failed to create listing');
      }
    } catch (err) {
      setFormError('Cannot connect to Nexus backend');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePledge = async (poolId) => {
    try {
      const res = await fetch('/api/community-pools/pledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pool_id: poolId, pledge_kg: 5.0 })
      });
      const data = await res.json();
      if (data.success) {
        setPledgePushed((prev) => ({ ...prev, [poolId]: true }));
        fetchCommunityPools();
      }
    } catch (err) {
      console.error('Pledge error:', err);
    }
  };

  const handleRegionChange = (e) => {
    const val = e.target.value;
    setSelectedRegionDropdown(val);
    setFilterLocation(val);
  };

  const isAskingPriceLow =
    referenceFairPrice &&
    formData.asking_price_kg &&
    Number(formData.asking_price_kg) < referenceFairPrice.fair_price_band_kg.min;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner & Multi-Buyer Sub-Tabs */}
      <div
        style={{
          background: 'white',
          padding: '20px 24px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', fontWeight: 700, color: 'var(--color-crop)', textTransform: 'uppercase' }}>
            <Sparkles size={14} /> Multi-Stakeholder Marketplace
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-soil-dark)', margin: '4px 0 0 0' }}>
            Direct Marketplace & Smart Buyer Channels
          </h2>
          <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            Zero middleman commission: connects farmgate supply with consumers, bulk HoReCa buyers, and society pools.
          </div>
        </div>

        {/* 3 Sub-Tabs Switcher */}
        <div
          style={{
            background: 'var(--color-bg-subtle)',
            padding: '4px',
            borderRadius: '12px',
            display: 'flex',
            gap: '4px'
          }}
        >
          <button
            onClick={() => setMarketSubTab('direct')}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              background: marketSubTab === 'direct' ? 'white' : 'transparent',
              color: marketSubTab === 'direct' ? 'var(--color-soil-dark)' : 'var(--color-text-secondary)',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              boxShadow: marketSubTab === 'direct' ? 'var(--shadow-sm)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <ShoppingBag size={14} color="var(--color-crop)" /> Farmgate Listings ({listings.length})
          </button>

          <button
            onClick={() => setMarketSubTab('bulk')}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              background: marketSubTab === 'bulk' ? 'white' : 'transparent',
              color: marketSubTab === 'bulk' ? 'var(--color-soil-dark)' : 'var(--color-text-secondary)',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              boxShadow: marketSubTab === 'bulk' ? 'var(--shadow-sm)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Building2 size={14} color="#2563EB" /> Bulk Buyers ({bulkDemands.length})
          </button>

          <button
            onClick={() => setMarketSubTab('community')}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              background: marketSubTab === 'community' ? 'white' : 'transparent',
              color: marketSubTab === 'community' ? 'var(--color-soil-dark)' : 'var(--color-text-secondary)',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              boxShadow: marketSubTab === 'community' ? 'var(--shadow-sm)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Users size={14} color="var(--color-turmeric)" /> Smart Community Pools ({communityPools.length})
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB 1: DIRECT FARMGATE LISTINGS */}
      {/* ------------------------------------------------------------- */}
      {marketSubTab === 'direct' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Filter Toolbar */}
          <div
            style={{
              background: 'white',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              padding: '14px 20px',
              display: 'flex',
              gap: '14px',
              flexWrap: 'wrap',
              alignItems: 'center'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={16} color="var(--color-crop)" />
              <select
                className="nexus-select"
                value={filterCrop}
                onChange={(e) => setFilterCrop(e.target.value)}
                style={{ padding: '6px 12px', fontSize: '0.85rem' }}
              >
                <option value="">All Crops (सभी फसलें)</option>
                {commodities.map((c) => (
                  <option key={c} value={c}>
                    {getCropDisplayName(c)}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={16} color="var(--color-turmeric)" />
              <input
                className="nexus-input"
                type="text"
                list="marketplace-filter-locations"
                placeholder="Filter by location / district..."
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                style={{ padding: '6px 12px', fontSize: '0.85rem', width: '230px' }}
              />
              <datalist id="marketplace-filter-locations">
                {locationsData?.districts?.slice(0, 150).map((d) => (
                  <option key={d.display} value={d.district} label={d.display} />
                ))}
                {locationsData?.markets?.slice(0, 150).map((m) => (
                  <option key={m.display} value={m.market} label={m.display} />
                ))}
              </datalist>
            </div>

            <div style={{ marginLeft: 'auto' }}>
              <button
                className="btn-primary"
                onClick={() => setShowModal(true)}
                style={{ padding: '8px 16px', fontSize: '0.82rem' }}
              >
                <PlusCircle size={15} /> Post Harvest (फसल लिस्ट करें)
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <RefreshCw size={28} className="spin-icon" style={{ margin: '0 auto 8px auto', color: 'var(--color-crop)' }} />
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Loading direct farmer listings...</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
              {listings.map((l) => {
                const cleanPhone = l.phone.replace(/[^0-9]/g, '');
                const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                  `Namaste ${l.farmer_name}, I saw your ${l.crop} listing on Nexus.`
                )}`;
                const isPre = l.is_pre_harvest === 1;

                return (
                  <div
                    key={l.id}
                    className="nexus-card"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      borderTop: `4px solid ${isPre ? '#2563EB' : 'var(--color-crop)'}`
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span
                          style={{
                            background: isPre ? '#EFF6FF' : 'var(--color-crop-light)',
                            color: isPre ? '#2563EB' : 'var(--color-crop)',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '10px'
                          }}
                        >
                          {isPre ? '📅 Pre-Harvest Commitment' : '✓ Ready Harvest'}
                        </span>

                        <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                          Batch: {l.qr_code_id || `NX-${l.id.toString().padStart(4, '0')}`}
                        </span>
                      </div>

                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-soil-dark)', margin: 0 }}>
                        {getCropDisplayName(l.crop)}
                      </h3>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                        Variety: <strong>{l.variety || 'Standard'}</strong> • Farmer: <strong>{l.farmer_name}</strong>
                      </div>

                      <div
                        style={{
                          margin: '12px 0',
                          background: 'var(--color-bg-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '10px 12px',
                          display: 'flex',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                            Quantity
                          </div>
                          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-soil-dark)' }}>
                            {l.quantity_kg.toLocaleString()} kg
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                            Asking Price
                          </div>
                          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-crop)' }}>
                            ₹{l.asking_price_kg.toFixed(2)}<span style={{ fontSize: '0.75rem' }}>/kg</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                        <MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} />
                        {l.location}
                      </div>

                      {l.notes && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontStyle: 'italic', marginBottom: '10px' }}>
                          "{l.notes}"
                        </div>
                      )}
                    </div>

                    {/* Action Bar */}
                    <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px', display: 'flex', gap: '8px' }}>
                      <button
                        className="btn-secondary"
                        onClick={() => setSelectedTraceListing(l)}
                        style={{
                          flex: 1,
                          padding: '7px 8px',
                          fontSize: '0.74rem',
                          justifyContent: 'center',
                          color: 'var(--color-soil)'
                        }}
                      >
                        <QrCode size={14} /> Farm-to-Fork QR
                      </button>

                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-primary"
                        style={{
                          padding: '7px 12px',
                          fontSize: '0.75rem',
                          background: '#25D366',
                          borderColor: '#25D366',
                          textDecoration: 'none',
                          color: 'white',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <MessageCircle size={14} /> WhatsApp
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB 2: INSTITUTIONAL BULK DEMANDS */}
      {/* ------------------------------------------------------------- */}
      {marketSubTab === 'bulk' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, #EFF6FF 0%, #FFFFFF 100%)',
              border: '1px solid #BFDBFE',
              borderRadius: 'var(--radius-md)',
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase' }}>
                🏢 Institutional Requisitions
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1E40AF', margin: '2px 0' }}>
                Hotels, Restaurants, Hostels & Supermarket Direct Requirements
              </h3>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                Direct wholesale buyer orders with guaranteed quantities and delivery deadlines.
              </div>
            </div>

            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#2563EB', background: 'white', padding: '6px 14px', borderRadius: '20px', border: '1px solid #BFDBFE' }}>
              {bulkDemands.length} Open Requisitions
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {bulkDemands.map((b) => (
              <div
                key={b.id}
                className="nexus-card"
                style={{
                  borderLeft: '4px solid #2563EB',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, background: '#EFF6FF', color: '#2563EB', padding: '3px 8px', borderRadius: '10px' }}>
                      {b.buyer_type}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-crop)', fontWeight: 700 }}>
                      ● Status: {b.status.toUpperCase()}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-soil-dark)', margin: 0 }}>
                    {b.buyer_name}
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                    Requires: <strong style={{ color: 'var(--color-soil-dark)' }}>{b.quantity_needed_kg.toLocaleString()} kg {b.crop}</strong>
                  </div>

                  <div
                    style={{
                      margin: '12px 0',
                      background: 'var(--color-bg-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '10px 12px',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                        Max Budget
                      </div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#2563EB' }}>
                        ₹{b.max_budget_kg.toFixed(2)}/kg
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                        Required By
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-soil-dark)', marginTop: '4px' }}>
                        {b.required_by_date}
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                    <MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} />
                    {b.location}
                  </div>

                  {b.notes && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontStyle: 'italic', marginBottom: '10px' }}>
                      "{b.notes}"
                    </div>
                  )}
                </div>

                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '10px' }}>
                  <a
                    href={`https://wa.me/${b.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                      `Namaste ${b.buyer_name}, I am a farmer on Nexus and I can fulfill your requirement of ${b.quantity_needed_kg} kg ${b.crop}.`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary"
                    style={{
                      width: '100%',
                      justifyContent: 'center',
                      padding: '8px',
                      fontSize: '0.78rem',
                      background: '#2563EB',
                      borderColor: '#2563EB',
                      textDecoration: 'none'
                    }}
                  >
                    <CheckCircle2 size={14} /> Accept & Supply Bulk Order
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB 3: SMART COMMUNITY BUYING POOLS */}
      {/* ------------------------------------------------------------- */}
      {marketSubTab === 'community' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, #FEF9E7 0%, #FFFFFF 100%)',
              border: '1px solid var(--color-gold-border)',
              borderRadius: 'var(--radius-md)',
              padding: '18px 22px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '14px'
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-turmeric)', textTransform: 'uppercase' }}>
                Feature 1: Smart Community Buying ⭐
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-soil-dark)', margin: '2px 0' }}>
                Apartment & College Area Aggregated Orders
              </h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                Instead of delivering separate 2kg bags, Nexus aggregates 50+ apartment families into 200kg bulk deliveries—slashing transport fees and securing 15-20% discounts.
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {communityPools.map((pool) => {
              const progressPct = Math.min(100, Math.round((pool.pledged_kg / pool.target_kg) * 100));
              const isPledged = pledgePushed[pool.id];

              return (
                <div
                  key={pool.id}
                  className="nexus-card"
                  style={{
                    borderTop: '4px solid var(--color-turmeric)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, background: 'var(--color-gold-light)', color: 'var(--color-turmeric)', padding: '3px 8px', borderRadius: '10px' }}>
                        {pool.discount_pct}% GROUP DISCOUNT
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-soil-dark)', fontWeight: 600 }}>
                        {pool.members_count} Families Joined
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-soil-dark)', margin: 0 }}>
                      {pool.society_name}
                    </h3>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                      <MapPin size={12} style={{ display: 'inline', marginRight: '3px' }} />
                      {pool.location}
                    </div>

                    <div style={{ margin: '14px 0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
                        <span>Produce: {getCropDisplayName(pool.crop)}</span>
                        <span style={{ color: 'var(--color-crop)' }}>{pool.pledged_kg} / {pool.target_kg} kg</span>
                      </div>

                      {/* Progress bar */}
                      <div style={{ height: '10px', background: '#E7E0D3', borderRadius: '5px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${progressPct}%`,
                            background: 'linear-gradient(90deg, var(--color-turmeric) 0%, var(--color-crop) 100%)',
                            height: '100%',
                            transition: 'width 0.3s ease'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
                    <button
                      className="btn-primary"
                      disabled={isPledged}
                      onClick={() => handlePledge(pool.id)}
                      style={{
                        width: '100%',
                        justifyContent: 'center',
                        padding: '8px',
                        fontSize: '0.8rem',
                        background: isPledged ? 'var(--color-crop)' : 'var(--color-turmeric)',
                        borderColor: isPledged ? 'var(--color-crop)' : 'var(--color-turmeric)'
                      }}
                    >
                      {isPledged ? '✓ Pledged +5 kg to Society Pool' : '+ Pledge 5 kg & Lock 18% Discount'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Post Listing */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--color-soil-dark)' }}>
                Post Your Harvest (अपनी फसल लिस्ट करें)
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            {formSuccess && (
              <div className="nexus-alert success" style={{ marginBottom: '14px' }}>
                <CheckCircle2 size={16} /> {formSuccess}
              </div>
            )}

            <form onSubmit={handleSubmitListing} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Farmer Name *</label>
                  <input
                    type="text"
                    className="nexus-input"
                    required
                    value={formData.farmer_name}
                    onChange={(e) => setFormData({ ...formData, farmer_name: e.target.value })}
                    placeholder="e.g. Sureshbhai Patel"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone *</label>
                  <input
                    type="text"
                    className="nexus-input"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. 98251 34812"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Crop *</label>
                  <select
                    className="nexus-select"
                    value={formData.crop}
                    onChange={(e) => setFormData({ ...formData, crop: e.target.value })}
                  >
                    {commodities.map((c) => (
                      <option key={c} value={c}>
                        {getCropDisplayName(c)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Variety</label>
                  <input
                    type="text"
                    className="nexus-input"
                    value={formData.variety}
                    onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                    placeholder="e.g. GG-20, Sharbati"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Quantity (kg) *</label>
                  <input
                    type="number"
                    className="nexus-input"
                    required
                    min="50"
                    value={formData.quantity_kg}
                    onChange={(e) => setFormData({ ...formData, quantity_kg: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Asking Price (₹/kg) *</label>
                  <input
                    type="number"
                    step="0.5"
                    className="nexus-input"
                    required
                    value={formData.asking_price_kg}
                    onChange={(e) => setFormData({ ...formData, asking_price_kg: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Location (Mandi / District) *</label>
                <input
                  type="text"
                  className="nexus-input"
                  list="marketplace-post-locations"
                  placeholder="Type or select Mandi / District..."
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
                <datalist id="marketplace-post-locations">
                  {locationsData?.markets?.slice(0, 300).map((m) => (
                    <option key={m.display} value={m.display} />
                  ))}
                  {locationsData?.districts?.slice(0, 100).map((d) => (
                    <option key={d.display} value={d.display} />
                  ))}
                </datalist>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  ✓ Real Agmarknet Mandis & Districts available ({locationsData?.markets?.length || 1204} markets)
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea
                  className="nexus-input"
                  rows="2"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Dry skin cured, direct farmgate loading"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Publishing...' : 'Publish Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Farm-to-Fork Traceability Modal */}
      {selectedTraceListing && (
        <TraceabilityModal
          listing={selectedTraceListing}
          onClose={() => setSelectedTraceListing(null)}
        />
      )}
    </div>
  );
}
