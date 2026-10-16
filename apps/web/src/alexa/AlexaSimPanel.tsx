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
import { shouldStickChatToBottom } from "./chatScroll";
import { buildProvenanceLabel } from "./provenanceLabel";
import { isAlexaSessionContextValid } from "./sessionContext";
import { speakReply } from "./speakReply";
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
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const stickChatRef = useRef(true);
  const voiceEnabledRef = useRef(false);
  voiceEnabledRef.current = voiceEnabled;
  /** Bumped on clean session / dataset change so a late source response cannot repaint a stale layer. */
  const sourceLoadGeneration = useRef(0);

  const findingFeatures = useMemo(() => toFindingMapFeatures(findings), [findings]);
  const sourceFeatures = useMemo(
    () => (sourceLayer ? toSourceMapFeatures(sourceLayer.collection) : []),
    [sourceLayer],
  );
  const selected = findings.find((finding) => finding.findingId === selectedFindingId) ?? null;
  const provenanceLabel = sourceLayer ? buildProvenanceLabel(sourceLayer, sourceHash) : null;

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
    const hadFindingCards = findings.length > 0;
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
    // Source may have already fitted to the full extent; re-fit once findings first appear.
    if (!hadFindingCards && response.findings.length > 0) {
      setFitNonce((value) => value + 1);
    }
    if (response.qgisExport && response.runId !== null) {
      setLastQgisResponse(response);
      setConfirmedRunId(response.runId);
    }
    speakReply(response.assistantMessage, () => voiceEnabledRef.current);
  }

  useEffect(() => {
    const scroller = messagesRef.current;
    if (!scroller || !stickChatRef.current) return;
    // Instant jump so scroll events from a smooth animation cannot clear stick
    // before the assistant reply is painted.
    scroller.scrollTop = scroller.scrollHeight;
  }, [messages]);

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

  const canExplain = selectedFindingId !== null && !busy;
  const canExport = confirmedRunId !== null && !busy;
  const canDownload = lastQgisResponse !== null && lastQgisResponse.runId === confirmedRunId && !busy;

  return (
    <main className={styles.page}>
      <header className={styles.chrome}>
        <div className={styles.badgeRow}>
          <p className={styles.simBadge} role="note">
            Simulation of Alexa+ — not an Amazon product
          </p>
          <p className={styles.modelBadge} aria-label="Language model mode">
            {llmMode === "live" && "Model: live LLM"}
            {llmMode === "mock" && "Model: deterministic mock (scripted replies)"}
            {llmMode === null && "Model: checking…"}
          </p>
        </div>
        <h1>Alexa+ simulation for geospatial quality review</h1>
        <p className={styles.chromeLead}>
          Deterministic tools back every cited finding. The assistant never edits geometry.
        </p>
        {error && <p className={styles.error} role="alert">{error}</p>}
      </header>

      <div className={styles.workspace} aria-label="Finding cards and map">
        <section className={styles.mapRegion} aria-label="Map workspace">
          <div className={styles.toolbar}>
            <button type="button" onClick={startCleanSession} disabled={busy} title={busy ? "Wait for the current request." : "Start a new clean session"}>
              New clean session
            </button>
            <button
              type="button"
              onClick={() => {
                if (!selectedFindingId) return;
                stickChatRef.current = true;
                void sendMessage(`Explain finding ${selectedFindingId}.`);
              }}
              disabled={!canExplain}
              title={selectedFindingId === null ? "Select a finding first." : busy ? "Wait for the current request." : "Explain the selected finding"}
            >
              Explain selected finding
            </button>
            <button
              type="button"
              onClick={() => void sendMessage("Export QGIS bundle.")}
              disabled={!canExport}
              title={
                busy
                  ? "Wait for the current request."
                  : confirmedRunId === null
                    ? "Validate a fixture first."
                    : "Export QGIS for the current run"
              }
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
              disabled={!canDownload}
              title={
                busy
                  ? "Wait for the current request."
                  : lastQgisResponse === null || lastQgisResponse.runId !== confirmedRunId
                    ? "Export the current run before downloading."
                    : "Download the last QGIS ZIP"
              }
            >
              Download last QGIS bundle
            </button>
          </div>
          <div className={styles.mapWrap}>
            <FindingsMap
              sourceFeatures={sourceFeatures}
              findingFeatures={findingFeatures}
              selectedFindingId={selectedFindingId}
              fitNonce={fitNonce}
              provenanceLabel={provenanceLabel ?? "No layer loaded yet."}
              onSelect={selectFinding}
            />
          </div>
        </section>

        <aside className={styles.findingsRail} aria-label="Findings list">
          {(datasetName || sourceHash) ? (
            <p className={styles.datasetSummary} aria-label="Active dataset summary">
              Dataset {datasetName ?? "unknown"}
              {sourceHash ? ` · sourceHash ${sourceHash.slice(0, 12)}…` : ""}
              {confirmedRunId ? ` · runId ${confirmedRunId.slice(0, 12)}…` : ""}
            </p>
          ) : (
            <p className={styles.datasetSummary} aria-label="Active dataset summary">
              No active dataset yet.
            </p>
          )}
          <div className={styles.cards}>
            {findings.map((finding) => (
              <button
                key={finding.findingId}
                type="button"
                className={`${styles.card} ${selectedFindingId === finding.findingId ? styles.cardSelected : ""}`}
                onClick={() => selectFinding(finding.findingId)}
                aria-current={selectedFindingId === finding.findingId ? "true" : undefined}
              >
                <strong>{finding.ruleId}</strong>
                <div className={styles.cardMeta}>
                  {finding.severity} · featureId {finding.featureId}
                  {isMissingGeometry(finding) ? " · sin geometría" : ""}
                </div>
              </button>
            ))}
            {findings.length === 0 && (
              <p className={styles.cardEmpty}>No findings yet. Validate a catalog fixture, then list findings.</p>
            )}
          </div>
          {selected ? (
            <div className={styles.detail} aria-label="Finding detail">
              <div className={styles.detailHeader}>
                <strong>{selected.ruleId}</strong>
                <button
                  type="button"
                  className={styles.detailCopy}
                  onClick={() => {
                    void navigator.clipboard?.writeText(selected.findingId).catch(() => {
                      setError("Could not copy findingId.");
                    });
                  }}
                >
                  Copy findingId
                </button>
              </div>
              <p className={styles.detailId}>findingId {selected.findingId}</p>
              <p>{selected.explanation}</p>
              <p>
                Suggested action: {selected.suggestedAction}
                {isMissingGeometry(selected) ? " (feature has no geometry on the map)" : ""}
              </p>
            </div>
          ) : (
            <div className={styles.detail} aria-label="Finding detail">
              <p className={styles.cardEmpty}>Select a finding to see detail and copyable IDs.</p>
            </div>
          )}
        </aside>

        <section className={styles.chatPanel} aria-label="Alexa simulation chat">
          <div
            className={styles.messages}
            ref={messagesRef}
            onScroll={(event) => {
              if (!event.isTrusted) return;
              stickChatRef.current = shouldStickChatToBottom(event.currentTarget);
            }}
          >
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
              stickChatRef.current = true;
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
            <button
              type="button"
              onClick={() => {
                const next = !voiceEnabledRef.current;
                voiceEnabledRef.current = next;
                if (!next && typeof window !== "undefined" && "speechSynthesis" in window) {
                  window.speechSynthesis.cancel();
                }
                setVoiceEnabled(next);
              }}
              aria-pressed={voiceEnabled}
              title={voiceEnabled ? "Mute spoken replies and hide the mic button" : "Enable spoken replies and mic input"}
            >
              {voiceEnabled ? "Voice on" : "Voice off"}
            </button>
            <button type="submit" disabled={busy} title={busy ? "Wait for the current request." : "Send message"}>
              {busy ? "Thinking…" : "Send"}
            </button>
          </form>
          {voiceEnabled && (
            <div className={styles.composer}>
              <button
                type="button"
                onClick={() => recognitionRef.current?.start()}
                disabled={busy}
                title="Click once to capture a voice message"
              >
                Click to speak (Web Speech)
              </button>
            </div>
          )}
        </section>
      </div>

      <p className={styles.statusLive} aria-live="polite">
        {busy ? "Working on your request." : ""}
      </p>
    </main>
  );
}

function isMissingGeometry(finding: AlexaFindingCard): boolean {
  return finding.geometry === null || finding.geometry === undefined;
}
