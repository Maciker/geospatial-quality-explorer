import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import type { GeoJsonGeometry } from "../lib/api";
import {
  featuresForFit,
  padBoundsForSelection,
  type FindingMapFeature,
  type SourceMapFeature,
} from "./mapFeatures";
import styles from "./FindingsMap.module.css";

type Props = {
  sourceFeatures: SourceMapFeature[];
  findingFeatures: FindingMapFeature[];
  selectedFindingId: string | null;
  fitNonce: number;
  provenanceLabel: string | null;
  onSelect: (findingId: string) => void;
  /** When true, keep a 420px floor for pages without a sized parent (FindingsReview). */
  standaloneHeight?: boolean;
};

export default function FindingsMap(props: Props) {
  const container = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const onSelect = useRef(props.onSelect);
  onSelect.current = props.onSelect;
  const lastFitNonce = useRef<number | null>(null);

  useEffect(() => {
    const element = container.current;
    if (!element || mapRef.current) return undefined;
    const map = new maplibregl.Map({
      container: element,
      style: {
        version: 8,
        sources: {},
        layers: [{ id: "background", type: "background", paint: { "background-color": "#c5d4e0" } }],
      },
      center: [2, 46],
      zoom: 3,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    const resizeObserver = typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(() => {
          map.resize();
        });
    resizeObserver?.observe(element);
    map.on("load", () => {
      map.addSource("source-layer", { type: "geojson", data: emptyCollection() });
      map.addSource("findings", { type: "geojson", data: emptyCollection() });
      map.addLayer({
        id: "source-fill",
        type: "fill",
        source: "source-layer",
        paint: { "fill-color": "#f4f0e6", "fill-opacity": 0.85 },
      });
      map.addLayer({
        id: "source-line",
        type: "line",
        source: "source-layer",
        paint: { "line-color": "#5a6a5c", "line-width": 1 },
      });
      map.addLayer({
        id: "findings-fill",
        type: "fill",
        source: "findings",
        paint: {
          "fill-color": [
            "case",
            ["==", ["get", "findingId"], props.selectedFindingId ?? ""],
            "#f5c542",
            ["match", ["get", "severity"], "error", "#9b2c2c", "warning", "#8a5a00", "info", "#1d4e89", "#555555"],
          ],
          "fill-opacity": [
            "case",
            ["==", ["get", "findingId"], props.selectedFindingId ?? ""],
            0.72,
            0.22,
          ],
        },
      });
      map.addLayer({
        id: "findings-line",
        type: "line",
        source: "findings",
        paint: {
          "line-color": [
            "case",
            ["==", ["get", "findingId"], props.selectedFindingId ?? ""],
            "#1a1a1a",
            "#6b7a6d",
          ],
          "line-width": [
            "case",
            ["==", ["get", "findingId"], props.selectedFindingId ?? ""],
            4.5,
            1.25,
          ],
        },
      });
      map.on("click", "findings-fill", (event) => {
        const findingId = event.features?.[0]?.properties?.findingId;
        if (typeof findingId === "string") onSelect.current(findingId);
      });
      map.on("click", "findings-line", (event) => {
        const findingId = event.features?.[0]?.properties?.findingId;
        if (typeof findingId === "string") onSelect.current(findingId);
      });
    });
    mapRef.current = map;
    return () => {
      resizeObserver?.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    let cancelled = false;
    const apply = () => {
      if (cancelled) return;
      const source = map.getSource("source-layer") as maplibregl.GeoJSONSource | undefined;
      const findings = map.getSource("findings") as maplibregl.GeoJSONSource | undefined;
      source?.setData({
        type: "FeatureCollection",
        features: props.sourceFeatures as GeoJSON.Feature[],
      });
      findings?.setData({
        type: "FeatureCollection",
        features: props.findingFeatures as GeoJSON.Feature[],
      });
      if (map.getLayer("findings-fill")) {
        map.setPaintProperty("findings-fill", "fill-color", [
          "case",
          ["==", ["get", "findingId"], props.selectedFindingId ?? ""],
          "#f5c542",
          ["match", ["get", "severity"], "error", "#9b2c2c", "warning", "#8a5a00", "info", "#1d4e89", "#555555"],
        ]);
        map.setPaintProperty("findings-fill", "fill-opacity", [
          "case",
          ["==", ["get", "findingId"], props.selectedFindingId ?? ""],
          0.72,
          0.22,
        ]);
      }
      if (map.getLayer("findings-line")) {
        map.setPaintProperty("findings-line", "line-color", [
          "case",
          ["==", ["get", "findingId"], props.selectedFindingId ?? ""],
          "#1a1a1a",
          "#6b7a6d",
        ]);
        map.setPaintProperty("findings-line", "line-width", [
          "case",
          ["==", ["get", "findingId"], props.selectedFindingId ?? ""],
          4.5,
          1.25,
        ]);
      }
      if (lastFitNonce.current !== props.fitNonce) {
        lastFitNonce.current = props.fitNonce;
        fitToLayers(map, props.sourceFeatures, props.findingFeatures, props.selectedFindingId);
      }
    };
    if (map.isStyleLoaded()) apply();
    else map.once("load", apply);
    return () => {
      cancelled = true;
      map.off("load", apply);
    };
  }, [props.sourceFeatures, props.findingFeatures, props.selectedFindingId, props.fitNonce]);

  return (
    <div className={props.standaloneHeight ? styles.mapShellStandalone : styles.mapShell}>
      <div className={styles.toolbar}>
        <button
          type="button"
          onClick={() => {
            const map = mapRef.current;
            if (!map) return;
            lastFitNonce.current = null;
            fitToLayers(map, props.sourceFeatures, props.findingFeatures, props.selectedFindingId);
          }}
        >
          Fit layer
        </button>
        <div className={styles.legend} aria-label="Map legend">
          <span><i className={styles.legendSource} /> Source</span>
          <span><i className={styles.legendError} /> Error</span>
          <span><i className={styles.legendWarning} /> Warning</span>
        </div>
        {props.provenanceLabel != null && (
          <p className={styles.provenance} aria-label="Layer provenance" title={props.provenanceLabel}>
            {props.provenanceLabel}
          </p>
        )}
      </div>
      <div
        ref={container}
        className={`${styles.map}${props.standaloneHeight ? ` ${styles.mapStandalone}` : ""}`}
        role="application"
        aria-label="Findings map"
      />
    </div>
  );
}

function emptyCollection(): GeoJSON.FeatureCollection {
  return { type: "FeatureCollection", features: [] };
}

function fitToLayers(
  map: maplibregl.Map,
  sourceFeatures: readonly SourceMapFeature[],
  findingFeatures: readonly FindingMapFeature[],
  selectedFindingId: string | null,
): void {
  const selected = findingFeatures.find((feature) => feature.properties.findingId === selectedFindingId);
  const bounds = new maplibregl.LngLatBounds();
  const focus = featuresForFit(sourceFeatures, findingFeatures, selectedFindingId);
  for (const feature of focus) extendBounds(bounds, feature.geometry);
  if (bounds.isEmpty()) return;
  if (selected) {
    const padded = padBoundsForSelection(
      {
        west: bounds.getWest(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        north: bounds.getNorth(),
      },
      2,
    );
    bounds.extend([padded.west, padded.south]);
    bounds.extend([padded.east, padded.north]);
    map.fitBounds(bounds, { padding: 56, maxZoom: 6 });
    return;
  }
  map.fitBounds(bounds, { padding: 36, maxZoom: 5 });
}

function extendBounds(bounds: maplibregl.LngLatBounds, geometry: GeoJsonGeometry | null): void {
  if (!geometry) return;
  const rings = geometry.type === "Polygon" ? geometry.coordinates : geometry.coordinates.flat();
  for (const ring of rings) {
    for (const position of ring) bounds.extend([position[0] ?? 0, position[1] ?? 0]);
  }
}
