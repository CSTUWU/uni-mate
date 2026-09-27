import React, { useState } from "react";
import { RefreshCw, CheckCircle2, AlertCircle, Link2, DownloadCloud, RotateCcw } from "lucide-react";
import type { TsvSyncState, Course } from "../../types/gpa";
import { DEFAULT_GOOGLE_SHEET_TSV_URL } from "../../utils/tsvParser";
import { formatSemesterShort } from "../../utils/semesterUtils";
import Modal from "../UI/Modal";
import FormField from "../UI/FormField";

interface TsvSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  tsvState: TsvSyncState;
  courses: Course[];
  onSyncUrl: (url: string, degreeName?: string) => Promise<void>;
  onResetToDefault: () => Promise<void>;
}

export default function TsvSyncModal({
  isOpen,
  onClose,
  tsvState,
  courses,
  onSyncUrl,
  onResetToDefault,
}: TsvSyncModalProps) {
  const [customUrl, setCustomUrl] = useState(tsvState.url || DEFAULT_GOOGLE_SHEET_TSV_URL);
  const [degreeName, setDegreeName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSyncSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;
    setIsSubmitting(true);
    setFeedbackMsg(null);
    try {
      await onSyncUrl(customUrl.trim(), degreeName.trim() || undefined);
      setFeedbackMsg("Successfully synchronized subjects from Google Sheet!");
    } catch (err: unknown) {
      setFeedbackMsg(err instanceof Error ? err.message : "Failed to sync subjects. Please check TSV URL format.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = async () => {
    setIsSubmitting(true);
    setFeedbackMsg(null);
    try {
      setCustomUrl(DEFAULT_GOOGLE_SHEET_TSV_URL);
      await onResetToDefault();
      setFeedbackMsg("Reset to default UWU Google Sheet TSV dataset.");
    } catch {
      setFeedbackMsg("Failed to reset dataset.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isError = feedbackMsg?.includes("Failed") || feedbackMsg?.includes("error");

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      icon={<DownloadCloud size={16} />}
      title="Google Sheets TSV Integration"
      subtitle="Live sync subjects directly from Uva Wellassa University published course sheets"
      maxWidth={500}
    >
      <form onSubmit={handleSyncSubmit} style={{ padding: "18px 18px 0" }}>

        <FormField
          label="Google Sheet TSV Link"
          htmlFor="tsv-url"
          labelRight={<span style={{ fontSize: 11, color: "var(--green)", fontWeight: 500 }}>Published Web Output</span>}
          hint={
            <>
              Ensure your Google Sheet is published to web as TSV (
              <code style={{ background: "var(--gray-100)", padding: "1px 5px", borderRadius: 4, fontFamily: "monospace" }}>
                output=tsv
              </code>
              ).
            </>
          }
        >
          <div style={{ position: "relative" }}>
            <input
              id="tsv-url"
              type="url"
              required
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?output=tsv"
              className="inp"
              style={{ paddingLeft: 34, fontFamily: "monospace", fontSize: 11 }}
            />
            <Link2
              size={14}
              style={{
                position: "absolute", left: 10, top: "50%",
                transform: "translateY(-50%)", color: "var(--gray-400)",
                pointerEvents: "none",
              }}
            />
          </div>
        </FormField>

        <FormField
          label="Degree Name (optional)"
          htmlFor="degree-name"
          hint="Used when the sheet is not auto-discoverable — name your own degree."
          marginBottom={18}
          labelGap={6}
        >
          <input
            id="degree-name"
            type="text"
            value={degreeName}
            onChange={(e) => setDegreeName(e.target.value)}
            placeholder="e.g. Bachelor of Engineering"
            className="inp"
          />
        </FormField>

        {feedbackMsg && (
          <div
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "9px 12px", borderRadius: "var(--r)",
              marginBottom: 14,
              fontSize: 12, fontWeight: 600,
              background: isError ? "var(--red-bg)"    : "var(--green-bg)",
              color:      isError ? "var(--red)"       : "var(--green)",
              border:     `1px solid ${isError ? "var(--red-border)" : "var(--green-border)"}`,
            }}
          >
            {isError ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
            <span>{feedbackMsg}</span>
          </div>
        )}

        <FormField label={`Currently Loaded Subjects (${courses.length})`} marginBottom={18} labelGap={6}>
          <div
            style={{
              maxHeight: 160, overflowY: "auto",
              border: "1px solid var(--gray-200)", borderRadius: "var(--r)",
              background: "var(--gray-50)",
            }}
          >
            {courses.length === 0 ? (
              <div style={{ padding: "16px 12px", textAlign: "center", color: "var(--gray-400)", fontSize: 12 }}>
                No subjects loaded yet
              </div>
            ) : courses.map((c, idx) => (
              <div
                key={c.id}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "7px 12px", fontSize: 12,
                  borderBottom: idx < courses.length - 1 ? "1px solid var(--gray-100)" : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <span style={{ fontWeight: 700, color: "var(--gray-900)", flexShrink: 0 }}>{c.code}</span>
                  <span style={{ color: "var(--gray-500)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 220 }}>{c.name}</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--blue)", flexShrink: 0 }}>
                  Sem {formatSemesterShort(c.semester)} · {c.credits} cr
                </span>
              </div>
            ))}
          </div>
        </FormField>

        <div
          style={{
            margin: "0 -18px",
            padding: "12px 18px",
            borderTop: "1px solid var(--gray-200)",
            background: "var(--gray-50)",
            display: "flex", alignItems: "center",
            justifyContent: "space-between", gap: 8,
          }}
        >
          <button
            type="button"
            onClick={handleReset}
            disabled={isSubmitting}
            className="btn btn-secondary"
            style={{ fontSize: 13, opacity: isSubmitting ? 0.5 : 1 }}
          >
            <RotateCcw size={13} />
            <span>Reset to Default (UWU)</span>
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
            style={{ fontSize: 13, opacity: isSubmitting ? 0.5 : 1 }}
          >
            <RefreshCw size={13} className={isSubmitting ? "animate-spin" : ""} />
            <span>{isSubmitting ? "Syncing…" : "Sync & Load Subjects"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
