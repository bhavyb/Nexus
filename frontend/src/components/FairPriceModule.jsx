import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Calendar,
  Layers,
  Info,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { getCropDisplayName } from '../utils/cropTranslations';

export default function FairPriceModule({ commodities, initialCrop }) {
  const [selectedCrop, setSelectedCrop] = useState(initialCrop || 'Onion');
  const [mandisList, setMandisList] = useState([]);
  const [selectedMandi, setSelectedMandi] = useState('');
  const [loadingMandis, setLoadingMandis] = useState(false);
  const [forecastData, setForecastData] = useState(null);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [error, setError] = useState(null);

  // When crop changes, load available mandis reporting this crop
  useEffect(() => {
    if (!selectedCrop) return;
    setLoadingMandis(true);
    fetch(`/api/mandis?commodity=${encodeURIComponent(selectedCrop)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.mandis.length > 0) {
          setMandisList(data.mandis);
          // Default to first mandi or preserve if exists
          const exists = data.mandis.find((m) => m.market === selectedMandi);
          setSelectedMandi(exists ? exists.market : data.mandis[0].market);
        } else {
          setMandisList([]);
          setSelectedMandi('');
        }
      })
      .catch(() => setError('Failed to load mandis list'))
      .finally(() => setLoadingMandis(false));
  }, [selectedCrop]);

  // When crop & mandi are selected, fetch Prophet forecast
  useEffect(() => {
    if (!selectedCrop || !selectedMandi) return;
    fetchForecast(false);
  }, [selectedCrop, selectedMandi]);

  const fetchForecast = (retrain = false) => {
    setLoadingForecast(true);
    setError(null);
    const url = `/api/fair-price?crop=${encodeURIComponent(selectedCrop)}&mandi=${encodeURIComponent(
      selectedMandi
    )}${retrain ? '&retrain=true' : ''}`;

    fetch(url)
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          setForecastData(res.data);
        } else {
          setError(res.error || 'Failed to forecast fair price');
        }
      })
      .catch(() => setError('Could not connect to forecasting service'))
      .finally(() => setLoadingForecast(false));
  };

  // Combine historical and 7-day forecast points for the chart
  const getChartSeries = () => {
    if (!forecastData) return [];
    const hist = (forecastData.historical_points || []).map((p) => ({
      date: p.display_date,
      actualPrice: p.actual_price_kg,
      fairForecast: null,
      bandLower: null,
      bandUpper: null,
      isHistorical: true
    }));

    // Connect the last historical point to the forecast
    const lastHist = hist[hist.length - 1];

    const forecast = (forecastData.forecast_7_days || []).map((f) => ({
      date: f.display_date,
      actualPrice: null,
      fairForecast: f.predicted_price_kg,
      bandLower: f.lower_band_kg,
      bandUpper: f.upper_band_kg,
      isForecast: true
    }));

    if (lastHist && forecast.length > 0) {
      forecast[0].actualPrice = lastHist.actualPrice;
    }

    return [...hist, ...forecast];
  };

  const chartData = getChartSeries();
  const bandKg = forecastData?.fair_price_band_kg;
  const trend = forecastData?.trend_summary;

  return (
    <div className="nexus-card">
      <div className="card-header-bar">
        <div className="card-title-group">
          <div className="card-icon-pill">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="card-title">Module 1: Fair Price Predictor</h2>
            <p className="card-subtitle">
              Time-series AI forecasting (Facebook Prophet) predicting next 7 days' fair price band
            </p>
          </div>
        </div>

        {forecastData?.model_engine && (
          <div className="data-status-pill">
            <Layers size={13} />
            <span>
              Engine: <strong>{forecastData.model_engine}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Dynamic Dropdowns (Never Hardcoded) */}
      <div className="form-grid">
        <div className="input-group">
          <label className="input-label" htmlFor="crop-select">
            Select Agricultural Commodity
          </label>
          <select
            id="crop-select"
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
          <label className="input-label" htmlFor="mandi-select">
            Select Mandi / Market {loadingMandis && '(Loading...)'}
          </label>
          <select
            id="mandi-select"
            className="nexus-select"
            value={selectedMandi}
            onChange={(e) => setSelectedMandi(e.target.value)}
            disabled={loadingMandis || mandisList.length === 0}
          >
            {mandisList.map((m) => (
              <option key={m.market} value={m.market}>
                {m.market} ({m.state || m.district})
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="nexus-alert danger">
          <Info size={18} />
          <span>{error}</span>
        </div>
      )}

      {loadingForecast && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-soil)' }}>
          <RefreshCw size={28} className="spin-icon" style={{ margin: '0 auto 12px auto' }} />
          <p style={{ fontWeight: 600 }}>Training Prophet Model & Forecasting Fair Price...</p>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
            Processing arrival price history for {selectedCrop} at {selectedMandi}
          </span>
        </div>
      )}

      {!loadingForecast && forecastData && (
        <div>
          {/* Fair Price Band Banner */}
          <div className="band-banner">
            <div className="band-stat-group">
              <div className="band-stat">
                <span className="band-stat-label">Today's Reported Modal</span>
                <span className="band-stat-value">
                  ₹{forecastData.current_modal_price_kg}{' '}
                  <span style={{ fontSize: '1rem', fontWeight: 500 }}>/kg</span>
                </span>
                <span className="band-stat-sub">
                  ₹{forecastData.current_modal_price_quintal} / quintal
                </span>
              </div>

              <div className="band-stat">
                <span className="band-stat-label">AI Fair Price Band (7-Day Target)</span>
                <span className="band-stat-value" style={{ color: '#FDE68A' }}>
                  ₹{bandKg?.min} – ₹{bandKg?.max}{' '}
                  <span style={{ fontSize: '1rem', fontWeight: 500 }}>/kg</span>
                </span>
                <span className="band-stat-sub">
                  Recommended Fair Benchmark: ₹{bandKg?.fair} / kg
                </span>
              </div>
            </div>

            <div>
              <div
                className={`trend-badge-pill ${
                  trend?.direction.includes('Rising')
                    ? 'rising'
                    : trend?.direction.includes('Softening')
                    ? 'falling'
                    : 'stable'
                }`}
              >
                {trend?.direction.includes('Rising') && <TrendingUp size={16} />}
                {trend?.direction.includes('Softening') && <TrendingDown size={16} />}
                {trend?.direction.includes('Stable') && <Minus size={16} />}
                <span>
                  {trend?.direction} ({trend?.change_pct > 0 ? '+' : ''}
                  {trend?.change_pct}%)
                </span>
              </div>
            </div>
          </div>

          {/* Actionable Recommendation Alert */}
          <div className="nexus-alert success" style={{ marginBottom: '24px' }}>
            <CheckCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Farmer Selling Guidance: </strong>
              {trend?.recommendation}
            </div>
          </div>

          {/* 7-Day Trend Chart */}
          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-soil)' }}>
                14-Day Price History & 7-Day Prophet Forward Forecast
              </h3>
              <button
                className="refresh-btn"
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                onClick={() => fetchForecast(true)}
                title="Force retrain model on latest records"
              >
                <RefreshCw size={12} /> Retrain Model
              </button>
            </div>

            <div style={{ height: 320, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fairColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D9822B" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#D9822B" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="actualColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1E6B2D" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#1E6B2D" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7E0D3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#78716C' }} />
                  <YAxis
                    unit=" ₹"
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 12, fill: '#78716C' }}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div
                            style={{
                              background: 'white',
                              padding: '10px 14px',
                              border: '1px solid #E7E0D3',
                              borderRadius: '8px',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                              fontSize: '0.85rem'
                            }}
                          >
                            <div style={{ fontWeight: 700, marginBottom: '6px' }}>Date: {label}</div>
                            {data.actualPrice !== null && (
                              <div style={{ color: '#1E6B2D' }}>
                                Actual Modal Price: <strong>₹{data.actualPrice} / kg</strong>
                              </div>
                            )}
                            {data.fairForecast !== null && (
                              <>
                                <div style={{ color: '#D9822B' }}>
                                  Prophet Fair Forecast: <strong>₹{data.fairForecast} / kg</strong>
                                </div>
                                <div style={{ color: '#78716C', fontSize: '0.75rem' }}>
                                  Confidence Band: ₹{data.bandLower} – ₹{data.bandUpper} / kg
                                </div>
                              </>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend verticalAlign="top" height={36} />
                  <Area
                    type="monotone"
                    dataKey="actualPrice"
                    name="Actual Mandi Arrival (₹/kg)"
                    stroke="#1E6B2D"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#actualColor)"
                  />
                  <Area
                    type="monotone"
                    dataKey="fairForecast"
                    name="Prophet 7-Day Forecast (₹/kg)"
                    stroke="#D9822B"
                    strokeWidth={2.5}
                    strokeDasharray="4 4"
                    fillOpacity={1}
                    fill="url(#fairColor)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
