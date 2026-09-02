import React, { useState, useEffect, useRef } from 'react';
import {
  Compass,
  Truck,
  MapPin,
  TrendingUp,
  Award,
  Sliders,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  Navigation,
  RefreshCw,
  CheckCircle2,
  Crosshair,
  Filter,
  ArrowUpDown
} from 'lucide-react';
import { getCropDisplayName } from '../utils/cropTranslations';

export default function MandiCompareModule({ commodities, initialCrop }) {
  const [selectedCrop, setSelectedCrop] = useState(initialCrop || 'Onion');
  const [locationInput, setLocationInput] = useState('');
  const [transportRate, setTransportRate] = useState(25); // ₹25/km
  const [loadCapacity, setLoadCapacity] = useState(1500); // 1500 kg (15 quintals)
  const [radiusScope, setRadiusScope] = useState('500'); // '350', '500', 'all'
  const [sortBy, setSortBy] = useState('net_price'); // 'net_price', 'distance'
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Location States
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [isLiveGPS, setIsLiveGPS] = useState(false);
  const [gpsCoords, setGpsCoords] = useState(null);
  const [resolvedAreaName, setResolvedAreaName] = useState('');
  const hasAutoRequested = useRef(false);

  // Auto-detect current location on mount
  useEffect(() => {
    if (!hasAutoRequested.current) {
      hasAutoRequested.current = true;
      detectCurrentLocation();
    }
  }, []);

  const detectCurrentLocation = () => {
    if (!navigator.geolocation) {
      fallbackToDefaultLocation('Geolocation is not supported by your browser.');
      return;
    }

    setDetectingLocation(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const coords = { lat, lng };
        setGpsCoords(coords);
        setIsLiveGPS(true);

        // High precision reverse geocode to get exact city / district name
        try {
          const geoRes = await fetch(`/api/reverse-geocode?lat=${lat}&lng=${lng}`);
          const geoJson = await geoRes.json();
          if (geoJson.success && geoJson.data) {
            const cityOrTown = geoJson.data.market || geoJson.data.district || 'Junagadh';
            const state = geoJson.data.state || 'Gujarat';
            const area = `${cityOrTown}, ${state}`;
            setResolvedAreaName(area);
            setLocationInput(area);
          } else {
            const fallbackStr = `Current Location (${lat.toFixed(2)}°N, ${lng.toFixed(2)}°E)`;
            setResolvedAreaName(fallbackStr);
            setLocationInput(fallbackStr);
          }
        } catch {
          const fallbackStr = `Current Location (${lat.toFixed(2)}°N, ${lng.toFixed(2)}°E)`;
          setResolvedAreaName(fallbackStr);
          setLocationInput(fallbackStr);
        } finally {
          setDetectingLocation(false);
          // Fetch mandis comparison using current GPS coordinates
          fetchComparison(lat, lng, null, radiusScope);
        }
      },
      (err) => {
        setDetectingLocation(false);
        setIsLiveGPS(false);
        // Fallback gracefully without breaking
        fallbackToDefaultLocation(
          'Location access not granted. Using regional agricultural hub as baseline.'
        );
      },
      { timeout: 9000, enableHighAccuracy: true }
    );
  };

  const fallbackToDefaultLocation = (noticeMsg = '') => {
    const defaultHub = 'Junagadh';
    setLocationInput(defaultHub);
    setResolvedAreaName('Junagadh Regional Hub');
    setIsLiveGPS(false);
    setGpsCoords(null);
    if (noticeMsg) setError(noticeMsg);
    fetchComparison(null, null, defaultHub, radiusScope);
  };

  const fetchComparison = (
    lat = null,
    lng = null,
    loc = locationInput,
    scope = radiusScope
  ) => {
    setLoading(true);
    setError(null);
    let url = `/api/compare-mandis?crop=${encodeURIComponent(selectedCrop)}&transport_rate=${transportRate}&load_kg=${loadCapacity}`;

    if (lat !== null && lng !== null) {
      url += `&lat=${lat}&lng=${lng}`;
    } else if (loc) {
      url += `&location=${encodeURIComponent(loc)}`;
    }

    if (scope && scope !== 'all') {
      url += `&max_radius=${scope}`;
    }

    fetch(url)
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          setComparisonData(res.data);
        } else {
          setError(res.error || 'Failed to compare mandis');
        }
      })
      .catch(() => setError('Could not connect to comparison service'))
      .finally(() => setLoading(false));
  };

  // Re-fetch when crop, logistics parameters, or radius scope change
  useEffect(() => {
    if (gpsCoords) {
      fetchComparison(gpsCoords.lat, gpsCoords.lng, null, radiusScope);
    } else if (locationInput) {
      fetchComparison(null, null, locationInput, radiusScope);
    }
  }, [selectedCrop, transportRate, loadCapacity, radiusScope]);

  const handleManualSearch = (e) => {
    e.preventDefault();
    setIsLiveGPS(false);
    setGpsCoords(null);
    setResolvedAreaName(locationInput);
    fetchComparison(null, null, locationInput, radiusScope);
  };

  // Process and sort comparison list
  const rawList = comparisonData?.comparison || [];
  const sortedList = [...rawList].sort((a, b) => {
    if (sortBy === 'distance') {
      return a.distance_km - b.distance_km;
    }
    return b.net_price_kg - a.net_price_kg;
  });

  const bestOption = sortedList[0];

  return (
    <div className="nexus-card">
      <div className="card-header-bar">
        <div className="card-title-group">
          <div className="card-icon-pill" style={{ background: 'var(--color-gold-light)', color: 'var(--color-soil)' }}>
            <Compass size={20} />
          </div>
          <div>
            <h2 className="card-title">Module 2: Mandi Comparison Dashboard</h2>
            <p className="card-subtitle">
              Calculates real travel distance from your location, freight logistics & Net In-Pocket Price
            </p>
          </div>
        </div>

        {/* Current Location Status Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {detectingLocation ? (
            <div className="data-status-pill" style={{ background: '#EFF6FF', color: '#1E40AF', borderColor: '#BFDBFE' }}>
              <RefreshCw size={13} className="spin-icon" />
              <span>Detecting Current Location...</span>
            </div>
          ) : isLiveGPS ? (
            <div
              className="data-status-pill"
              style={{
                background: 'var(--color-crop-light)',
                borderColor: 'var(--color-crop-border)',
                color: 'var(--color-crop)',
                fontWeight: 700
              }}
            >
              <span className="status-indicator-dot live" />
              <Crosshair size={14} />
              <span>Live GPS: {resolvedAreaName || 'Junagadh, Gujarat'}</span>
            </div>
          ) : (
            <button
              type="button"
              className="refresh-btn"
              onClick={detectCurrentLocation}
              style={{ borderColor: 'var(--color-crop)', color: 'var(--color-crop)' }}
            >
              <Crosshair size={14} /> Detect Live Location
            </button>
          )}
        </div>
      </div>

      {/* Origin Banner */}
      <div
        style={{
          background: isLiveGPS
            ? 'linear-gradient(90deg, #F0FDF4 0%, #FFFFFF 100%)'
            : 'var(--color-bg-subtle)',
          border: `1px solid ${isLiveGPS ? 'var(--color-crop-border)' : 'var(--color-border)'}`,
          borderRadius: 'var(--radius-md)',
          padding: '12px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: isLiveGPS ? 'var(--color-crop)' : 'var(--color-soil-light)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <MapPin size={17} />
          </div>
          <div>
            <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)', fontWeight: 700 }}>
              Calculated From Farmer Origin
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-soil-dark)' }}>
              {comparisonData?.farmer_location || resolvedAreaName || locationInput || 'Detecting Location...'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {!isLiveGPS && (
            <button
              type="button"
              className="btn-secondary"
              onClick={detectCurrentLocation}
              style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Crosshair size={14} color="var(--color-crop)" /> Switch to My GPS
            </button>
          )}
          {isLiveGPS && (
            <span
              style={{
                fontSize: '0.76rem',
                background: 'var(--color-crop-light)',
                color: 'var(--color-crop)',
                padding: '4px 10px',
                borderRadius: '999px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <CheckCircle2 size={13} /> Live Coordinates Active
            </span>
          )}
        </div>
      </div>

      {/* Input Controls */}
      <div className="form-grid">
        <div className="input-group">
          <label className="input-label" htmlFor="compare-crop">
            Produce Commodity
          </label>
          <select
            id="compare-crop"
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

        <div className="input-group">
          <label className="input-label" htmlFor="location-input">
            <span>Location / District Override</span>
            {isLiveGPS && (
              <span style={{ fontSize: '0.72rem', color: 'var(--color-crop)', fontWeight: 700 }}>
                ● Using Current GPS
              </span>
            )}
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              id="location-input"
              className="nexus-input"
              type="text"
              placeholder="e.g. Junagadh, Rajkot, Gondal, Surat..."
              value={locationInput}
              onChange={(e) => {
                setLocationInput(e.target.value);
                setIsLiveGPS(false);
                setGpsCoords(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleManualSearch(e);
              }}
            />
            <button
              type="button"
              className="btn-secondary"
              onClick={detectCurrentLocation}
              title="Detect Current Location"
              style={{ padding: '0 12px', flexShrink: 0 }}
            >
              <Crosshair size={16} />
            </button>
          </div>
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor="rate-input">
            Transport Freight Rate (₹/km)
          </label>
          <input
            id="rate-input"
            className="nexus-input"
            type="number"
            min="5"
            max="100"
            value={transportRate}
            onChange={(e) => setTransportRate(Number(e.target.value))}
          />
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor="load-input">
            Produce Load (kg)
          </label>
          <input
            id="load-input"
            className="nexus-input"
            type="number"
            step="100"
            min="200"
            max="15000"
            value={loadCapacity}
            onChange={(e) => setLoadCapacity(Number(e.target.value))}
          />
        </div>
      </div>

      {/* Scope & Sorting Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          background: 'var(--color-bg-subtle)',
          padding: '10px 16px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '20px'
        }}
      >
        {/* Radius Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-soil)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Filter size={14} /> Distance Scope:
          </span>
          <button
            type="button"
            className={radiusScope === '350' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setRadiusScope('350')}
            style={{ padding: '5px 12px', fontSize: '0.78rem' }}
          >
            Near Me (&lt; 350 km)
          </button>
          <button
            type="button"
            className={radiusScope === '500' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setRadiusScope('500')}
            style={{ padding: '5px 12px', fontSize: '0.78rem' }}
          >
            Regional (&lt; 500 km)
          </button>
          <button
            type="button"
            className={radiusScope === 'all' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setRadiusScope('all')}
            style={{ padding: '5px 12px', fontSize: '0.78rem' }}
          >
            All India Mandis
          </button>
        </div>

        {/* Sort Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-soil)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <ArrowUpDown size={14} /> Sort By:
          </span>
          <select
            className="nexus-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{ width: 'auto', padding: '5px 10px', fontSize: '0.8rem' }}
          >
            <option value="net_price">Highest Net Price (₹/kg)</option>
            <option value="distance">Closest Distance (km)</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="nexus-alert warning" style={{ marginBottom: '20px' }}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Best Mandi Highlight Banner */}
      {bestOption && (
        <div
          style={{
            background: 'linear-gradient(135deg, #FFF9E6 0%, #E8F5E9 100%)',
            border: '2px solid var(--color-gold)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px 24px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: 'var(--color-gold)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(198, 146, 20, 0.3)'
              }}
            >
              <Award size={28} />
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-soil)', fontWeight: 700 }}>
                Top Net Realized Value Recommendation
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-soil-dark)' }}>
                {bestOption.market} ({bestOption.distance_km} km from you)
              </div>
              <div style={{ fontSize: '0.86rem', color: 'var(--color-text-secondary)' }}>
                {bestOption.district}, {bestOption.state} | Modal: ₹{bestOption.mandi_price_kg}/kg | Freight: ₹{bestOption.transport_cost_per_kg}/kg |{' '}
                <strong style={{ color: 'var(--color-crop)' }}>Net In-Pocket: ₹{bestOption.net_price_kg}/kg</strong>
              </div>
            </div>
          </div>

          {comparisonData?.net_advantage_trip > 0 && (
            <div
              style={{
                background: 'white',
                padding: '12px 18px',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-sm)',
                textAlign: 'right'
              }}
            >
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                Extra Earnings on {loadCapacity} kg Load
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-crop)' }}>
                +₹{comparisonData.net_advantage_trip.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                vs lowest mandi alternative
              </div>
            </div>
          )}
        </div>
      )}

      {/* Comparison Table */}
      {sortedList.length > 0 ? (
        <div style={{ overflowX: 'auto' }}>
          <table className="nexus-table">
            <thead>
              <tr>
                <th>Mandi (Market)</th>
                <th>Distance From You</th>
                <th>Mandi Modal Price</th>
                <th>Transport Freight</th>
                <th>Net Realized Price</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedList.map((item, idx) => {
                const isBest = idx === 0;
                
                // Build accurate Google Maps navigation link from user's origin to mandi
                const originParam = gpsCoords
                  ? `${gpsCoords.lat},${gpsCoords.lng}`
                  : encodeURIComponent(locationInput || 'Junagadh');
                const destParam = item.coordinates
                  ? `${item.coordinates.lat},${item.coordinates.lng}`
                  : encodeURIComponent(`${item.market} Mandi ${item.state}`);
                const navUrl = `https://www.google.com/maps/dir/?api=1&origin=${originParam}&destination=${destParam}`;

                return (
                  <tr key={item.market} className={isBest ? 'table-highlight-row' : ''}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--color-soil-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {item.market}
                        {isBest && (
                          <span
                            style={{
                              fontSize: '0.7rem',
                              background: 'var(--color-crop)',
                              color: 'white',
                              padding: '2px 8px',
                              borderRadius: '999px',
                              fontWeight: 700
                            }}
                          >
                            Best Option
                          </span>
                        )}
                        {item.is_nearby && (
                          <span
                            style={{
                              fontSize: '0.68rem',
                              background: '#E0F2FE',
                              color: '#0369A1',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              fontWeight: 600
                            }}
                          >
                            Regional
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)' }}>
                        {item.district}, {item.state} • Variety: {item.variety}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--color-soil)' }}>
                        {item.distance_km} km
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                        from your coordinates
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--color-soil-dark)' }}>
                        ₹{item.mandi_price_kg} <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>/kg</span>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>
                        ₹{item.mandi_price_quintal} / qtl
                      </div>
                    </td>
                    <td>
                      <div style={{ color: 'var(--color-accent-amber)', fontWeight: 600 }}>
                        ₹{item.transport_cost_per_kg} /kg
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>
                        Trip: ₹{item.total_transport_cost.toLocaleString('en-IN')}
                      </div>
                    </td>
                    <td>
                      <div
                        style={{
                          fontSize: '1.05rem',
                          fontWeight: 800,
                          color: isBest ? 'var(--color-crop)' : 'var(--color-soil-dark)'
                        }}
                      >
                        ₹{item.net_price_kg} <span style={{ fontSize: '0.75rem' }}>/kg</span>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>
                        ₹{item.net_price_quintal} / qtl net
                      </div>
                    </td>
                    <td>
                      <a
                        href={navUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: 'var(--color-crop)',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          textDecoration: 'none'
                        }}
                        title={`Navigate from your location to ${item.market}`}
                      >
                        Navigate <ArrowRight size={13} />
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-muted)' }}>
          No mandis found within this distance scope. Try switching to <strong>Regional (&lt; 500 km)</strong> or <strong>All India Mandis</strong>.
        </div>
      )}
    </div>
  );
}
