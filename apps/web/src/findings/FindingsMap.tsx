import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import type { FindingFeature, GeoJsonGeometry } from "../lib/api";
import styles from "./FindingsMap.module.css";

export default function FindingsMap(props: {
  features: FindingFeature[];
  onSelect: (findingId: string) => void;
}) {
  const container = useRef<HTMLDivElement | null>(null);
  const onSelect = useRef(props.onSelect);
  onSelect.current = props.onSelect;
  const serialized = JSON.stringify(props.features);

  useEffect(() => {
    const element = container.current;
    if (!element) return undefined;
    const features = (JSON.parse(serialized) as FindingFeature[]).flatMap((feature) => (
      feature.geometry ? [{ ...feature, geometry: feature.geometry }] : []
    ));
    const map = new maplibregl.Map({
      container: element,
      style: {
        version: 8,
        sources: {},
        layers: [{ id: "background", type: "background", paint: { "background-color": "#d7e0d8" } }],
      },
      center: [0, 0],
      zoom: 1,
      attributionControl: false,
    });
    map.on("load", () => {
      map.addSource("findings", { type: "geojson", data: { type: "FeatureCollection", features } });
      map.addLayer({
        id: "findings-fill",
        type: "fill",
        source: "findings",
        paint: {
          "fill-color": ["match", ["get", "severity"], "error", "#9b2c2c", "warning", "#8a5a00", "info", "#1d4e89", "#555555"],
          "fill-opacity": 0.55,
        },
      });
      map.addLayer({
        id: "findings-line",
        type: "line",
        source: "findings",
        paint: { "line-color": "#10221a", "line-width": 2 },
      });
      const bounds = new maplibregl.LngLatBounds();
      for (const feature of features) extendBounds(bounds, feature.geometry);
      if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 32, maxZoom: 14 });
    });
    map.on("click", "findings-fill", (event) => {
      const findingId = event.features?.[0]?.properties.findingId;
      if (typeof findingId === "string") onSelect.current(findingId);
    });
    return () => map.remove();
  }, [serialized]);

  return <div ref={container} className={styles.map} role="application" aria-label="Findings map" />;
}

function extendBounds(bounds: maplibregl.LngLatBounds, geometry: GeoJsonGeometry | null): void {
  if (!geometry) return;
  const rings = geometry.type === "Polygon" ? geometry.coordinates : geometry.coordinates.flat();
  for (const ring of rings) {
    for (const position of ring) bounds.extend([position[0] ?? 0, position[1] ?? 0]);
  }
}
