
import React, { useEffect, useRef } from 'react';
import * as L from 'leaflet';

interface MapPin {
  id: number | string;
  latlng: { lat: number; lng: number };
  isFriend?: boolean;
  isUser?: boolean; // New prop
  avatarUrl?: string;
  name?: string;
  onlineStatus?: boolean;
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
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize map
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    const initialCenter = center || [25.0479, 121.5318]; // Default to Taipei

    const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: 13,
        zoomControl: false, // Cleaner UI for mobile
    });
    
    mapRef.current = map;
    onMapReady(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = layerGroup;

    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (e) {
            console.warn("Map remove failed, likely already gone:", e);
        }
        mapRef.current = null;
        markersLayerRef.current = null;
      }
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
    const map = mapRef.current;
    let layerGroup = markersLayerRef.current;

    if (!map) return;
    
    // If layer group doesn't exist for some reason, recreate it
    if (!layerGroup) {
      layerGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = layerGroup;
    }

    // Always clear existing markers before adding new ones
    layerGroup.clearLayers();

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
        const onlineClass = pin.onlineStatus ? 'bg-green-500' : 'bg-gray-400';
        icon = L.divIcon({
          html: `
            <div class="relative">
              <img src="${pin.avatarUrl}" alt="${pin.name}" class="w-12 h-12 rounded-full object-cover border-2 border-brand-accent shadow-lg" />
              <div class="absolute bottom-0 right-0 w-3 h-3 ${onlineClass} rounded-full border-2 border-brand-primary"></div>
            </div>
          `,
          className: 'friend-marker',
          iconSize: [48, 48],
          iconAnchor: [24, 48],
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
        offset: pin.isUser ? [0, -24] : (pin.isFriend ? [0, -48] : [0, -10]),
        className: 'custom-tooltip'
      });
      
      markers.push(marker);
    });

    markers.forEach(marker => layerGroup?.addLayer(marker));
    
  }, [pins, onPinClick]);

  return <div ref={mapContainerRef} className="relative w-full h-full" />;
};

export default MapPlaceholder;
