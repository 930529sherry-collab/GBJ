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

    // Create a stable layer group for markers
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
    const markersLayer = markersLayerRef.current;

    if (!map || !markersLayer) return;

    // Use clearLayers() instead of removing the group to prevent '_leaflet_pos' errors
    try {
      markersLayer.clearLayers();
    } catch (e) {
      console.warn("Could not clear layers, map might be unmounting.", e);
      return; // Stop execution if we can't clear
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
      markersLayer.addLayer(marker);
    });
    
    const nonUserMarkers = markers.filter((_, index) => !pins[index].isUser);
    if (nonUserMarkers.length > 0) {
        const group = L.featureGroup(nonUserMarkers);
        try {
            map.fitBounds(group.getBounds().pad(0.3));
        } catch(e) {
            // Ignore bounds error
        }
    }
  }, [pins, onPinClick]);

  return <div ref={mapContainerRef} className="relative w-full h-full" />;
};

export default MapPlaceholder;