import { useEffect, useMemo, useRef, useState } from "react";

import FindingsMap from "../findings/FindingsMap";
import type { FindingFeature, GeoJsonGeometry } from "../lib/api";
import {
  getAlexaSimLlmMode,
  postAlexaSimChat,
  type AlexaChatMessage,
  type AlexaFindingCard,
} from "./alexaSimApi";
import { boundedHistory } from "./boundedHistory";
import { nextFindingCards } from "./findingCards";
import { downloadQgisArtifacts } from "./downloadQgisZip";
import styles from "./AlexaSimPanel.module.css";

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
    {
      role: "assistant",
      content: "Hi, I am Alexa in a labeled simulation. Ask me to validate the portfolio CC0 fixture or list findings.",
    },
  ]);
  const [findings, setFindings] = useState<AlexaFindingCard[]>([]);
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastQgisResponse, setLastQgisResponse] = useState<Awaited<ReturnType<typeof postAlexaSimChat>> | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [llmMode, setLlmMode] = useState<"mock" | "live" | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const mapFeatures = useMemo(() => toFindingFeatures(findings), [findings]);
  const selected = findings.find((finding) => finding.findingId === selectedFindingId) ?? null;

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

  async function sendMessage(text: string): Promise<void> {
    const trimmed = text.trim();
    if (trimmed.length === 0 || busy) return;
    setBusy(true);
    setError(null);
    const nextMessages: AlexaChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setDraft("");
    try {
      const response = await postAlexaSimChat({ sessionId, messages: boundedHistory(nextMessages) });
      setSessionId(response.sessionId);
      if (response.llmMode) setLlmMode(response.llmMode);
      const next = nextFindingCards({ cards: findings, selectedId: selectedFindingId }, response.findings, response.runId);
      setFindings([...next.cards]);
      setSelectedFindingId(next.selectedId);
      setMessages([...nextMessages, { role: "assistant", content: response.assistantMessage }]);
      if (response.qgisExport) setLastQgisResponse(response);
      speak(response.assistantMessage);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Could not reach the Alexa simulation API.");
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
              placeholder="Try: Validate the portfolio fixture"
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
            <button
              type="button"
              onClick={() => void sendMessage("Export QGIS bundle.")}
              disabled={busy}
            >
              Export QGIS via Alexa
            </button>
            <button
              type="button"
              onClick={() => {
                try {
                  if (!lastQgisResponse) throw new Error("Run export first so a bundle is available.");
                  downloadQgisArtifacts(lastQgisResponse);
                } catch (downloadError) {
                  setError(downloadError instanceof Error ? downloadError.message : "Download failed.");
                }
              }}
            >
              Download last QGIS bundle
            </button>
          </div>
          <div className={styles.cards}>
            {findings.map((finding) => (
              <button
                key={finding.findingId}
                type="button"
                className={`${styles.card} ${selectedFindingId === finding.findingId ? styles.cardSelected : ""}`}
                onClick={() => setSelectedFindingId(finding.findingId)}
              >
                <strong>{finding.ruleId}</strong>
                <div className={styles.cardMeta}>
                  {finding.severity} · featureId {finding.featureId}
                </div>
                <div className={styles.cardMeta}>findingId {finding.findingId}</div>
                <p>{finding.explanation}</p>
              </button>
            ))}
            {findings.length === 0 && <p>No finding cards yet. Validate a CC0 fixture to populate this list.</p>}
          </div>
          {selected && (
            <p aria-label="Finding detail">
              Suggested action: {selected.suggestedAction}
            </p>
          )}
          <div className={styles.mapWrap}>
            <FindingsMap
              features={mapFeatures}
              onSelect={(findingId) => setSelectedFindingId(findingId)}
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

function toFindingFeatures(findings: AlexaFindingCard[]): FindingFeature[] {
  return findings.flatMap((finding) => {
    if (!isGeometry(finding.geometry)) return [];
    return [{
      type: "Feature",
      id: finding.featureId,
      geometry: finding.geometry,
      properties: {
        findingId: finding.findingId,
        ruleId: finding.ruleId,
        severity: finding.severity as FindingFeature["properties"]["severity"],
        featureId: finding.featureId,
        explanation: finding.explanation,
        suggestedAction: finding.suggestedAction,
      },
    }];
  });
}

function isGeometry(value: unknown): value is GeoJsonGeometry {
  if (typeof value !== "object" || value === null) return false;
  const type = (value as { type?: string }).type;
  return type === "Polygon" || type === "MultiPolygon";
}
