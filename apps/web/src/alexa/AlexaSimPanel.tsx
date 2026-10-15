import { useEffect, useMemo, useRef, useState } from "react";

import FindingsMap from "../findings/FindingsMap";
import { toFindingMapFeatures, toSourceMapFeatures } from "../findings/mapFeatures";
import {
  AlexaSimHttpError,
  getAlexaFixtureSource,
  getAlexaSimLlmMode,
  postAlexaSimChat,
  type AlexaChatMessage,
  type AlexaChatResponse,
  type AlexaFindingCard,
  type AlexaFixtureSource,
} from "./alexaSimApi";
import { boundedHistory } from "./boundedHistory";
import { nextFindingCards, type FindingCardsState } from "./findingCards";
import { downloadQgisArtifacts } from "./downloadQgisZip";
import {
  formatAlexaSimErrorMessage,
  retryDelayMs,
  shouldAutoRetryAlexaSimError,
} from "./alexaSimRetry";
import { isAlexaSessionContextValid } from "./sessionContext";
import styles from "./AlexaSimPanel.module.css";

const WELCOME_MESSAGE =
  "Hi, I am Alexa in a labeled simulation. Ask me to validate portfolio (CC0) or ne-admin0-westeurope-demo-errors (Natural Earth), then list findings.";

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
};

export default function AlexaSimPanel() {
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<AlexaChatMessage[]>([
    { role: "assistant", content: WELCOME_MESSAGE },
  ]);
  // One state so a reply and a click during the request cannot overwrite each other.
  const [cardsState, setCardsState] = useState<FindingCardsState>({ cards: [], selectedId: null });
  const findings = cardsState.cards;
  const selectedFindingId = cardsState.selectedId;
  const selectFinding = (findingId: string) => {
    setCardsState((previous) => ({ ...previous, selectedId: findingId }));
    setFitNonce((value) => value + 1);
  };
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastQgisResponse, setLastQgisResponse] = useState<AlexaChatResponse | null>(null);
  const [confirmedRunId, setConfirmedRunId] = useState<string | null>(null);
  const [datasetName, setDatasetName] = useState<string | null>(null);
  const [sourceHash, setSourceHash] = useState<string | null>(null);
  const [sourceLayer, setSourceLayer] = useState<AlexaFixtureSource | null>(null);
  const [fitNonce, setFitNonce] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [llmMode, setLlmMode] = useState<"mock" | "live" | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  /** Bumped on clean session / dataset change so a late source response cannot repaint a stale layer. */
  const sourceLoadGeneration = useRef(0);

  const findingFeatures = useMemo(() => toFindingMapFeatures(findings), [findings]);
  const sourceFeatures = useMemo(
    () => (sourceLayer ? toSourceMapFeatures(sourceLayer.collection) : []),
    [sourceLayer],
  );
  const selected = findings.find((finding) => finding.findingId === selectedFindingId) ?? null;
  const provenanceLabel = sourceLayer
    ? `${sourceLayer.label} · ${sourceLayer.license} · ${sourceLayer.sourceCrs}`
      + (sourceHash ? ` · hash ${sourceHash.slice(0, 12)}…` : "")
      + (sourceLayer.scaleNote ? ` · ${sourceLayer.scaleNote}` : "")
    : null;

  useEffect(() => {
    let active = true;
    void getAlexaSimLlmMode().then((mode) => {
      if (active) setLlmMode(mode);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!voiceEnabled) return undefined;
    const factory = (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition
      ?? (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;
    if (!factory) {
      setError("Web Speech recognition is not available in this browser.");
      setVoiceEnabled(false);
      return undefined;
    }
    const recognition = new factory();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      if (transcript.trim().length > 0) setDraft(transcript.trim());
    };
    recognition.onerror = () => setError("Voice input failed. You can keep typing instead.");
    recognitionRef.current = recognition;
    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, [voiceEnabled]);

  function clearLayerState(): void {
    sourceLoadGeneration.current += 1;
    setSourceLayer(null);
    setDatasetName(null);
    setSourceHash(null);
    setFitNonce((value) => value + 1);
  }

  function startCleanSession(): void {
    setSessionId(undefined);
    setMessages([{ role: "assistant", content: WELCOME_MESSAGE }]);
    setCardsState({ cards: [], selectedId: null });
    setLastQgisResponse(null);
    setConfirmedRunId(null);
    clearLayerState();
    setError(null);
    setDraft("");
  }

  async function loadSourceForDataset(name: string): Promise<void> {
    const generation = ++sourceLoadGeneration.current;
    try {
      const source = await getAlexaFixtureSource(name);
      if (generation !== sourceLoadGeneration.current) return;
      setSourceLayer(source);
      setFitNonce((value) => value + 1);
    } catch (loadError) {
      if (generation !== sourceLoadGeneration.current) return;
      setSourceLayer(null);
      if (loadError instanceof AlexaSimHttpError) {
        setError(formatAlexaSimErrorMessage(loadError));
      }
    }
  }

  function applySuccessfulResponse(nextMessages: AlexaChatMessage[], response: AlexaChatResponse): void {
    const contextValid = isAlexaSessionContextValid(response);
    setSessionId(response.sessionId);
    if (response.llmMode) setLlmMode(response.llmMode);
    setCardsState((previous) => nextFindingCards(previous, response.findings, response.runId, { contextValid }));
    setMessages([...nextMessages, { role: "assistant", content: response.assistantMessage }]);
    if (!contextValid) {
      setLastQgisResponse(null);
      setConfirmedRunId(null);
      clearLayerState();
      return;
    }
    if (response.runId !== null && response.runId !== confirmedRunId) {
      setLastQgisResponse(null);
      setConfirmedRunId(response.runId);
    }
    if (response.datasetName) {
      setDatasetName(response.datasetName);
      const nextHash = response.sourceHash ?? sourceHash;
      if (response.datasetName !== datasetName || (response.sourceHash != null && response.sourceHash !== sourceHash)) {
        void loadSourceForDataset(response.datasetName);
      }
      if (nextHash) setSourceHash(nextHash);
    } else if (response.sourceHash) {
      setSourceHash(response.sourceHash);
    }
    if (response.qgisExport && response.runId !== null) {
      setLastQgisResponse(response);
      setConfirmedRunId(response.runId);
    }
    speak(response.assistantMessage);
  }

  async function sendMessage(text: string): Promise<void> {
    const trimmed = text.trim();
    if (trimmed.length === 0 || busy) return;
    setBusy(true);
    setError(null);
    const nextMessages: AlexaChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setDraft("");
    let attempt = 0;
    try {
      for (;;) {
        try {
          const response = await postAlexaSimChat({ sessionId, messages: boundedHistory(nextMessages) });
          setError(null);
          applySuccessfulResponse(nextMessages, response);
          return;
        } catch (sendError) {
          if (
            sendError instanceof AlexaSimHttpError
            && shouldAutoRetryAlexaSimError(sendError, attempt)
          ) {
            const waitMs = retryDelayMs(sendError);
            setError(formatAlexaSimErrorMessage(sendError));
            await new Promise((resolve) => setTimeout(resolve, waitMs));
            attempt += 1;
            continue;
          }
          if (sendError instanceof AlexaSimHttpError) {
            setError(formatAlexaSimErrorMessage(sendError));
          } else {
            setError(sendError instanceof Error ? sendError.message : "Could not reach the Alexa simulation API. Try again without reloading.");
          }
          return;
        }
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={styles.page}>
      <p className={styles.simBadge} role="note">
        Simulation of Alexa+ — not an Amazon product
      </p>
      <p className={styles.modelBadge} aria-label="Language model mode">
        {llmMode === "live" && "Model: live LLM"}
        {llmMode === "mock" && "Model: deterministic mock (scripted replies)"}
        {llmMode === null && "Model: checking…"}
      </p>
      <header>
        <h1>Alexa+ simulation for geospatial quality review</h1>
        <p>Deterministic tools back every cited finding. The assistant never edits geometry.</p>
      </header>
      <div className={styles.layout}>
        <section className={styles.chatPanel} aria-label="Alexa simulation chat">
          <div className={styles.messages}>
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                data-role={message.role}
                className={message.role === "user" ? styles.bubbleUser : styles.bubbleAssistant}
              >
                {message.content}
              </div>
            ))}
          </div>
          <form
            className={styles.composer}
            onSubmit={(event) => {
              event.preventDefault();
              void sendMessage(draft);
            }}
          >
            <input
              aria-label="Message Alexa simulation"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Try: Validate the ne-admin0-westeurope-demo-errors fixture"
              disabled={busy}
            />
            <button type="button" onClick={() => setVoiceEnabled((value) => !value)}>
              {voiceEnabled ? "Voice on" : "Voice off"}
            </button>
            <button type="submit" disabled={busy}>
              {busy ? "Thinking…" : "Send"}
            </button>
          </form>
          {voiceEnabled && (
            <div className={styles.composer}>
              <button
                type="button"
                onClick={() => recognitionRef.current?.start()}
                disabled={busy}
              >
                Hold to speak (Web Speech)
              </button>
            </div>
          )}
        </section>
        <aside className={styles.sidePanel} aria-label="Finding cards and map">
          <div className={styles.toolbar}>
            <button type="button" onClick={startCleanSession} disabled={busy}>
              New clean session
            </button>
            <button
              type="button"
              onClick={() => {
                if (!selectedFindingId) return;
                void sendMessage(`Explain finding ${selectedFindingId}.`);
              }}
              disabled={busy || selectedFindingId === null}
            >
              Explain selected finding
            </button>
            <button
              type="button"
              onClick={() => void sendMessage("Export QGIS bundle.")}
              disabled={busy || confirmedRunId === null}
            >
              Export QGIS via Alexa
            </button>
            <button
              type="button"
              onClick={() => {
                try {
                  if (!lastQgisResponse || lastQgisResponse.runId !== confirmedRunId) {
                    throw new Error("Run export for the current validated run first.");
                  }
                  downloadQgisArtifacts(lastQgisResponse);
                } catch (downloadError) {
                  setError(downloadError instanceof Error ? downloadError.message : "Download failed.");
                }
              }}
              disabled={lastQgisResponse === null || lastQgisResponse.runId !== confirmedRunId}
            >
              Download last QGIS bundle
            </button>
          </div>
          {(datasetName || sourceHash) && (
            <p aria-label="Active dataset summary">
              Dataset {datasetName ?? "unknown"}
              {sourceHash ? ` · sourceHash ${sourceHash.slice(0, 12)}…` : ""}
              {confirmedRunId ? ` · runId ${confirmedRunId.slice(0, 12)}…` : ""}
            </p>
          )}
          <div className={styles.cards}>
            {findings.map((finding) => (
              <button
                key={finding.findingId}
                type="button"
                className={`${styles.card} ${selectedFindingId === finding.findingId ? styles.cardSelected : ""}`}
                onClick={() => selectFinding(finding.findingId)}
              >
                <strong>{finding.ruleId}</strong>
                <div className={styles.cardMeta}>
                  {finding.severity} · featureId {finding.featureId}
                  {isMissingGeometry(finding) ? " · sin geometría" : ""}
                </div>
                <div className={styles.cardMeta}>findingId {finding.findingId}</div>
                <p>{finding.explanation}</p>
              </button>
            ))}
            {findings.length === 0 && <p>No finding cards yet. Validate a catalog fixture to populate this list.</p>}
          </div>
          {selected && (
            <p aria-label="Finding detail">
              Suggested action: {selected.suggestedAction}
              {isMissingGeometry(selected) ? " (feature has no geometry on the map)" : ""}
            </p>
          )}
          <div className={styles.mapWrap}>
            <FindingsMap
              sourceFeatures={sourceFeatures}
              findingFeatures={findingFeatures}
              selectedFindingId={selectedFindingId}
              fitNonce={fitNonce}
              provenanceLabel={provenanceLabel}
              onSelect={selectFinding}
            />
          </div>
        </aside>
      </div>
      {error && <p className={styles.error} role="alert">{error}</p>}
    </main>
  );
}

function speak(text: string): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function isMissingGeometry(finding: AlexaFindingCard): boolean {
  return finding.geometry === null || finding.geometry === undefined;
}
