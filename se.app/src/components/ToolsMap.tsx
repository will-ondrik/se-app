import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Tool } from '@/types';
import { useNavigate } from 'react-router-dom';

interface ToolsMapProps {
  tools: Tool[];
  mapboxToken: string;
}

export function ToolsMap({ tools, mapboxToken }: ToolsMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const navigate = useNavigate();
  const [mapError, setMapError] = useState<string>("");

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    try {
      mapboxgl.accessToken = mapboxToken;
      
      // Initialize map centered on Okanagan region (Armstrong to Okanagan Falls)
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-119.5, 49.9], // Center of Okanagan region
        zoom: 9,
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Clear existing markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];

      // Add markers for each tool with location data
      map.current.on('load', () => {
        tools.forEach((tool) => {
          // For demo purposes, distribute tools across the Okanagan region
          // In production, tools would have actual lat/lng coordinates
          const lat = 49.7 + Math.random() * 0.6; // Armstrong (50.4) to OK Falls (49.3)
          const lng = -119.3 - Math.random() * 0.5;

          const markerElement = document.createElement('div');
          markerElement.className = 'custom-marker';
          markerElement.style.cssText = `
            width: 30px;
            height: 30px;
            border-radius: 50%;
            background-color: ${tool.isAvailable ? 'hsl(var(--primary))' : 'hsl(var(--muted))'};
            border: 2px solid hsl(var(--background));
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            color: white;
            font-weight: bold;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          `;
          markerElement.textContent = tool.name.substring(0, 1);

          const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div style="padding: 8px;">
              <h3 style="font-weight: bold; margin-bottom: 4px; color: hsl(var(--foreground));">${tool.name}</h3>
              <p style="margin: 2px 0; font-size: 12px; color: hsl(var(--muted-foreground));">
                Status: ${tool.isAvailable ? 'Available' : 'In Use'}
              </p>
              <p style="margin: 2px 0; font-size: 12px; color: hsl(var(--muted-foreground));">
                Condition: ${tool.condition}
              </p>
              ${tool.assignedTo ? `<p style="margin: 2px 0; font-size: 12px; color: hsl(var(--muted-foreground));">
                Assigned: ${tool.assignedTo.firstName} ${tool.assignedTo.lastName}
              </p>` : ''}
            </div>
          `);

          const marker = new mapboxgl.Marker(markerElement)
            .setLngLat([lng, lat])
            .setPopup(popup)
            .addTo(map.current!);

          markerElement.addEventListener('click', () => {
            navigate(`/tools/${tool.id}`);
          });

          markersRef.current.push(marker);
        });
      });

      setMapError("");
    } catch (error) {
      setMapError("Failed to load map. Please check your Mapbox token.");
      console.error("Map error:", error);
    }

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      map.current?.remove();
    };
  }, [tools, mapboxToken, navigate]);

  if (!mapboxToken) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-muted/20 rounded-lg border border-border">
        <p className="text-muted-foreground">Please enter your Mapbox token to view the map</p>
      </div>
    );
  }

  if (mapError) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-destructive/10 rounded-lg border border-destructive">
        <p className="text-destructive">{mapError}</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div ref={mapContainer} className="h-[600px] rounded-lg shadow-lg border border-border" />
      <div className="absolute top-4 left-4 bg-card/95 backdrop-blur p-3 rounded-lg shadow-lg border border-border">
        <p className="text-xs text-muted-foreground mb-1">Map Legend</p>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--primary))' }}></div>
          <span className="text-foreground">Available</span>
        </div>
        <div className="flex items-center gap-2 text-xs mt-1">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--muted))' }}></div>
          <span className="text-foreground">In Use</span>
        </div>
      </div>
    </div>
  );
}