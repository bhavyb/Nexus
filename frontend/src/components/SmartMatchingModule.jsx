import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Building2,
  Users,
  Utensils,
  ShoppingBag,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Clock,
  DollarSign,
  Truck,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { getCropDisplayName } from '../utils/cropTranslations';

export default function SmartMatchingModule({ commodities = [], locationsData = { states: [], districts: [], markets: [] }, onNavigateToLogistics }) {
  const [selectedCrop, setSelectedCrop] = useState(commodities[0] || 'Tomato');
  const [harvestQty, setHarvestQty] = useState(500);
  const [askingPrice, setAskingPrice] = useState(22.0);
  const [farmerLocation, setFarmerLocation] = useState('Gondal Apmc, Rajkot (Gujarat)');
  
  const [matchResult, setMatchResult] = useState(null);
  const [matching, setMatching] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [dispatchMessage, setDispatchMessage] = useState('');

  // Auto-fetch authentic Agmarknet dataset modal price when commodity changes
  useEffect(() => {
    if (!selectedCrop) return;
    fetch(`/api/mandis?commodity=${encodeURIComponent(selectedCrop)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.mandis.length > 0) {
          const defaultMandi = data.mandis[0].market;
          return fetch(`/api/fair-price?crop=${encodeURIComponent(selectedCrop)}&mandi=${encodeURIComponent(defaultMandi)}`);
        }
        return null;
      })
      .then((res) => (res ? res.json() : null))
      .then((res) => {
        if (res && res.success && res.data?.current_modal_price_kg) {
          setAskingPrice(res.data.current_modal_price_kg);
        }
      })
      .catch(() => {});
  }, [selectedCrop]);

  const runSmartMatch = () => {
    setMatching(true);
    setConfirmed(false);
    fetch('/api/smart-match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        commodity: selectedCrop,
        quantity_kg: Number(harvestQty),
        asking_price_kg: Number(askingPrice),
        location: farmerLocation
      })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setMatchResult(data.data);
        }
      })
      .catch((err) => console.error('Error running smart match:', err))
      .finally(() => setMatching(false));
  };

  const createDeliveryAssignments = async () => {
    if (!matchResult?.allocations?.length) return;
    setDispatching(true);
    setDispatchMessage('');
    try {
      const responses = await Promise.all(matchResult.allocations.map((allocation) => fetch('/api/deliveries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crop: selectedCrop,
          quantity_kg: allocation.allocated_quantity_kg,
          farmer_name: matchResult.farmer_name || 'Matched farmer',
          buyer_name: allocation.buyer_name,
          pickup_location: farmerLocation,
          destination: allocation.location
        })
      })));
      const results = await Promise.all(responses.map((response) => response.json()));
      const failed = results.find((result) => !result.success);
      if (failed) throw new Error(failed.error || 'Unable to create delivery assignments');
      setConfirmed(true);
      setDispatchMessage(`${results.length} delivery assignment${results.length === 1 ? '' : 's'} created for logistics partners.`);
    } catch (err) {
      setDispatchMessage(err.message);
    } finally {
      setDispatching(false);
    }
  };

  useEffect(() => {
    runSmartMatch();
  }, [selectedCrop]);

  const getBuyerIcon = (type) => {
    if (type.includes('Hotel')) return <Building2 size={18} color="#2563EB" />;
    if (type.includes('Restaurant')) return <Utensils size={18} color="var(--color-turmeric)" />;
    if (type.includes('Community')) return <Users size={18} color="var(--color-crop)" />;
    return <ShoppingBag size={18} color="#7C3AED" />;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Module Title Banner */}
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
            <Sparkles size={14} /> AI Smart Buyer Matching Engine
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-soil-dark)', margin: '4px 0 0 0' }}>
            Smart Harvest-to-Buyer Multi-Allocation
          </h2>
          <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            Instead of waiting passively for a buyer, Nexus AI instantly splits harvest lots across hotels, restaurants, supermarkets, and community pools.
          </div>
        </div>

        <button
          className="btn-primary"
          onClick={runSmartMatch}
          disabled={matching}
          style={{ padding: '10px 20px', fontSize: '0.88rem', fontWeight: 700 }}
        >
          <RefreshCw size={15} className={matching ? 'spin-icon' : ''} />
          {matching ? 'Matching Buyers...' : 'Re-Run Smart Match'}
        </button>
      </div>

      {/* Interactive Controls & Harvest Setup */}
      <div className="nexus-card">
        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-soil-dark)', marginBottom: '14px' }}>
          Simulate Harvest Matching Parameters:
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label">Produce Commodity</label>
            <select
              className="nexus-select"
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
            >
              {commodities.map((c) => (
                <option key={c} value={c}>
                  {getCropDisplayName(c)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Harvest Lot Size (kg)</label>
            <input
              type="number"
              className="nexus-input"
              value={harvestQty}
              onChange={(e) => setHarvestQty(e.target.value)}
              min="100"
              step="50"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Asking Price (₹/kg)</label>
            <input
              type="number"
              className="nexus-input"
              value={askingPrice}
              onChange={(e) => setAskingPrice(e.target.value)}
              step="0.5"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Farm Location / Nearest Mandi</label>
            <input
              type="text"
              className="nexus-input"
              list="smart-match-locations"
              placeholder="Type or select Mandi / District..."
              value={farmerLocation}
              onChange={(e) => setFarmerLocation(e.target.value)}
            />
            <datalist id="smart-match-locations">
              {locationsData?.markets?.slice(0, 300).map((m) => (
                <option key={m.display} value={m.display} />
              ))}
              {locationsData?.districts?.slice(0, 100).map((d) => (
                <option key={d.display} value={d.display} />
              ))}
            </datalist>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              ✓ Real Agmarknet Mandis & Districts available
            </div>
          </div>
        </div>
      </div>

      {/* Matching Results & KPI Summary */}
      {matchResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* KPI Summary Banner */}
          <div
            style={{
              background: 'linear-gradient(135deg, #1E6B2D12 0%, #D9822B15 100%)',
              border: '1px solid var(--color-crop-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}
          >
            <div>
              <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--color-crop)', textTransform: 'uppercase' }}>
                AI Allocation Summary
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-soil-dark)', margin: '4px 0' }}>
                {matchResult.ai_verdict}
              </h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                Farmer Realized Revenue: <strong>₹{matchResult.total_revenue_inr.toLocaleString()}</strong> • Weighted Price: <strong>₹{matchResult.average_realized_price_kg}/kg</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div
                style={{
                  background: 'white',
                  border: '1px solid var(--color-crop-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 18px',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Fulfillment Rate
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-crop)' }}>
                  {matchResult.fulfillment_rate_pct}%
                </div>
              </div>

              <div
                style={{
                  background: 'white',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 18px',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Matched Buyers
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-soil-dark)' }}>
                  {matchResult.matched_buyers_count}
                </div>
              </div>
            </div>
          </div>

          {/* Allocation Progress Bar */}
          <div className="nexus-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.82rem', fontWeight: 700 }}>
              <span>Total Harvest Allocation Breakdown ({matchResult.matched_quantity_kg} / {matchResult.total_harvest_kg} kg)</span>
              <span style={{ color: 'var(--color-crop)' }}>{matchResult.fulfillment_rate_pct}% Absorbed</span>
            </div>

            <div
              style={{
                height: '14px',
                background: '#E7E0D3',
                borderRadius: '7px',
                overflow: 'hidden',
                display: 'flex'
              }}
            >
              {matchResult.allocations.map((alloc, idx) => {
                const widthPct = (alloc.allocated_quantity_kg / matchResult.total_harvest_kg) * 100;
                const colors = ['#2563EB', '#D9822B', '#1E6B2D', '#7C3AED', '#DC2626'];
                return (
                  <div
                    key={idx}
                    title={`${alloc.buyer_name}: ${alloc.allocated_quantity_kg} kg`}
                    style={{
                      width: `${widthPct}%`,
                      background: colors[idx % colors.length],
                      height: '100%'
                    }}
                  />
                );
              })}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginTop: '12px', fontSize: '0.74rem' }}>
              {matchResult.allocations.map((alloc, idx) => {
                const colors = ['#2563EB', '#D9822B', '#1E6B2D', '#7C3AED', '#DC2626'];
                return (
                  <span key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: colors[idx % colors.length] }} />
                    <strong>{alloc.buyer_name.split(' ')[0]}</strong>: {alloc.allocated_quantity_kg} kg
                  </span>
                );
              })}
            </div>
          </div>

          {/* Matched Buyers Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {matchResult.allocations.map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: 'white',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span
                      style={{
                        background: 'var(--color-bg-subtle)',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '10px',
                        color: 'var(--color-soil)'
                      }}
                    >
                      {item.buyer_type}
                    </span>

                    <span style={{ fontSize: '0.72rem', color: 'var(--color-crop)', fontWeight: 700 }}>
                      ✓ Match #{idx + 1}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    {getBuyerIcon(item.buyer_type)}
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-soil-dark)', margin: 0 }}>
                      {item.buyer_name}
                    </h4>
                  </div>

                  <div style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
                    {item.location}
                  </div>

                  <div
                    style={{
                      background: 'var(--color-bg-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '10px 12px',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                        Allocated Quota
                      </div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-soil-dark)' }}>
                        {item.allocated_quantity_kg} kg
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                        Subtotal (₹)
                      </div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-crop)' }}>
                        ₹{item.order_total_inr.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>
                    Price: <strong>₹{item.price_per_kg}/kg</strong>
                  </span>
                  <span style={{ color: 'var(--color-crop)', fontWeight: 700 }}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Action Trigger: Pass To Logistics */}
          <div
            className="nexus-card"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
              background: 'linear-gradient(135deg, #F5F3FF 0%, #FFFFFF 100%)',
              border: '1px solid #DDD6FE'
            }}
          >
            <div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#6D28D9', margin: 0 }}>
                Next Step: Dispatch with Shared Vehicle Route Optimization
              </h4>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                Group these {matchResult.matched_buyers_count} delivery orders into an AI-optimized shared vehicle run to eliminate empty kilometers.
              </div>
            </div>

            <button
              className="btn-primary"
              onClick={createDeliveryAssignments}
              disabled={dispatching || confirmed}
              style={{
                background: '#7C3AED',
                borderColor: '#7C3AED',
                padding: '10px 20px',
                fontSize: '0.88rem',
                fontWeight: 700
              }}
            >
              <Truck size={16} /> {dispatching ? 'Creating assignments...' : confirmed ? 'Assignments created' : 'Create delivery assignments'} <ArrowRight size={16} />
            </button>
            {dispatchMessage && <div style={{ flexBasis: '100%', fontSize: '0.8rem', color: confirmed ? 'var(--color-crop)' : 'var(--color-accent-red)' }}>{dispatchMessage}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
