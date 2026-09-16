import { useEffect, useState } from "react";

import { getFindings, type FeatureCollection } from "./lib/api";

export default function App() {
  const [findings, setFindings] = useState<FeatureCollection | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getFindings().then(setFindings).catch((reason: unknown) => {
      setError(reason instanceof Error ? reason.message : "Could not load findings.");
    });
  }, []);

  return (
    <main>
      <header>
        <p className="eyebrow">Geospatial Quality Explorer</p>
        <h1>Verified spatial findings, ready to inspect.</h1>
        <p>
          The first screen proves the frontend/API contract. The interactive MapLibre view
          arrives with the findings-map issue.
        </p>
      </header>
      <section aria-live="polite" className="panel">
        {error && <p role="alert">{error}</p>}
        {!error && !findings && <p>Loading findings…</p>}
        {findings && <p>{findings.features.length} findings returned by the API.</p>}
      </section>
    </main>
  );
}
