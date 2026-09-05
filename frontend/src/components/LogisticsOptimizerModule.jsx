import React, { useState, useEffect } from 'react';
import {
  Truck,
  MapPin,
  CheckCircle2,
  TrendingDown,
  Navigation,
  Compass,
  DollarSign,
  Fuel,
  Leaf,
  Layers,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Award,
  Star,
  ShieldCheck,
  Clock,
  UserCheck,
  AlertTriangle,
  ChevronRight,
  Play,
  RotateCcw,
  PackageCheck,
  Building2,
  Store,
  Users,
  PlusCircle,
  XCircle
} from 'lucide-react';
import DeliveryStatusPanel from './DeliveryStatusPanel.jsx';

export default function LogisticsOptimizerModule({ user }) {
  const [activeSubTab, setActiveSubTab] = useState('live-orders'); // 'live-orders', 'matching', 'fleet'

  // Dynamic Matching & Live Deliveries State
  const [liveDeliveries, setLiveDeliveries] = useState([]);
  const [selectedOrderRef, setSelectedOrderRef] = useState('');
  const [dynamicCandidates, setDynamicCandidates] = useState([]);
  const [loadingDynamic, setLoadingDynamic] = useState(false);
  const [assignMessage, setAssignMessage] = useState('');

  // Fleet state
  const [fleetList, setFleetList] = useState([]);
  const [loadingFleet, setLoadingFleet] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerFormData, setRegisterFormData] = useState({
    company: '',
    vehicle_type: 'Mini Truck (Tata Ace)',
    vehicle_capacity_kg: 1000,
    current_location: 'Ahmedabad',
    service_areas: 'Ahmedabad, Gandhinagar, Sanand',
    vehicle_number: ''
  });
  const [registering, setRegistering] = useState(false);

  // Fetch Live Orders scoped to carrier or unassigned
  const fetchLiveDeliveries = () => {
    const carrierParam = user?.organization || user?.name || user?.email ? `&stakeholder=${encodeURIComponent(user.organization || user.name || user.email)}` : '';
    fetch(`/api/deliveries?role=logistics${carrierParam}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.deliveries) {
          const valid = data.deliveries.filter(
            (d) => !(d.farmer_name || '').toLowerCase().includes('test') &&
              !(d.buyer_name || '').toLowerCase().includes('test') &&
              d.reference !== 'ADH-1001' &&
              (d.farmer_name || '').toLowerCase() !== 'matched farmer'
          );
          setLiveDeliveries(valid);
          if (valid.length > 0) {
            setSelectedOrderRef((prev) => prev && valid.some((v) => v.reference === prev) ? prev : valid[0].reference);
          } else {
            setSelectedOrderRef('');
            setDynamicCandidates([]);
          }
        }
      })
      .catch((err) => console.error('Error fetching deliveries:', err));
  };

  // Run Dynamic Vehicle Matching on Genuine Orders
  const runDynamicVehicleMatch = (orderRef) => {
    if (!liveDeliveries || liveDeliveries.length === 0) {
      setDynamicCandidates([]);
      return;
    }
    const targetOrder = liveDeliveries.find((d) => d.reference === orderRef) || liveDeliveries[0];
    if (!targetOrder) {
      setDynamicCandidates([]);
      return;
    }
    const loadKg = targetOrder.quantity_kg;
    const pickupLoc = targetOrder.pickup_location || 'Ahmedabad';
    const dropLoc = targetOrder.destination || 'Ahmedabad';

    setLoadingDynamic(true);
    setAssignMessage('');
    fetch('/api/logistics/dynamic-match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        load_kg: Number(loadKg),
        pickup_location: pickupLoc,
        destination: dropLoc
      })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.candidates) {
          setDynamicCandidates(data.candidates);
        }
      })
      .catch((err) => console.error('Error running dynamic match:', err))
      .finally(() => setLoadingDynamic(false));
  };

  // Fetch Fleet
  const fetchFleet = () => {
    setLoadingFleet(true);
    fetch('/api/logistics/fleet')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setFleetList(data.fleet);
        }
      })
      .catch((err) => console.error('Error fetching fleet:', err))
      .finally(() => setLoadingFleet(false));
  };

  useEffect(() => {
    fetchFleet();
    fetchLiveDeliveries();
  }, []);

  useEffect(() => {
    if (activeSubTab === 'matching' && selectedOrderRef) {
      runDynamicVehicleMatch(selectedOrderRef);
    }
  }, [activeSubTab, selectedOrderRef]);

  // Handle Partner Registration
  const handleRegisterPartner = (e) => {
    e.preventDefault();
    if (!registerFormData.company) return;
    setRegistering(true);
    fetch('/api/logistics/partner-register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerFormData)
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setShowRegisterModal(false);
          fetchFleet();
          setRegisterFormData({
            company: '',
            vehicle_type: 'Mini Truck (Tata Ace)',
            vehicle_capacity_kg: 1000,
            current_location: 'Ahmedabad',
            service_areas: 'Ahmedabad, Gandhinagar, Sanand',
            vehicle_number: ''
          });
        }
      })
      .catch((err) => console.error('Error registering partner:', err))
      .finally(() => setRegistering(false));
  };

  // Assign vehicle to order in database
  const handleAssignVehicle = async (vehicle) => {
    const targetOrder = liveDeliveries.find((d) => d.reference === selectedOrderRef) || liveDeliveries[0];
    if (!targetOrder) {
      setAssignMessage('No active order selected to dispatch.');
      return;
    }
    setAssignMessage('');
    try {
      const res = await fetch(`/api/deliveries/${targetOrder.reference}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logistics_name: vehicle.company,
          vehicle_number: vehicle.vehicle_number || 'Fleet Vehicle',
          current_location: `Carrier ${vehicle.company} dispatched for produce pickup at ${targetOrder.pickup_location}`
        })
      });
      const data = await res.json();
      if (data.success) {
        setAssignMessage(`✓ Successfully assigned ${vehicle.company} (${vehicle.vehicle_number}) to order ${targetOrder.reference}!`);
        fetchLiveDeliveries();
      } else {
        setAssignMessage(data.error || 'Assignment failed');
      }
    } catch (err) {
      setAssignMessage('Network error while assigning vehicle.');
    }
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
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase' }}>
            <Sparkles size={14} /> AI Logistics Engine & Shared Delivery Platform
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--color-soil-dark)', margin: '4px 0 0 0' }}>
            Smart Logistics & Multi-Farmer Route Optimization
          </h2>
          <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            Aggregates nearby farm orders into a single shared vehicle, matches the best logistics partner, and optimizes multi-stop delivery.
          </div>
        </div>

        {/* Sub-Tab Navigation */}
        <div
          style={{
            background: 'var(--color-bg-subtle)',
            padding: '4px',
            borderRadius: '12px',
            display: 'flex',
            gap: '4px',
            flexWrap: 'wrap'
          }}
        >
          <button
            onClick={() => setActiveSubTab('live-orders')}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              background: activeSubTab === 'live-orders' ? 'white' : 'transparent',
              color: activeSubTab === 'live-orders' ? 'var(--color-soil-dark)' : 'var(--color-text-secondary)',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              boxShadow: activeSubTab === 'live-orders' ? 'var(--shadow-sm)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Truck size={15} color="#7C3AED" /> ⚡ Live Orders & Dispatch
          </button>

          <button
            onClick={() => setActiveSubTab('matching')}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              background: activeSubTab === 'matching' ? 'white' : 'transparent',
              color: activeSubTab === 'matching' ? 'var(--color-soil-dark)' : 'var(--color-text-secondary)',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              boxShadow: activeSubTab === 'matching' ? 'var(--shadow-sm)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <ShieldCheck size={15} color="var(--color-crop)" /> 1. Smart Matching
          </button>

          <button
            onClick={() => setActiveSubTab('fleet')}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              background: activeSubTab === 'fleet' ? 'white' : 'transparent',
              color: activeSubTab === 'fleet' ? 'var(--color-soil-dark)' : 'var(--color-text-secondary)',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              boxShadow: activeSubTab === 'fleet' ? 'var(--shadow-sm)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Users size={15} color="#2563EB" /> 2. Fleet ({fleetList.length})
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 0: LIVE BUYER-FARMER ORDERS & LOGISTICS DISPATCH TRACKING         */}
      {/* ========================================================================= */}
      {activeSubTab === 'live-orders' && (
        <DeliveryStatusPanel
          role="logistics"
          stakeholder={user?.organization || user?.name || user?.email || 'Logistics Partner'}
          user={user}
        />
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 1: DYNAMIC SMART VEHICLE MATCHING ALGORITHM                       */}
      {/* ========================================================================= */}
      {activeSubTab === 'matching' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Header Controls: Live Order Selector */}
          <div
            style={{
              background: 'white',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--color-crop)', textTransform: 'uppercase' }}>
                  Dynamic Fleet Matching Engine
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-soil-dark)', margin: '4px 0 2px 0' }}>
                  AI Multi-Criteria Logistics Partner Matching
                </h3>
                <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                  Evaluates vehicle capacity fit, proximity to farmgate pickup, and driver reliability scores from your registered fleet in real-time.
                </div>
              </div>

              <button
                className="btn-secondary"
                onClick={() => runDynamicVehicleMatch(selectedOrderRef)}
                disabled={loadingDynamic}
                style={{ padding: '8px 16px', fontSize: '0.8rem', fontWeight: 700 }}
              >
                <RefreshCw size={14} className={loadingDynamic ? 'spin-icon' : ''} />
                {loadingDynamic ? 'Evaluating Fleet...' : 'Re-Calculate Matches'}
              </button>
            </div>

            {/* Select Live Order to Match */}
            <div style={{ background: 'var(--color-bg-subtle)', padding: '14px 18px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-soil-dark)' }}>
                  📦 Select Active Live Order to Dispatch:
                </label>
                {liveDeliveries.length > 0 && (
                  <span style={{ fontSize: '0.74rem', color: 'var(--color-crop)', fontWeight: 700 }}>
                    {liveDeliveries.length} active delivery orders in network
                  </span>
                )}
              </div>

              {liveDeliveries.length > 0 ? (
                <select
                  className="nexus-select"
                  value={selectedOrderRef}
                  onChange={(e) => {
                    setSelectedOrderRef(e.target.value);
                    runDynamicVehicleMatch(e.target.value);
                  }}
                  style={{ width: '100%', padding: '8px 12px', fontSize: '0.85rem', fontWeight: 600, background: 'white' }}
                >
                  {liveDeliveries.map((order) => (
                    <option key={order.reference} value={order.reference}>
                      {order.reference} — {order.quantity_kg} kg {order.crop} (From {order.farmer_name} at {order.pickup_location} ➔ To {order.buyer_name} at {order.destination}) [{order.status}]
                    </option>
                  ))}
                </select>
              ) : (
                <div style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', padding: '10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={16} color="var(--color-text-muted)" />
                  <span>No active delivery orders currently pending in your queue. When buyers place orders in the Marketplace, orders will appear here for dynamic fleet matching.</span>
                </div>
              )}

              {assignMessage && (
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    background: assignMessage.startsWith('✓') ? '#ECFDF5' : '#FEF2F2',
                    color: assignMessage.startsWith('✓') ? '#047857' : '#DC2626',
                    border: `1px solid ${assignMessage.startsWith('✓') ? '#A7F3D0' : '#FECACA'}`
                  }}
                >
                  {assignMessage}
                </div>
              )}
            </div>
          </div>

          {/* Dynamic Candidate Vehicles List */}
          {liveDeliveries.length > 0 && dynamicCandidates.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '16px' }}>
              {dynamicCandidates.map((veh, idx) => {
                const isBest = idx === 0;
                return (
                  <div
                    key={veh.id}
                    style={{
                      background: 'white',
                      border: `2px solid ${isBest ? 'var(--color-crop)' : 'var(--color-border)'}`,
                      borderRadius: 'var(--radius-md)',
                      padding: '20px',
                      boxShadow: isBest ? 'var(--shadow-md)' : 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: veh.status_color || 'var(--color-crop)' }}>
                          {veh.badge}
                        </span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                          ~{veh.distance_km} km proximity
                        </span>
                      </div>

                      <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-soil-dark)', margin: 0 }}>
                        {veh.company}
                      </h4>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                        {veh.vehicle_type} {veh.vehicle_number ? `• ${veh.vehicle_number}` : ''}
                      </div>

                      <div style={{ margin: '14px 0', background: 'var(--color-bg-subtle)', padding: '10px 12px', borderRadius: '6px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Capacity</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-soil-dark)' }}>{veh.capacity_kg} kg</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Reliability Score</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#7C3AED' }}>{veh.reliability_score}/100 ⭐</div>
                        </div>
                      </div>

                      <div style={{ fontSize: '0.78rem', color: isBest ? 'var(--color-soil-dark)' : 'var(--color-text-secondary)', lineHeight: 1.45 }}>
                        <strong>AI Evaluation:</strong> {veh.match_reason}
                      </div>
                    </div>

                    <div style={{ marginTop: '16px', borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
                      <button
                        className="btn-primary"
                        onClick={() => handleAssignVehicle(veh)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          fontSize: '0.8rem',
                          fontWeight: 800,
                          background: isBest ? 'var(--color-crop)' : '#2563EB',
                          borderColor: isBest ? 'var(--color-crop)' : '#2563EB',
                          justifyContent: 'center'
                        }}
                      >
                        <Truck size={14} /> Assign {veh.company} to Order
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : liveDeliveries.length === 0 ? (
            <div style={{ background: 'white', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)', padding: '40px 20px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              <Truck size={36} color="var(--color-text-muted)" style={{ margin: '0 auto 12px auto' }} />
              <h4 style={{ margin: '0 0 6px 0', color: 'var(--color-soil-dark)', fontSize: '1.05rem', fontWeight: 700 }}>No Orders Available for Matching</h4>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>Once an active order is placed in Marketplace, the AI engine will dynamically rank your fleet by load capacity, farm proximity, and reliability score.</p>
            </div>
          ) : null}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: REGISTERED FLEET & PARTNER ONBOARDING                           */}
      {/* ========================================================================= */}
      {activeSubTab === 'fleet' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Header Action */}
          <div
            style={{
              background: 'white',
              padding: '16px 20px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-soil-dark)', margin: 0 }}>
                Verified Logistics Partners & Commercial Fleet ({fleetList.length} Active)
              </h3>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                Every logistics partner receives a dynamic Reliability Score based on on-time delivery, success rate, and farmer ratings.
              </div>
            </div>

            <button
              className="btn-primary"
              onClick={() => setShowRegisterModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', padding: '8px 16px' }}
            >
              <PlusCircle size={15} /> Register New Logistics Partner
            </button>
          </div>

          {/* Fleet Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '16px' }}>
            {fleetList.map((partner) => (
              <div
                key={partner.id}
                className="nexus-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: '1px solid var(--color-border)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, background: '#E8F5E9', color: 'var(--color-crop)', padding: '3px 8px', borderRadius: '10px' }}>
                      {partner.status}
                    </span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#D97706', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Star size={13} fill="#D97706" /> {partner.rating} ★
                    </span>
                  </div>

                  <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-soil-dark)', margin: 0 }}>
                    {partner.company}
                  </h4>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                    {partner.vehicle_type} • <strong>{partner.vehicle_capacity_kg} kg</strong>
                  </div>

                  <div style={{ margin: '14px 0', background: 'var(--color-bg-subtle)', padding: '10px 12px', borderRadius: '6px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Reliability Score</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#7C3AED' }}>{partner.reliability_score}/100</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>On-Time Rate</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-crop)' }}>{partner.on_time_pct}%</div>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                    📍 <strong>Service Areas:</strong> {partner.service_areas}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: '3px' }}>
                    🚚 <strong>Completed Deliveries:</strong> {partner.completed_deliveries} trips
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Register Partner Modal */}
      {showRegisterModal && (
        <div className="modal-overlay" onClick={() => setShowRegisterModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-soil-dark)', margin: 0 }}>
                Register Commercial Vehicle & Partner
              </h3>
              <button onClick={() => setShowRegisterModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <XCircle size={20} color="var(--color-text-muted)" />
              </button>
            </div>

            <form onSubmit={handleRegisterPartner} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Logistics Company / Transporter Name *</label>
                <input
                  type="text"
                  className="nexus-input"
                  required
                  placeholder="e.g. ABC Logistics"
                  value={registerFormData.company}
                  onChange={(e) => setRegisterFormData({ ...registerFormData, company: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Vehicle Model *</label>
                  <select
                    className="nexus-select"
                    value={registerFormData.vehicle_type}
                    onChange={(e) => setRegisterFormData({ ...registerFormData, vehicle_type: e.target.value })}
                  >
                    <option value="Mini Truck (Tata Ace)">Mini Truck (Tata Ace)</option>
                    <option value="Pickup Truck (Mahindra Bolero)">Pickup (Bolero Maxi)</option>
                    <option value="Light Commercial Truck (407)">LCV (Eicher / 407)</option>
                    <option value="Electric Cargo EV">Electric Cargo EV</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Capacity (kg) *</label>
                  <input
                    type="number"
                    className="nexus-input"
                    required
                    value={registerFormData.vehicle_capacity_kg}
                    onChange={(e) => setRegisterFormData({ ...registerFormData, vehicle_capacity_kg: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Current City / Hub *</label>
                  <input
                    type="text"
                    className="nexus-input"
                    required
                    placeholder="e.g. Ahmedabad"
                    value={registerFormData.current_location}
                    onChange={(e) => setRegisterFormData({ ...registerFormData, current_location: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Vehicle Registration No.</label>
                  <input
                    type="text"
                    className="nexus-input"
                    placeholder="e.g. GJ-01-ET-8412"
                    value={registerFormData.vehicle_number}
                    onChange={(e) => setRegisterFormData({ ...registerFormData, vehicle_number: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Service Operational Areas *</label>
                <input
                  type="text"
                  className="nexus-input"
                  required
                  placeholder="e.g. Ahmedabad, Gandhinagar, Sanand"
                  value={registerFormData.service_areas}
                  onChange={(e) => setRegisterFormData({ ...registerFormData, service_areas: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={registering}
                style={{ marginTop: '10px', padding: '10px 0', fontWeight: 800 }}
              >
                {registering ? 'Registering Partner...' : 'Confirm Partner Onboarding'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
