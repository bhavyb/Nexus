import React, { useState } from 'react';
import { Sprout, RefreshCw, Database, AlertCircle, CheckCircle2, SlidersHorizontal } from 'lucide-react';
import DatasetManagerModal from './DatasetManagerModal.jsx';

export default function Header({ statusData, onRefreshSuccess, user, onLogout }) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState(null);
  const [refreshToast, setRefreshToast] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    setRefreshError(null);
    setRefreshToast(null);
    try {
      const res = await fetch('/api/refresh-data?mode=sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setRefreshToast(data.message || 'Live Agmarknet market rates refreshed for today!');
        if (onRefreshSuccess) onRefreshSuccess();
        setTimeout(() => setRefreshToast(null), 4000);
      } else {
        setRefreshError(data.error || 'Refresh failed');
        setTimeout(() => setRefreshError(null), 5000);
      }
    } catch (err) {
      setRefreshError('Could not connect to backend server');
      setTimeout(() => setRefreshError(null), 5000);
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
    <>
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
            {/* Clickable interactive status pill */}
            <button
              type="button"
              className={`data-status-pill interactive-pill ${isLive ? 'live-border' : ''}`}
              onClick={() => setIsModalOpen(true)}
              title="Click to open Live Dataset Manager (Upload custom data, sync rates, or configure OGD API key)"
            >
              <span className={`status-indicator-dot ${isLive ? 'live' : 'cached'}`} />
              <Database size={14} />
              <span>
                <strong>{isLive ? 'Live Gov Data' : 'Cached Agmarknet'}</strong>: {lastUpdated}
              </span>
              <span className="pill-action-tag">Manage</span>
            </button>

            <button
              className="refresh-btn"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              title="Synchronize live Agmarknet market rates for today"
            >
              <RefreshCw size={14} className={isRefreshing ? 'spin-icon' : ''} />
              <span>{isRefreshing ? 'Synchronizing...' : 'Refresh Data'}</span>
            </button>

            {user && (
              <div className="user-menu">
                <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
                <div className="user-identity">
                  <strong>{user.name}</strong>
                  <span>
                    {user.role === 'customer'
                      ? 'Customer / Buyer'
                      : user.role === 'logistics'
                      ? 'Logistics Partner'
                      : 'Farmer / FPO'}
                  </span>
                </div>
                <button className="logout-btn" onClick={onLogout}>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Global Toast for Refresh and Status Feedback */}
        {refreshToast && (
          <div className="header-toast-notification toast-success">
            <CheckCircle2 size={16} />
            <span>{refreshToast}</span>
          </div>
        )}
        {refreshError && (
          <div className="header-toast-notification toast-error">
            <AlertCircle size={16} />
            <span>{refreshError}</span>
          </div>
        )}
      </header>

      {/* Dataset Manager Modal */}
      <DatasetManagerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        statusData={statusData}
        onDataUpdated={() => {
          if (onRefreshSuccess) onRefreshSuccess();
        }}
      />
    </>
  );
}
