import { useState } from "react";

import AlexaSimPanel from "./alexa/AlexaSimPanel";
import styles from "./App.module.css";
import { resolveAppMode, type AppMode } from "./appMode";
import FindingsReview from "./findings/FindingsReview";

const initialMode = resolveAppMode(window.location.search, import.meta.env.VITE_APP_MODE);

export default function App() {
  const [search, setSearch] = useState(() => window.location.search);
  const [mode, setMode] = useState<AppMode>(initialMode.mode);

  function switchMode(next: AppMode): void {
    setMode(next);
    const params = new URLSearchParams(search);
    if (next === "alexa") params.set("sim", "alexa");
    else params.delete("sim");
    const nextSearch = params.size > 0 ? `?${params.toString()}` : "";
    window.history.replaceState(null, "", nextSearch || window.location.pathname);
    setSearch(nextSearch || window.location.search);
  }

  if (!initialMode.canSwitch) {
    return (
      <div className={styles.fixedShell}>
        <AlexaSimPanel />
      </div>
    );
  }

  return (
    <div className={mode === "alexa" ? styles.fixedShell : undefined}>
      <nav style={{ display: "flex", gap: "0.75rem", padding: "0.75rem 1rem", borderBottom: "1px solid #ccd4cb" }}>
        <button type="button" onClick={() => switchMode("review")} aria-current={mode === "review"}>
          Run review
        </button>
        <button type="button" onClick={() => switchMode("alexa")} aria-current={mode === "alexa"}>
          Alexa+ simulation
        </button>
      </nav>
      {mode === "alexa" ? (
        <AlexaSimPanel />
      ) : (
        <FindingsReview
          search={search}
          onSearch={(next) => {
            window.history.replaceState(null, "", next);
            setSearch(next);
          }}
        />
      )}
    </div>
  );
}
