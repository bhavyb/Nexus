import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  MapPin,
  RefreshCw,
  Truck,
  Navigation,
  Check,
  Search,
  ChevronRight,
  Send,
  Sparkles,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

const statuses = ['Assigned', 'Accepted', 'Picked Up', 'In Transit', 'Delivered'];

const LOCATION_PRESETS = [
  '🚜 At Farm Gate (Loading Produce)',
  '🛣️ Departed Farm - On Highway Corridor',
  '⛽ Midway Highway Checkpoint',
  '🏙️ Entering Buyer City Ring Road',
  '🏪 Arrived at Buyer Facility / Doorstep'
];

export default function DeliveryStatusPanel({ role, stakeholder }) {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState('');
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [customLocations, setCustomLocations] = useState({});

  const load = async () => {
    try {
      const isScopedRole = role === 'customer' || role === 'farmer';
      const query = isScopedRole
        ? `?role=${encodeURIComponent(role)}&stakeholder=${encodeURIComponent(stakeholder || '')}`
        : (role === 'logistics' ? '?role=logistics' : '?all=true');
      const response = await fetch(`/api/deliveries${query}`);
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to load deliveries');
      setDeliveries(data.deliveries || []);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 4000); // Polling every 4s for live synchronization
    return () => clearInterval(timer);
  }, [role, stakeholder]);

  const updateStatus = async (delivery, status, optionalLocation = null) => {
    setUpdating(delivery.reference);
    const loc = optionalLocation !== null ? optionalLocation : (customLocations[delivery.reference] || delivery.current_location);
    try {
      const response = await fetch(`/api/deliveries/${delivery.reference}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          current_location: loc
        })
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to update delivery');
      setDeliveries((current) => current.map((item) => (item.reference === delivery.reference ? data.delivery : item)));
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating('');
    }
  };

  const updateLocationOnly = async (delivery, locationText) => {
    if (!locationText || !locationText.trim()) return;
    setUpdating(delivery.reference);
    try {
      const response = await fetch(`/api/deliveries/${delivery.reference}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: delivery.status,
          current_location: locationText.trim()
        })
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to update location');
      setDeliveries((current) => current.map((item) => (item.reference === delivery.reference ? data.delivery : item)));
      setCustomLocations((prev) => ({ ...prev, [delivery.reference]: '' }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating('');
    }
  };

  const acceptDelivery = async (delivery) => {
    setUpdating(delivery.reference);
    try {
      const carrierName = stakeholder && stakeholder !== 'Logistics partner' ? stakeholder : 'ABC Logistics';
      const response = await fetch(`/api/deliveries/${delivery.reference}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logistics_name: carrierName,
          vehicle_number: 'GJ-01-ET-8412',
          current_location: `Carrier ${carrierName} dispatched to ${delivery.pickup_location}`
        })
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to accept delivery');
      setDeliveries((current) => current.map((item) => (item.reference === delivery.reference ? data.delivery : item)));
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating('');
    }
  };

  const filteredDeliveries = deliveries.filter((d) => {
    // Hard block dummy test orders from ever rendering in the UI
    const isTest =
      (d.farmer_name || '').toLowerCase().includes('test') ||
      (d.buyer_name || '').toLowerCase().includes('test') ||
      (d.pickup_location || '').toLowerCase().includes('test') ||
      (d.destination || '').toLowerCase().includes('test');
    if (isTest) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.reference.toLowerCase().includes(q) ||
      d.crop.toLowerCase().includes(q) ||
      d.farmer_name.toLowerCase().includes(q) ||
      d.buyer_name.toLowerCase().includes(q) ||
      d.destination.toLowerCase().includes(q)
    );
  });

  return (
    <section className="delivery-panel nexus-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="card-header-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div className="card-title-group" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="card-icon-pill" style={{ background: '#F5F3FF', color: '#7C3AED', padding: '10px', borderRadius: '12px' }}>
            <Truck size={22} />
          </div>
          <div>
            <h2 className="card-title" style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
              {role === 'customer'
                ? 'My Purchases & Live Tracking (મારા ઓર્ડર્સ અને લાઈવ ટ્રેકિંગ)'
                : role === 'farmer'
                ? 'My Farmgate Orders & Pickups (મારા ખેતરના ઓર્ડર્સ અને લાઈવ ટ્રેકિંગ)'
                : 'Logistics Delivery Operations & Live Tracking'}
            </h2>
            <p className="card-subtitle" style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '2px 0 0 0' }}>
              {role === 'customer'
                ? 'Tracking your fresh produce shipments, carrier vehicle details, and real-time locations.'
                : role === 'farmer'
                ? 'Orders placed for your harvest lots and incoming vehicle pickup status.'
                : 'Accept incoming farmer-to-buyer orders and publish live location & milestone updates.'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '9px', color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              placeholder="Search reference, crop, party..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '6px 12px 6px 30px',
                fontSize: '0.78rem',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                background: 'white',
                width: '180px'
              }}
            />
          </div>

          <button className="btn-secondary" onClick={load} disabled={loading} style={{ padding: '6px 12px', fontSize: '0.78rem' }}>
            <RefreshCw size={13} className={loading ? 'spin-icon' : ''} /> Refresh
          </button>
        </div>
      </div>

      {error && <div className="nexus-alert danger">{error}</div>}

      {loading && !deliveries.length ? (
        <p className="card-subtitle">Connecting to live delivery updates stream...</p>
      ) : !filteredDeliveries.length ? (
        <div style={{ padding: '24px', textAlign: 'center', background: 'var(--color-bg-subtle)', borderRadius: '8px' }}>
          <Truck size={28} color="var(--color-text-muted)" style={{ margin: '0 auto 8px auto' }} />
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-soil-dark)' }}>No active deliveries found</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            When a buyer orders produce from a farmer, it will instantly appear here for logistics dispatch and tracking.
          </div>
        </div>
      ) : (
        filteredDeliveries.map((delivery) => {
          const currentIndex = statuses.indexOf(delivery.status);
          const isLogistics = role === 'logistics';
          const isDelivered = delivery.status === 'Delivered';
          const isInTransit = delivery.status === 'In Transit';

          return (
            <div
              className="delivery-card"
              key={delivery.reference}
              style={{
                background: 'white',
                border: `1.5px solid ${isDelivered ? 'var(--color-crop-border)' : isInTransit ? '#BFDBFE' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}
            >
              {/* Main Headline: Exactly who bought what from whom */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-soil-dark)' }}>
                      Customer <span style={{ color: '#2563EB' }}>{delivery.buyer_name}</span> bought{' '}
                      <span style={{ color: 'var(--color-crop)' }}>{delivery.quantity_kg} kg {delivery.crop}</span> from Farmer{' '}
                      <span style={{ color: '#D97706' }}>{delivery.farmer_name}</span>
                    </span>
                    <span style={{ fontSize: '0.72rem', background: '#F3F4F6', color: '#4B5563', padding: '2px 8px', borderRadius: '10px', fontFamily: 'monospace', fontWeight: 700 }}>
                      {delivery.reference}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                    <MapPin size={14} color="var(--color-crop)" />
                    <strong>Pickup:</strong> {delivery.pickup_location} ➔ <strong>Drop:</strong> {delivery.destination}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      padding: '4px 12px',
                      borderRadius: '12px',
                      background: isDelivered ? '#E8F5E9' : isInTransit ? '#EFF6FF' : '#FEF3C7',
                      color: isDelivered ? 'var(--color-crop)' : isInTransit ? '#2563EB' : '#B45309'
                    }}
                  >
                    ● {delivery.status}
                  </span>
                </div>
              </div>

              {/* Real-time Location Highlight Box ("Logistics Kya Chhe") */}
              <div
                style={{
                  background: isDelivered ? '#F0FDF4' : 'linear-gradient(135deg, #FAF5FF 0%, #EFF6FF 100%)',
                  border: `1px solid ${isDelivered ? '#BBF7D0' : '#DDD6FE'}`,
                  borderRadius: '8px',
                  padding: '12px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ background: isDelivered ? 'var(--color-crop)' : '#7C3AED', color: 'white', padding: '6px', borderRadius: '50%', display: 'flex' }}>
                    <Navigation size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>
                      📍 Real-Time Logistics Location & Checkpoint
                    </div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--color-soil-dark)', marginTop: '2px' }}>
                      {delivery.current_location || (isDelivered ? `Delivered at ${delivery.destination}` : `At ${delivery.pickup_location} (Awaiting Driver)`)}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', textAlign: 'right' }}>
                  <div>🚚 <strong>Carrier:</strong> {delivery.logistics_name}</div>
                  <div>🚗 <strong>Vehicle:</strong> {delivery.vehicle_number || 'GJ-01-ET-8412'}</div>
                  {delivery.updated_at && <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>Updated: {delivery.updated_at}</div>}
                </div>
              </div>

              {/* Progress Stepper Timeline */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px', overflowX: 'auto', padding: '6px 0' }}>
                {statuses.map((status, index) => {
                  const isPassed = index <= currentIndex;
                  const isCurrent = index === currentIndex;
                  return (
                    <div
                      key={status}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.74rem',
                        fontWeight: isCurrent ? 800 : isPassed ? 700 : 500,
                        color: isPassed ? 'var(--color-crop)' : 'var(--color-text-muted)',
                        minWidth: 'fit-content'
                      }}
                    >
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: isPassed ? 'var(--color-crop)' : '#E5E7EB',
                          color: isPassed ? 'white' : '#9CA3AF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          boxShadow: isCurrent ? '0 0 0 3px rgba(30, 107, 45, 0.2)' : 'none'
                        }}
                      >
                        {isPassed ? <Check size={14} /> : index + 1}
                      </div>
                      <span>{status}</span>
                      {index < statuses.length - 1 && <ChevronRight size={14} color="#D1D5DB" />}
                    </div>
                  );
                })}
              </div>

              {/* Logistics Actions: Status advancement + Location update */}
              {isLogistics && (
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                      Logistics Control Panel: Publish Live Progress
                    </span>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      {delivery.status === 'Assigned' && (
                        <button
                          className="btn-primary"
                          disabled={updating === delivery.reference}
                          onClick={() => acceptDelivery(delivery)}
                          style={{ fontSize: '0.78rem', padding: '6px 14px', fontWeight: 800 }}
                        >
                          {updating === delivery.reference ? 'Accepting...' : 'Accept & Assign Vehicle'}
                        </button>
                      )}

                      {delivery.status !== 'Assigned' && currentIndex < statuses.length - 1 && (
                        <button
                          className="btn-primary"
                          disabled={updating === delivery.reference}
                          onClick={() => updateStatus(delivery, statuses[currentIndex + 1])}
                          style={{ fontSize: '0.78rem', padding: '6px 14px', fontWeight: 800, background: '#7C3AED', borderColor: '#7C3AED' }}
                        >
                          {updating === delivery.reference ? 'Publishing...' : `Mark as ${statuses[currentIndex + 1]}`}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Location Quick Presets & Custom Input */}
                  {delivery.status !== 'Assigned' && !isDelivered && (
                    <div style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-soil-dark)', marginBottom: '6px' }}>
                        Quick-Post Live Checkpoint Location ("Logistics ક્યાં છે"):
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                        {LOCATION_PRESETS.map((preset) => (
                          <button
                            key={preset}
                            onClick={() => updateLocationOnly(delivery, preset)}
                            disabled={updating === delivery.reference}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              border: '1px solid #CBD5E1',
                              background: 'white',
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              color: 'var(--color-soil-dark)'
                            }}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          placeholder="Or type custom landmark (e.g. Near Sanand Toll Plaza, moving at 45 km/h)..."
                          value={customLocations[delivery.reference] || ''}
                          onChange={(e) => setCustomLocations({ ...customLocations, [delivery.reference]: e.target.value })}
                          style={{
                            flex: 1,
                            padding: '6px 10px',
                            fontSize: '0.78rem',
                            borderRadius: '4px',
                            border: '1px solid var(--color-border)',
                            background: 'white'
                          }}
                        />
                        <button
                          className="btn-secondary"
                          onClick={() => updateLocationOnly(delivery, customLocations[delivery.reference])}
                          disabled={updating === delivery.reference || !customLocations[delivery.reference]}
                          style={{ fontSize: '0.75rem', padding: '6px 12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Send size={12} /> Post Update
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </section>
  );
}
