import React, { useEffect, useRef } from 'react';
import * as L from 'leaflet';

interface MapPin {
  id: number | string;
  latlng: { lat: number; lng: number };
  isFriend?: boolean;
  isUser?: boolean; // New prop
  avatarUrl?: string;
  name?: string;
}

interface MapPlaceholderProps {
  pins: MapPin[];
  onPinClick: (id: number | string) => void;
  center?: [number, number];
  onMapReady: (map: L.Map) => void; // New prop
}

const MapPlaceholder: React.FC<MapPlaceholderProps> = ({ pins, onPinClick, center, onMapReady }) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize map
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    const initialCenter = center || [25.0479, 121.5318]; // Default to Taipei

    mapRef.current = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: 13,
        zoomControl: false, // Cleaner UI for mobile
    });
    
    onMapReady(mapRef.current); // Expose map instance

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(mapRef.current);

    // Add zoom control to a different position
    L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);

    // FIX: This is a common fix for a Leaflet race condition in React.
    // It ensures the map container size is correctly calculated after the initial render,
    // especially in complex layouts (like flexbox).
    const map = mapRef.current;
    setTimeout(() => {
        map.invalidateSize();
    }, 0);


    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  // Center map when center prop changes
  useEffect(() => {
    if(mapRef.current && center) {
        mapRef.current.setView(center, 13);
    }
  }, [center]);

  // Update markers when pins change
  useEffect(() => {
    if (!mapRef.current) return;

    // Force map to re-evaluate its size. This prevents errors when the map container's
    // size is not immediately available on render (e.g., due to CSS flexbox).
    mapRef.current.invalidateSize();

    // Initialize or clear the marker layer
    if (markerLayerRef.current) {
      markerLayerRef.current.clearLayers();
    } else {
      markerLayerRef.current = L.layerGroup().addTo(mapRef.current);
    }

    if (pins.length === 0) return;

    const markers: L.Marker[] = [];

    pins.forEach(pin => {
      let icon;
      if (pin.isUser) {
        icon = L.divIcon({
          html: `<div class="user-marker-ping"></div><img src="${pin.avatarUrl}" alt="${pin.name}" class="user-marker-avatar" />`,
          className: 'user-marker',
          iconSize: [48, 48],
          iconAnchor: [24, 24],
        });
      } else if (pin.isFriend) {
        icon = L.divIcon({
          html: `<img src="${pin.avatarUrl}" alt="${pin.name}" class="friend-marker-avatar" />`,
          className: 'friend-marker',
          iconSize: [48, 48],
          iconAnchor: [24, 48], // Anchor at bottom center of avatar
        });
      } else {
        icon = L.divIcon({
          html: `<div class="store-marker-ping"></div><div class="store-marker-dot"></div>`,
          className: 'store-marker',
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });
      }

      const marker = L.marker([pin.latlng.lat, pin.latlng.lng], { icon });
      
      if (!pin.isUser) {
        marker.on('click', () => onPinClick(pin.id));
      }
      
      marker.bindTooltip(pin.name || '', {
        direction: 'top',
        offset: pin.isUser ? [0, -24] : (pin.isFriend ? [0, -48] : [0, -10]), // Adjust offset based on pin type
        className: 'custom-tooltip'
      });
      
      markers.push(marker);
      markerLayerRef.current?.addLayer(marker);
    });
    
    // Fit map to bounds of all pins, excluding user pin for better view
    const nonUserMarkers = markers.filter((_, index) => !pins[index].isUser);
    if (nonUserMarkers.length > 0) {
        const group = L.featureGroup(nonUserMarkers);
        mapRef.current.fitBounds(group.getBounds().pad(0.3));
    }

  }, [pins, onPinClick]);

  return <div ref={mapContainerRef} className="relative w-full h-full" />;
};

export default MapPlaceholder;