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

export default function LogisticsOptimizerModule() {
  const [activeSubTab, setActiveSubTab] = useState('simulator'); // 'simulator', 'matching', 'fleet', 'comparison'
  const [vehicleType, setVehicleType] = useState('Mini Truck (Tata Ace)');
  const [vehicleCapacity, setVehicleCapacity] = useState(1000);
  const [ratePerKm, setRatePerKm] = useState(24.0);

  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Simulation & Job Acceptance state
  const [jobAccepted, setJobAccepted] = useState(true);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isAutoSimulating, setIsAutoSimulating] = useState(false);

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

  // Fetch Route Data
  const fetchOptimizedRoute = () => {
    setLoading(true);
    fetch('/api/route-optimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicle_capacity_kg: Number(vehicleCapacity),
        cost_per_km: Number(ratePerKm)
      })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setRouteData(data.data);
        }
      })
      .catch((err) => console.error('Error fetching route:', err))
      .finally(() => setLoading(false));
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
    fetchOptimizedRoute();
    fetchFleet();
  }, [vehicleCapacity, ratePerKm]);

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

  // Auto Simulation Timer
  useEffect(() => {
    let timer = null;
    if (isAutoSimulating && routeData?.route_stops) {
      if (currentStepIndex < routeData.route_stops.length - 1) {
        timer = setTimeout(() => {
          setCurrentStepIndex((prev) => prev + 1);
        }, 1500);
      } else {
        setIsAutoSimulating(false);
      }
    }
    return () => clearTimeout(timer);
  }, [isAutoSimulating, currentStepIndex, routeData]);

  const metrics = routeData?.metrics;
  const stops = routeData?.route_stops || [];
  const currentStop = stops[currentStepIndex] || stops[0];
  const currentOnboardLoad = currentStop?.onboard_load_kg || 0;
  const currentUtilization = Math.min(100, Math.round((currentOnboardLoad / vehicleCapacity) * 100));

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
            onClick={() => setActiveSubTab('simulator')}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              background: activeSubTab === 'simulator' ? 'white' : 'transparent',
              color: activeSubTab === 'simulator' ? 'var(--color-soil-dark)' : 'var(--color-text-secondary)',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              boxShadow: activeSubTab === 'simulator' ? 'var(--shadow-sm)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Truck size={15} color="#7C3AED" /> 1. Live Trip Simulation
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
            <ShieldCheck size={15} color="var(--color-crop)" /> 2. Smart Vehicle Matching
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
            <Users size={15} color="#2563EB" /> 3. Registered Fleet ({fleetList.length})
          </button>

          <button
            onClick={() => setActiveSubTab('comparison')}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              background: activeSubTab === 'comparison' ? 'white' : 'transparent',
              color: activeSubTab === 'comparison' ? 'var(--color-soil-dark)' : 'var(--color-text-secondary)',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              boxShadow: activeSubTab === 'comparison' ? 'var(--shadow-sm)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <TrendingDown size={15} color="#059669" /> 4. Shared vs Traditional
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: LIVE TRIP SIMULATOR & STEP-BY-STEP FLOW                        */}
      {/* ========================================================================= */}
      {activeSubTab === 'simulator' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Step 4 Delivery Request Banner */}
          <div
            style={{
              background: jobAccepted ? 'linear-gradient(135deg, #1E6B2D12 0%, #7C3AED12 100%)' : '#FFFBEB',
              border: `1.5px solid ${jobAccepted ? 'var(--color-crop-border)' : '#F59E0B'}`,
              borderRadius: 'var(--radius-lg)',
              padding: '18px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}
          >
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', fontWeight: 800, color: jobAccepted ? 'var(--color-crop)' : '#B45309', textTransform: 'uppercase' }}>
                {jobAccepted ? '✓ JOB ACCEPTED BY LOGISTICS PARTNER' : 'NEW DELIVERY REQUEST'}
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-soil-dark)', margin: '3px 0' }}>
                Assigned Vehicle: ABC Logistics (Tata Ace • GJ-01-ET-8412)
              </h3>
              <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                Pickups: <strong>3 Nearby Farmers</strong> (Farmer A, C, B • 950 kg) ➔ Deliveries: <strong>2 Bulk Buyers</strong> (Restaurant + Retail Store • 42.6 km)
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Estimated Partner Payout
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-crop)' }}>
                  ₹2,500
                </div>
              </div>

              {!jobAccepted ? (
                <button
                  className="btn-primary"
                  onClick={() => setJobAccepted(true)}
                  style={{ background: 'var(--color-crop)', borderColor: 'var(--color-crop)', padding: '10px 18px', fontWeight: 800 }}
                >
                  <CheckCircle2 size={16} /> ACCEPT DELIVERY
                </button>
              ) : (
                <div style={{ background: '#E8F5E9', color: 'var(--color-crop)', padding: '6px 14px', borderRadius: '20px', fontWeight: 800, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={15} /> Active on Delivery Route
                </div>
              )}
            </div>
          </div>

          {/* Dynamic Vehicle Payload & Simulator Controls */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {/* Live Onboard Load Meter */}
            <div className="nexus-card" style={{ border: '2px solid #7C3AED' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#7C3AED', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Truck size={15} /> Live Vehicle Load (Tata Ace)
                </span>
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: currentUtilization > 90 ? 'var(--color-crop)' : 'var(--color-soil-dark)' }}>
                  {currentUtilization}% Utilization
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--color-soil-dark)' }}>
                  {currentOnboardLoad.toFixed(0)} kg
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                  / {vehicleCapacity} kg max capacity
                </span>
              </div>

              {/* Dynamic Animated Progress Bar */}
              <div
                style={{
                  height: '14px',
                  background: '#E5E7EB',
                  borderRadius: '7px',
                  overflow: 'hidden',
                  marginBottom: '12px'
                }}
              >
                <div
                  style={{
                    width: `${currentUtilization}%`,
                    background: currentUtilization > 90 ? 'linear-gradient(90deg, #7C3AED 0%, #1E6B2D 100%)' : '#7C3AED',
                    height: '100%',
                    borderRadius: '7px',
                    transition: 'width 0.4s ease'
                  }}
                />
              </div>

              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', background: 'var(--color-bg-subtle)', padding: '8px 12px', borderRadius: '6px' }}>
                <strong>Current Stop Action:</strong> {currentStop?.action || 'Departing depot'}
              </div>
            </div>

            {/* Interactive Trip Controls */}
            <div className="nexus-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Interactive Route Execution Controls
                </div>
                <div style={{ fontSize: '0.88rem', color: 'var(--color-soil-dark)', fontWeight: 600 }}>
                  Current Waypoint: <strong>Step {currentStepIndex + 1} of {stops.length}</strong> ({currentStop?.entity})
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '14px', flexWrap: 'wrap' }}>
                <button
                  className="btn-primary"
                  onClick={() => {
                    if (currentStepIndex < stops.length - 1) {
                      setCurrentStepIndex((prev) => prev + 1);
                    }
                  }}
                  disabled={currentStepIndex >= stops.length - 1}
                  style={{ padding: '8px 16px', fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Navigation size={14} /> Next Waypoint ➔
                </button>

                <button
                  onClick={() => setIsAutoSimulating(!isAutoSimulating)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid #7C3AED',
                    background: isAutoSimulating ? '#7C3AED' : 'white',
                    color: isAutoSimulating ? 'white' : '#7C3AED',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Play size={14} /> {isAutoSimulating ? 'Pause Simulator' : 'Auto-Play Run'}
                </button>

                <button
                  onClick={() => {
                    setCurrentStepIndex(0);
                    setIsAutoSimulating(false);
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    background: 'white',
                    color: 'var(--color-text-secondary)',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <RotateCcw size={14} /> Reset
                </button>
              </div>
            </div>
          </div>

          {/* Detailed Stops Timeline (Step 6 & 7) */}
          <div className="nexus-card">
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-soil-dark)', marginBottom: '14px' }}>
              Optimized 6-Waypoint Route Execution Sequence
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {stops.map((stop, idx) => {
                const isActive = idx === currentStepIndex;
                const isPassed = idx < currentStepIndex;
                const isPickup = stop.type === 'PICKUP';
                const isDrop = stop.type === 'DELIVERY';
                const isOrigin = stop.type === 'ORIGIN';

                const badgeBg = isOrigin ? '#F3F4F6' : isPickup ? '#E8F5E9' : '#EFF6FF';
                const badgeColor = isOrigin ? '#6B7280' : isPickup ? 'var(--color-crop)' : '#2563EB';

                return (
                  <div
                    key={idx}
                    onClick={() => setCurrentStepIndex(idx)}
                    style={{
                      background: isActive ? '#FAF5FF' : isPassed ? '#F9FAFB' : 'white',
                      border: `2px solid ${isActive ? '#7C3AED' : isPassed ? 'var(--color-crop)' : 'var(--color-border)'}`,
                      borderRadius: 'var(--radius-md)',
                      padding: '14px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: isPassed ? 'var(--color-crop)' : isActive ? '#7C3AED' : badgeBg,
                          color: isPassed || isActive ? 'white' : badgeColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.85rem'
                        }}
                      >
                        {isPassed ? <CheckCircle2 size={18} /> : stop.step}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--color-soil-dark)' }}>
                            {stop.entity}
                          </span>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '12px',
                              background: badgeBg,
                              color: badgeColor
                            }}
                          >
                            {stop.type}
                          </span>
                          {isActive && (
                            <span style={{ fontSize: '0.68rem', fontWeight: 800, background: '#7C3AED', color: 'white', padding: '2px 8px', borderRadius: '10px' }}>
                              CURRENT TRUCK POSITION 📍
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '3px' }}>
                          {stop.action} • <em>{stop.location}</em>
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-soil-dark)' }}>
                        Onboard: {stop.onboard_load_kg} / {vehicleCapacity} kg
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        Leg Distance: +{stop.distance_leg_km} km (Cumulative: {stop.cumulative_distance_km} km)
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 8: Earnings Breakdown Settlement Card */}
          <div
            style={{
              background: 'white',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px 24px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-soil-dark)', margin: 0 }}>
                  Logistics Partner Payout Settlement Structure
                </h4>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                  Transparent, multi-tier pricing calculation formula ensures fair compensation for drivers & logistics partners.
                </div>
              </div>

              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-crop)' }}>
                Total Paid: ₹2,500
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div style={{ background: 'var(--color-bg-subtle)', padding: '12px 14px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Base Freight Rate</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-soil-dark)', marginTop: '2px' }}>₹500</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>Vehicle dispatch fee</div>
              </div>

              <div style={{ background: 'var(--color-bg-subtle)', padding: '12px 14px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Distance Mileage Cost</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-soil-dark)', marginTop: '2px' }}>₹800</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>42.6 km covered</div>
              </div>

              <div style={{ background: 'var(--color-bg-subtle)', padding: '12px 14px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Multi-Stop Pickup Fee</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-soil-dark)', marginTop: '2px' }}>₹400</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>3 farmer collection points</div>
              </div>

              <div style={{ background: 'var(--color-bg-subtle)', padding: '12px 14px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Perishable Priority Incentive</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-crop)', marginTop: '2px' }}>₹800</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-crop)' }}>Tomatoes handled with care</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: SMART VEHICLE MATCHING ALGORITHM (JUDGE READY)                 */}
      {/* ========================================================================= */}
      {activeSubTab === 'matching' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Formula Callout Banner */}
          <div
            style={{
              background: 'white',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px 24px'
            }}
          >
            <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--color-crop)', textTransform: 'uppercase' }}>
              Intelligent Multi-Criteria Vehicle Selection Engine
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-soil-dark)', margin: '4px 0 8px 0' }}>
              How Nexus AI Selects the Optimal Logistics Partner
            </h3>
            <div
              style={{
                background: 'var(--color-bg-subtle)',
                padding: '12px 16px',
                borderRadius: '8px',
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                color: 'var(--color-soil-dark)',
                fontWeight: 700
              }}
            >
              Best Vehicle = Capacity Match (40%) + Distance Proximity (30%) + Freight Cost (15%) + Reliability Score (15%)
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginTop: '8px' }}>
              Aggregated produce load is <strong>950 kg</strong>. The AI algorithm evaluates all nearby available vehicles within 20 km to select the optimal fit.
            </div>
          </div>

          {/* 3 Candidate Vehicles Evaluated */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {routeData?.candidate_vehicles?.map((veh) => {
              const isSelected = veh.status === 'SELECTED';
              return (
                <div
                  key={veh.id}
                  style={{
                    background: 'white',
                    border: `2px solid ${isSelected ? 'var(--color-crop)' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '20px',
                    boxShadow: isSelected ? 'var(--shadow-md)' : 'none',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: veh.status_color }}>
                      {veh.badge}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                      {veh.distance_km} km away
                    </span>
                  </div>

                  <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-soil-dark)', margin: 0 }}>
                    {veh.name}
                  </h4>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                    {veh.partner} • {veh.vehicle_type}
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

                  <div style={{ fontSize: '0.78rem', color: isSelected ? 'var(--color-crop)' : 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                    <strong>Evaluation:</strong> {veh.match_reason}
                  </div>

                  {isSelected && (
                    <div style={{ marginTop: '14px', background: '#E8F5E9', color: 'var(--color-crop)', padding: '6px 12px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 800, textAlign: 'center' }}>
                      ✓ DISPATCHED TO ABC LOGISTICS
                    </div>
                  )}
                </div>
              );
            })}
          </div>
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

      {/* ========================================================================= */}
      {/* SUB-TAB 4: SHARED LOGISTICS VS TRADITIONAL SYSTEM                         */}
      {/* ========================================================================= */}
      {activeSubTab === 'comparison' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Key Metrics Comparison */}
          {metrics && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div className="nexus-card" style={{ borderLeft: '4px solid #7C3AED' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Total Highway Km Saved
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#7C3AED', marginTop: '4px' }}>
                  {metrics.distance_saved_km} km
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--color-crop)', fontWeight: 600, marginTop: '2px' }}>
                  ↓ {metrics.distance_saved_pct}% vs separate trips
                </div>
              </div>

              <div className="nexus-card" style={{ borderLeft: '4px solid var(--color-crop)' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Transportation Cost Saved
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-crop)', marginTop: '4px' }}>
                  ₹{metrics.cost_saved_inr}
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--color-crop)', fontWeight: 600, marginTop: '2px' }}>
                  ↓ {metrics.cost_reduction_pct}% freight reduction
                </div>
              </div>

              <div className="nexus-card" style={{ borderLeft: '4px solid #2563EB' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Carbon Emissions Averted
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#2563EB', marginTop: '4px' }}>
                  {metrics.co2_saved_kg} kg CO₂
                </div>
                <div style={{ fontSize: '0.76rem', color: '#2563EB', fontWeight: 600, marginTop: '2px' }}>
                  Green consolidation
                </div>
              </div>

              <div className="nexus-card" style={{ borderLeft: '4px solid #D97706' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Vehicle Capacity Utilization
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#D97706', marginTop: '4px' }}>
                  95.0%
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--color-crop)', fontWeight: 600, marginTop: '2px' }}>
                  950 kg / 1,000 kg capacity
                </div>
              </div>
            </div>
          )}

          {/* Traditional vs Nexus Architecture Diagram Card */}
          <div className="nexus-card">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-soil-dark)', margin: '0 0 16px 0' }}>
              Traditional Uncoordinated Logistics vs Nexus Shared Platform
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              {/* Traditional Box */}
              <div style={{ background: '#FEF2F2', border: '1.5px solid #F87171', borderRadius: 'var(--radius-md)', padding: '18px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#DC2626', marginBottom: '8px' }}>
                  ❌ Traditional Uncoordinated System
                </div>
                <ul style={{ fontSize: '0.82rem', color: '#7F1D1D', lineHeight: 1.6, paddingLeft: '18px', margin: 0 }}>
                  <li><strong>3 separate vehicles</strong> dispatched for 3 farmers.</li>
                  <li>Vehicle 1 ➔ Farmer A (300kg) ➔ Buyer: 46.2 km (₹1,108)</li>
                  <li>Vehicle 2 ➔ Farmer B (250kg) ➔ Buyer: 48.4 km (₹1,161)</li>
                  <li>Vehicle 3 ➔ Farmer C (400kg) ➔ Buyer: 44.0 km (₹1,056)</li>
                  <li><strong>Total Distance:</strong> 138.6 km</li>
                  <li><strong>Total Freight Cost:</strong> ₹3,325</li>
                  <li>Each vehicle runs 70% empty on return trips.</li>
                </ul>
              </div>

              {/* Nexus Shared Box */}
              <div style={{ background: '#F0FDF4', border: '1.5px solid #4ADE80', borderRadius: 'var(--radius-md)', padding: '18px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#166534', marginBottom: '8px' }}>
                  ⭐ Nexus AI Shared Logistics System
                </div>
                <ul style={{ fontSize: '0.82rem', color: '#14532D', lineHeight: 1.6, paddingLeft: '18px', margin: 0 }}>
                  <li><strong>1 single shared vehicle</strong> (Tata Ace 1,000 kg).</li>
                  <li>Route: Depot ➔ Farmer A ➔ Farmer C ➔ Farmer B ➔ Restaurant ➔ Retail Store</li>
                  <li><strong>Total Load:</strong> 950 kg (95% full capacity utilization).</li>
                  <li><strong>Total Distance:</strong> Only 42.6 km.</li>
                  <li><strong>Total Operating Cost:</strong> ₹1,022 (Saves ₹2,303!).</li>
                  <li><strong>Partner Earns:</strong> ₹2,500 guaranteed fair payout.</li>
                  <li><strong>Carbon Reduction:</strong> 25.9 kg CO₂ saved.</li>
                </ul>
              </div>
            </div>
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
