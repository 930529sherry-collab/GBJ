import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';

export interface GeolocationPosition {
  lat: number;
  lng: number;
}

interface GeolocationContextState {
  position: GeolocationPosition | null;
  error: string | null;
  loading: boolean;
  requestLocation: () => void;
}

const GeolocationContext = createContext<GeolocationContextState | undefined>(undefined);

export const GeolocationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const requestLocation = () => {
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setError(null);
        setLoading(false);
      },
      (err) => {
        let errorMessage = '無法取得位置。';
        switch(err.code) {
            case err.PERMISSION_DENIED:
                errorMessage = "您已拒絕位置存取權限。";
                break;
            case err.POSITION_UNAVAILABLE:
                errorMessage = "目前無法偵測到您的位置。";
                break;
            case err.TIMEOUT:
                errorMessage = "取得位置資訊超時。";
                break;
        }
        setError(errorMessage);
        setPosition(null);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    requestLocation();
  }, []);

  const value = { position, error, loading, requestLocation };

  return (
    <GeolocationContext.Provider value={value}>
      {children}
    </GeolocationContext.Provider>
  );
};

export const useGeolocation = (): GeolocationContextState => {
  const context = useContext(GeolocationContext);
  if (context === undefined) {
    throw new Error('useGeolocation must be used within a GeolocationProvider');
  }
  return context;
};
