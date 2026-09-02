import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  MapPin,
  Calendar,
  AlertCircle,
  Activity,
  Flame,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Info
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { getCropDisplayName } from '../utils/cropTranslations';

export default function DemandForecastHeatmap({ commodities = [], locationsData = { states: [], districts: [], markets: [] } }) {
  const [subTab, setSubTab] = useState('forecast'); // 'forecast' or 'heatmap'
  const [selectedCrop, setSelectedCrop] = useState(commodities[0] || 'Tomato');
  const [selectedLocation, setSelectedLocation] = useState('Ahmedabad APMC');
  const [heatmapSearch, setHeatmapSearch] = useState('');

  // Forecast state
  const [forecastData, setForecastData] = useState(null);
  const [loadingForecast, setLoadingForecast] = useState(false);

  // Heatmap state
  const [heatmapData, setHeatmapData] = useState(null);
  const [loadingHeatmap, setLoadingHeatmap] = useState(false);

  // Fetch Demand Forecast
  const fetchForecast = () => {
    setLoadingForecast(true);
    fetch(`/api/demand-forecast?commodity=${encodeURIComponent(selectedCrop)}&location=${encodeURIComponent(selectedLocation)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setForecastData(data.data);
        }
      })
      .catch((err) => console.error('Error fetching demand forecast:', err))
      .finally(() => setLoadingForecast(false));
  };

  // Fetch Regional Demand Heatmap
  const fetchHeatmap = () => {
    setLoadingHeatmap(true);
    fetch(`/api/demand-heatmap?commodity=${encodeURIComponent(selectedCrop)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setHeatmapData(data.data);
        }
      })
      .catch((err) => console.error('Error fetching heatmap:', err))
      .finally(() => setLoadingHeatmap(false));
  };

  useEffect(() => {
    fetchForecast();
  }, [selectedCrop, selectedLocation]);

  useEffect(() => {
    fetchHeatmap();
  }, [selectedCrop]);

  // When heatmap data loads for selected crop, auto-align selectedLocation to a valid reporting mandi
  useEffect(() => {
    if (heatmapData?.regions?.length > 0) {
      const exists = heatmapData.regions.some(
        (r) => r.region.toLowerCase() === selectedLocation.toLowerCase()
      );
      if (!exists) {
        setSelectedLocation(heatmapData.regions[0].region);
      }
    }
  }, [heatmapData]);

  // Combine historical and forecast records for Recharts
  const chartPoints = [];
  if (forecastData) {
    forecastData.history.forEach((h) => {
      chartPoints.push({
        date: h.date,
        historicalDemand: h.demand_kg,
        predictedDemand: null,
        lowerBound: null,
        upperBound: null
      });
    });

    // Bridge point connecting history to prediction
    if (forecastData.history.length > 0) {
      const lastHist = forecastData.history[forecastData.history.length - 1];
      chartPoints[chartPoints.length - 1].predictedDemand = lastHist.demand_kg;
    }

    forecastData.forecast.forEach((f) => {
      chartPoints.push({
        date: `${f.date} (${f.day_name.slice(0, 3)})`,
        historicalDemand: null,
        predictedDemand: f.demand_kg,
        lowerBound: f.lower_bound_kg,
        upperBound: f.upper_bound_kg
      });
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Module Title & Sub-Tab Switcher */}
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
            <Sparkles size={14} /> Mandatory AI Intelligence Module
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-soil-dark)', margin: '4px 0 0 0' }}>
            AI Demand Forecasting & Regional Heatmap
          </h2>
          <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            Multi-factor time-series demand prediction and regional deficit modeling across major Indian consumption centers.
          </div>
        </div>

        {/* Sub-Tabs: Forecast vs Heatmap */}
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
            onClick={() => setSubTab('forecast')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: subTab === 'forecast' ? 'white' : 'transparent',
              color: subTab === 'forecast' ? 'var(--color-soil-dark)' : 'var(--color-text-secondary)',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              boxShadow: subTab === 'forecast' ? 'var(--shadow-sm)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <TrendingUp size={15} color="var(--color-crop)" /> 7-Day Demand Forecast
          </button>

          <button
            onClick={() => setSubTab('heatmap')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: subTab === 'heatmap' ? 'white' : 'transparent',
              color: subTab === 'heatmap' ? 'var(--color-soil-dark)' : 'var(--color-text-secondary)',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              boxShadow: subTab === 'heatmap' ? 'var(--shadow-sm)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Flame size={15} color="var(--color-accent-red)" /> Regional Demand Heatmap 🔥
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div
        style={{
          display: 'flex',
          gap: '14px',
          background: 'white',
          padding: '14px 20px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-soil-dark)' }}>Commodity:</span>
          <select
            className="nexus-select"
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            style={{ width: '180px', padding: '6px 10px', fontSize: '0.85rem' }}
          >
            {commodities.map((c) => (
              <option key={c} value={c}>
                {getCropDisplayName(c)}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-soil-dark)' }}>
            Target Mandi / Hub:
          </span>
          <select
            className="nexus-select"
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            style={{ minWidth: '280px', maxWidth: '420px', padding: '6px 10px', fontSize: '0.85rem' }}
          >
            {heatmapData?.regions?.length > 0 && (
              <optgroup label={`⚡ Reporting Mandis for ${selectedCrop} (${heatmapData.regions.length} Mandis)`}>
                {heatmapData.regions.map((r) => (
                  <option key={r.region} value={r.region}>
                    {r.region} ({r.district ? r.district + ', ' : ''}{r.state}) — ₹{r.market_price_kg}/kg
                  </option>
                ))}
              </optgroup>
            )}
            <optgroup label="📍 All-India APMC Mandis">
              {(locationsData?.markets || [])
                .filter((m) => !(heatmapData?.regions || []).some((r) => r.region.toLowerCase() === m.market.toLowerCase()))
                .slice(0, 100)
                .map((m) => (
                  <option key={m.market} value={m.market}>
                    {m.display}
                  </option>
                ))}
            </optgroup>
          </select>
        </div>
      </div>

      {/* SUB-TAB 1: 7-DAY DEMAND FORECASTING */}
      {subTab === 'forecast' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Active Mandi Indicator Banner */}
          <div
            style={{
              background: 'white',
              borderRadius: 'var(--radius-md)',
              padding: '12px 18px',
              border: '1px solid var(--color-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: '#E8F5E9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <MapPin size={20} color="var(--color-crop)" />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 700 }}>
                  Active Demand Forecast Hub
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-soil-dark)' }}>
                  {selectedLocation} {forecastData?.district ? `— ${forecastData.district} (${forecastData.state})` : ''}
                </div>
              </div>
            </div>

            {forecastData?.market_price_kg && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Live Mandi Benchmark
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-crop)' }}>
                    ₹{forecastData.market_price_kg}/kg
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Actionable Insight Pill */}
          {forecastData?.summary && (
            <div
              style={{
                background: 'linear-gradient(135deg, #1E6B2D12 0%, #D9822B15 100%)',
                border: '1px solid var(--color-crop-border)',
                borderRadius: 'var(--radius-md)',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px'
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'white',
                  border: '1px solid var(--color-crop-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-crop)',
                  flexShrink: 0
                }}
              >
                <Sparkles size={22} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--color-crop)', textTransform: 'uppercase' }}>
                  AI Farmer Actionable Guidance
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-soil-dark)', marginTop: '2px' }}>
                  {forecastData.summary.actionable_insight}
                </div>
              </div>
            </div>
          )}

          {/* Interactive Recharts Graph */}
          <div className="nexus-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-soil-dark)', margin: 0 }}>
                  Historical Daily Ingestion + 7-Day Forward Demand Projection (kg/day)
                </h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                  Solid green indicates historical absorption; dotted amber represents predicted forward demand envelope.
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '12px', height: '12px', background: '#1E6B2D', borderRadius: '3px' }} />
                  Historical Demand
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '12px', height: '12px', background: '#D9822B', borderRadius: '3px' }} />
                  Predicted Demand
                </span>
              </div>
            </div>

            {loadingForecast ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <RefreshCw size={28} className="spin-icon" style={{ margin: '0 auto 8px auto', color: 'var(--color-crop)' }} />
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                  Calculating time-series demand models...
                </p>
              </div>
            ) : (
              <div style={{ width: '100%', height: 340 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartPoints} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1E6B2D" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#1E6B2D" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D9822B" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#D9822B" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" stroke="#E7E0D3" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: '#78716C' }}
                      interval={2}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#78716C' }}
                      tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
                    />
                    <Tooltip
                      formatter={(val) => [`${Number(val).toLocaleString()} kg`, 'Daily Demand']}
                      contentStyle={{
                        background: 'white',
                        border: '1px solid #E7E0D3',
                        borderRadius: '8px',
                        fontSize: '0.82rem'
                      }}
                    />

                    {/* Historical curve */}
                    <Area
                      type="monotone"
                      dataKey="historicalDemand"
                      stroke="#1E6B2D"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#histGrad)"
                      name="Historical"
                    />

                    {/* Predicted curve */}
                    <Area
                      type="monotone"
                      dataKey="predictedDemand"
                      stroke="#D9822B"
                      strokeWidth={2.5}
                      strokeDasharray="4 4"
                      fillOpacity={1}
                      fill="url(#predGrad)"
                      name="Predicted"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* AI Model Input Features & Signals */}
          <div className="nexus-card">
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-soil-dark)', marginBottom: '12px' }}>
              Multi-Factor AI Model Inputs & Signal Attribution
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              {forecastData?.model_signals?.map((sig, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'var(--color-bg-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '12px 14px',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    {sig.factor}
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-soil-dark)', marginTop: '3px' }}>
                    {sig.weight}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: sig.impact === 'Positive' ? 'var(--color-crop)' : 'var(--color-text-secondary)', marginTop: '2px', fontWeight: 600 }}>
                    Impact: {sig.impact}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: REGIONAL DEMAND HEATMAP */}
      {subTab === 'heatmap' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Heatmap Overview Banner */}
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
                Regional Demand Intensity Matrix for {getCropDisplayName(selectedCrop)}
              </h3>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                Farmers and FPOs can visually route produce to High-Demand / Supply-Deficit zones to capture premium prices.
              </div>
            </div>

            {/* Legend & Search Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#DC2626' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#DC2626' }} />
                  HIGH DEMAND 🔴
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#D97706' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#D97706' }} />
                  MEDIUM DEMAND 🟠
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#1E6B2D' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#1E6B2D' }} />
                  LOW / BALANCED 🟢
                </span>
              </div>

              <input
                type="text"
                className="nexus-input"
                placeholder="Search mandis in heatmap..."
                value={heatmapSearch}
                onChange={(e) => setHeatmapSearch(e.target.value)}
                style={{ width: '220px', padding: '6px 12px', fontSize: '0.82rem' }}
              />
            </div>
          </div>

          {/* Regional Heatmap Cards Grid */}
          {loadingHeatmap ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <RefreshCw size={28} className="spin-icon" style={{ margin: '0 auto 8px auto', color: 'var(--color-crop)' }} />
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                Scanning regional APMC mandis and institutional demand signals...
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {heatmapData?.regions
                ?.filter((reg) => {
                  if (!heatmapSearch) return true;
                  const q = heatmapSearch.toLowerCase();
                  return (
                    reg.region.toLowerCase().includes(q) ||
                    (reg.district && reg.district.toLowerCase().includes(q)) ||
                    (reg.state && reg.state.toLowerCase().includes(q))
                  );
                })
                ?.map((reg) => {
                  const isHigh = reg.demand_level === 'HIGH';
                  const isMed = reg.demand_level === 'MEDIUM';

                  return (
                    <div
                      key={reg.region}
                      style={{
                        background: 'white',
                        border: `2px solid ${reg.demand_color}`,
                        borderRadius: 'var(--radius-md)',
                        padding: '16px',
                        boxShadow: 'var(--shadow-sm)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        {/* Top Badge */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span
                            style={{
                              background: `${reg.demand_color}15`,
                              color: reg.demand_color,
                              fontSize: '0.74rem',
                              fontWeight: 800,
                              padding: '3px 8px',
                              borderRadius: '12px'
                            }}
                          >
                            {reg.demand_level} DEMAND
                          </span>

                          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                            {reg.district ? `${reg.district}, ${reg.state}` : reg.state}
                          </span>
                        </div>

                        <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-soil-dark)', margin: 0 }}>
                          {reg.region}
                        </h4>

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
                            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                              Daily Demand
                            </div>
                            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-soil-dark)' }}>
                              {reg.daily_demand_kg.toLocaleString()} kg
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                              Status
                            </div>
                            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: reg.supply_gap_kg > 0 ? '#DC2626' : '#1E6B2D' }}>
                              {reg.status}
                            </div>
                          </div>
                        </div>

                        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                          Prevailing Modal Price: <strong>₹{reg.market_price_kg}/kg</strong>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                          Farmer Margin Premium: <strong style={{ color: reg.demand_color }}>{reg.suggested_margin}</strong>
                        </div>
                      </div>

                      <div>
                        <div
                          style={{
                            borderTop: '1px solid var(--color-border)',
                            paddingTop: '10px',
                            marginTop: '12px',
                            fontSize: '0.72rem',
                            color: 'var(--color-text-muted)'
                          }}
                        >
                          {isHigh
                            ? '🔥 Recommend routing supply here for maximum price realization.'
                            : isMed
                            ? 'Stable institutional demand. Suitable for contract supply.'
                            : 'Local supply sufficient. Avoid over-supplying here.'}
                        </div>

                        <button
                          onClick={() => {
                            setSelectedLocation(reg.region);
                            setSubTab('forecast');
                          }}
                          style={{
                            width: '100%',
                            marginTop: '10px',
                            padding: '8px 12px',
                            background: '#E8F5E9',
                            border: '1px solid var(--color-crop)',
                            color: 'var(--color-crop)',
                            borderRadius: '6px',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                          }}
                        >
                          <TrendingUp size={14} /> View 7-Day Forecast for {reg.region}
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
