/**
 * hooks/useGeolocation.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Tracks user's real-time position.
 * • Reverse-geocodes city name for display.
 * • Debounces PUT /geo/update-location so we don't spam the backend.
 * • Returns stable coords for map & nearby-jobs queries.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { geoApi } from '../api/endpoints';

const DEBOUNCE_MS = 10_000; // push location at most once per 10 s

export const useGeolocation = ({ watchPosition = false } = {}) => {
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated);

  const [location, setLocation] = useState({
    latitude: null,
    longitude: null,
    city: 'Detecting…',
    error: null,
    loading: true,
  });

  const debounceTimer = useRef(null);

  // ── Reverse Geocode ────────────────────────────────────────────────────────
  const reverseGeocode = useCallback(async (lat, lng) => {
    try {
      // Production: swap to Mapbox / Google Maps geocoding API
      const res = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      );
      const data = await res.json();
      return data.city || data.locality || data.countryName || 'Unknown City';
    } catch {
      return 'Location Found';
    }
  }, []);

  // ── Push to Backend (debounced) ────────────────────────────────────────────
  const pushLocation = useCallback(
    (lat, lng) => {
      if (!isAuthenticated) return;
      clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(async () => {
        try {
          await geoApi.updateLocation({ latitude: lat, longitude: lng });
        } catch {
          // silently fail — non-critical
        }
      }, DEBOUNCE_MS);
    },
    [isAuthenticated]
  );

  // ── Geolocation Success Handler ────────────────────────────────────────────
  const onSuccess = useCallback(
    async (position) => {
      const { latitude, longitude } = position.coords;
      const city = await reverseGeocode(latitude, longitude);
      setLocation({ latitude, longitude, city, error: null, loading: false });
      pushLocation(latitude, longitude);
    },
    [reverseGeocode, pushLocation]
  );

  const onError = useCallback((err) => {
    setLocation((prev) => ({
      ...prev,
      error: err.message,
      city: 'Location Denied',
      loading: false,
    }));
  }, []);

  // ── Effect ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setLocation((prev) => ({ ...prev, error: 'Not supported', city: 'Unsupported', loading: false }));
      return;
    }

    const opts = { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 };

    if (watchPosition) {
      const id = navigator.geolocation.watchPosition(onSuccess, onError, opts);
      return () => {
        navigator.geolocation.clearWatch(id);
        clearTimeout(debounceTimer.current);
      };
    } else {
      navigator.geolocation.getCurrentPosition(onSuccess, onError, opts);
      return () => clearTimeout(debounceTimer.current);
    }
  }, [watchPosition, onSuccess, onError]);

  return location;
};
