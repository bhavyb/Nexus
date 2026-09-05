import React, { useState } from 'react';
import { Sprout, RefreshCw, Database, AlertCircle } from 'lucide-react';

export default function Header({ statusData, onRefreshSuccess, user, onLogout }) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState(null);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    setRefreshError(null);
    try {
      const res = await fetch('/api/refresh-data', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        if (onRefreshSuccess) onRefreshSuccess();
      } else {
        setRefreshError(data.error || 'Refresh failed');
      }
    } catch (err) {
      setRefreshError('Could not connect to backend server');
    } finally {
      setIsRefreshing(false);
    }
  };

  const isLive = statusData?.is_live ?? false;
  const lastUpdated = statusData?.last_updated
    ? new Date(statusData.last_updated).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      })
    : 'Synchronizing...';

  return (
    <header className="site-header">
      <div className="header-inner">
        <div className="brand-section">
          <div className="brand-icon">
            <Sprout size={26} strokeWidth={2.4} />
          </div>
          <div>
            <div className="brand-title">
              annDhara
            </div>
            <div className="brand-tagline">
              AI Market Intelligence & Fair Price Discovery for Indian Farmers
            </div>
          </div>
        </div>

        <div className="header-controls">
          <div className="data-status-pill">
            <span className={`status-indicator-dot ${isLive ? 'live' : 'cached'}`} />
            <Database size={14} />
            <span>
              <strong>{isLive ? 'Live Gov Data' : 'Cached Agmarknet'}</strong>: {lastUpdated}
            </span>
          </div>

          <button
            className="refresh-btn"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            title="Fetch fresh data from data.gov.in"
          >
            <RefreshCw size={14} className={isRefreshing ? 'spin-icon' : ''} />
            <span>{isRefreshing ? 'Pulling Data...' : 'Refresh Data'}</span>
          </button>
          {user && (
            <div className="user-menu">
              <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
              <div className="user-identity"><strong>{user.name}</strong><span>{user.role === 'customer' ? 'Customer / Buyer' : user.role === 'logistics' ? 'Logistics Partner' : 'Farmer / FPO'}</span></div>
              <button className="logout-btn" onClick={onLogout}>Sign out</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
