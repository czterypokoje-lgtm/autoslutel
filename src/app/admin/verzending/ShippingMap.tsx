'use client';
import { useEffect, useRef, useState } from 'react';
import type { Map, LayerGroup } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { shippingOrigin, type Coordinate } from '@/lib/kfcShippingTestModel';

export function ShippingMap({ target, english, targetLabel }: { target: Coordinate | null; english: boolean; targetLabel: string }) {
  const element = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const layers = useRef<LayerGroup | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => () => { map.current?.remove(); map.current = null; layers.current = null; }, []);
  useEffect(() => {
    let cancelled = false;
    void import('leaflet').then((L) => {
      if (cancelled || !element.current) return;
      const animate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const first = !map.current;
      if (!map.current) {
        map.current = L.map(element.current, { scrollWheelZoom: false }).setView(shippingOrigin.point, 15);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).on('tileerror', () => setFailed(true)).addTo(map.current);
        layers.current = L.layerGroup().addTo(map.current);
      }
      const instance = map.current;
      const overlay = layers.current!;
      overlay.clearLayers();
      const pin = (point: Coordinate, color: string, label: string) => {
        const name = document.createElement('span');
        name.textContent = label;
        L.circleMarker(point, { radius: 8, color: '#fff', weight: 2, fillColor: color, fillOpacity: 1 }).bindTooltip(name).addTo(overlay);
      };
      pin(shippingOrigin.point, '#a83215', english ? 'Dispatch address' : 'Afzendadres');
      if (target) {
        pin(target, '#234c76', targetLabel);
        L.polyline([shippingOrigin.point, target], { color: '#234c76', weight: 3, dashArray: '7 7' }).addTo(overlay);
        const bounds = L.latLngBounds([shippingOrigin.point, target]);
        const options = { padding: [36, 36] as Coordinate, maxZoom: 15 };
        if (first || !animate) instance.fitBounds(bounds, options);
        else instance.flyToBounds(bounds, { ...options, duration: 0.65 });
      } else {
        instance.setView(shippingOrigin.point, 15, { animate });
      }
    }).catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [target, english, targetLabel]);

  return <>
    <div ref={element} className="relative isolate min-h-[20rem] rounded-lg border bg-muted" role="region"
      aria-label={english ? 'Shipping map' : 'Verzendkaart'} />
    {failed && <p role="status" className="text-muted-foreground text-sm">{english ? 'Some map tiles could not load.' : 'Sommige kaartdelen konden niet worden geladen.'}</p>}
  </>;
}
