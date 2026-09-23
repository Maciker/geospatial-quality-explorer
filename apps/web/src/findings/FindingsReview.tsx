import { useEffect, useState } from "react";

import FindingsMap from "./FindingsMap";
import {
  ApiError,
  cancelJob,
  getFindings,
  getJob,
  getRun,
  importDataset,
  type FindingCollection,
  type FindingFeature,
  type ImportJob,
  type RunSummary,
} from "../lib/api";
import styles from "./FindingsReview.module.css";

type Screen =
  | { kind: "need-run" }
  | { kind: "loading" }
  | { kind: "unknown" }
  | { kind: "error"; message: string }
  | { kind: "ready"; run: RunSummary; page: FindingCollection; selectedId: string | null };

export default function FindingsReview(props: { search: string; onSearch: (search: string) => void }) {
  const [screen, setScreen] = useState<Screen>({ kind: "loading" });
  const [job, setJob] = useState<ImportJob | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(props.search);
    const runId = params.get("run");
    if (!runId) {
      setScreen({ kind: "need-run" });
      return undefined;
    }
    let cancelled = false;
    setScreen({ kind: "loading" });
    Promise.all([getRun(runId), getFindings(runId, params)])
      .then(([run, page]) => {
        if (!cancelled) setScreen({ kind: "ready", run, page, selectedId: page.features[0]?.properties.findingId ?? null });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 404) setScreen({ kind: "unknown" });
        else setScreen({ kind: "error", message: error instanceof Error ? error.message : "Could not load findings." });
      });
    return () => {
      cancelled = true;
    };
  }, [props.search]);

  useEffect(() => {
    if (!job || (job.status !== "pending" && job.status !== "running")) return undefined;
    let cancelled = false;
    const timer = setInterval(() => {
      getJob(job.jobId)
        .then((next) => {
          if (!cancelled) setJob(next);
        })
        .catch((error: unknown) => {
          if (!cancelled) setImportError(error instanceof Error ? error.message : "Could not read the import job.");
        });
    }, 300);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [job]);

  const selected = screen.kind === "ready"
    ? screen.page.features.find((feature) => feature.properties.findingId === screen.selectedId) ?? null
    : null;

  return (
    <main className={styles.page}>
      <header>
        <p className={styles.eyebrow}>Geospatial Quality Explorer</p>
        <h1>Review a completed validation run.</h1>
        <p>Findings come from the stored run. The map does not invent results, and it does not download a basemap.</p>
      </header>
      <ImportPanel
        job={job}
        error={importError}
        onImported={setJob}
        onError={setImportError}
        onOpenRun={(runId) => props.onSearch(`?run=${runId}`)}
        onCancel={async () => {
          if (!job) return;
          setJob(await cancelJob(job.jobId));
        }}
      />
      <FilterForm search={props.search} onSearch={props.onSearch} />
      <section aria-live="polite">
        {screen.kind === "need-run" && <p>Choose a completed run to review its findings.</p>}
        {screen.kind === "loading" && <p>Loading findings…</p>}
        {screen.kind === "unknown" && <p role="alert">This run is unknown. No findings were invented for it.</p>}
        {screen.kind === "error" && <p role="alert">{screen.message}</p>}
      </section>
      {screen.kind === "ready" && (
        <>
          <Provenance run={screen.run} />
          <div className={styles.layout}>
            <FindingList
              features={screen.page.features}
              selectedId={screen.selectedId}
              onSelect={(findingId) => setScreen({ ...screen, selectedId: findingId })}
            />
            <div>
              <FindingsMap
                features={screen.page.features.filter((feature) => feature.geometry !== null)}
                onSelect={(findingId) => setScreen({ ...screen, selectedId: findingId })}
              />
              <FindingDetail feature={selected} />
            </div>
          </div>
        </>
      )}
    </main>
  );
}

function Provenance(props: { run: RunSummary }) {
  return (
    <section className={styles.panel} aria-label="Run provenance">
      <p><strong>{props.run.datasetName}</strong> · {props.run.rulesetId} {props.run.rulesetVersion}</p>
      <p>Source hash {props.run.sourceHash}</p>
      <p>CRS {props.run.sourceCrs} · license {props.run.license} · {props.run.findingCount} findings</p>
      <ul>
        {props.run.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}
      </ul>
    </section>
  );
}

function FilterForm(props: { search: string; onSearch: (search: string) => void }) {
  const params = new URLSearchParams(props.search);
  return (
    <form
      key={props.search}
      className={styles.filters}
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const next = new URLSearchParams(props.search);
        const severity = String(form.get("severity") ?? "");
        const ruleId = String(form.get("ruleId") ?? "");
        if (severity) next.set("severity", severity);
        else next.delete("severity");
        if (ruleId) next.set("ruleId", ruleId);
        else next.delete("ruleId");
        props.onSearch(`?${next.toString()}`);
      }}
    >
      <label>
        Severity
        <select name="severity" defaultValue={params.get("severity") ?? ""}>
          <option value="">Any</option>
          <option value="error">error</option>
          <option value="warning">warning</option>
          <option value="info">info</option>
        </select>
      </label>
      <label>
        Rule
        <input name="ruleId" defaultValue={params.get("ruleId") ?? ""} />
      </label>
      <button type="submit">Apply filters</button>
    </form>
  );
}

function FindingList(props: {
  features: FindingFeature[];
  selectedId: string | null;
  onSelect: (findingId: string) => void;
}) {
  if (props.features.length === 0) return <p>No findings match these filters.</p>;
  return (
    <ul className={styles.list}>
      {props.features.map((feature) => (
        <li key={feature.properties.findingId}>
          <button
            type="button"
            aria-current={feature.properties.findingId === props.selectedId ? "true" : undefined}
            onClick={() => props.onSelect(feature.properties.findingId)}
          >
            <span className={styles.severity}>{feature.properties.severity}</span>
            <span>{feature.properties.ruleId}</span>
            <span>{feature.properties.featureId}</span>
            {feature.geometry === null && <span>No geometry</span>}
          </button>
        </li>
      ))}
    </ul>
  );
}

function FindingDetail(props: { feature: FindingFeature | null }) {
  if (!props.feature) return <p>Select a finding to read its explanation.</p>;
  return (
    <article className={styles.panel} aria-label="Finding detail">
      <h2>{props.feature.properties.ruleId}</h2>
      <p>{props.feature.properties.severity} · feature {props.feature.properties.featureId}</p>
      <p>{props.feature.properties.explanation}</p>
      <p>{props.feature.properties.suggestedAction}</p>
      {props.feature.geometry === null && <p>No geometry is stored for this finding.</p>}
    </article>
  );
}

function ImportPanel(props: {
  job: ImportJob | null;
  error: string | null;
  onImported: (job: ImportJob) => void;
  onError: (message: string) => void;
  onOpenRun: (runId: string) => void;
  onCancel: () => Promise<void>;
}) {
  return (
    <section className={styles.panel} aria-label="Import a local dataset">
      <h2>Import a local GeoJSON file</h2>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const data = new FormData(form);
          const file = data.get("dataset");
          if (!(file instanceof File)) {
            props.onError("Choose a GeoJSON file.");
            return;
          }
          file.text().then((text) => {
            let geojson: unknown;
            try {
              geojson = JSON.parse(text) as unknown;
            } catch {
              props.onError("The file is not JSON. Archives and remote URLs are not accepted.");
              return;
            }
            return importDataset({
              datasetName: String(data.get("datasetName") ?? ""),
              sourceCrs: String(data.get("sourceCrs") ?? ""),
              license: String(data.get("license") ?? ""),
              geojson,
            });
          }).then((next) => {
            if (next) props.onImported(next);
          }).catch((error: unknown) => {
            props.onError(error instanceof Error ? error.message : "The import could not be started.");
          });
        }}
      >
        <label>
          Dataset name
          <input name="datasetName" defaultValue="local-demo" required />
        </label>
        <label>
          Source CRS
          <input name="sourceCrs" defaultValue="EPSG:4326" required />
        </label>
        <label>
          License
          <input name="license" defaultValue="CC0-1.0" required />
        </label>
        <label>
          GeoJSON file
          <input name="dataset" type="file" accept="application/geo+json,application/json,.geojson,.json" required />
        </label>
        <button type="submit">Start import</button>
      </form>
      {props.error && <p role="alert">{props.error}</p>}
      {props.job && (
        <p>
          Job {props.job.jobId} is {props.job.status}.
          {props.job.message ? ` ${props.job.message}` : ""}
        </p>
      )}
      {props.job && (props.job.status === "pending" || props.job.status === "running") && (
        <button type="button" onClick={() => void props.onCancel()}>Cancel import</button>
      )}
      {props.job?.runId && (
        <button type="button" onClick={() => props.onOpenRun(props.job?.runId ?? "")}>Open imported run</button>
      )}
    </section>
  );
}
