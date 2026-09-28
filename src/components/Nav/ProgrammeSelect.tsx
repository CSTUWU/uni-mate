import { useMemo } from "react";
import CustomSelect from "../UI/CustomSelect";
import type { SelectOption } from "../UI/CustomSelect";
import type { TsvSyncState, DegreeProgram } from "../../types/gpa";

interface ProgrammeSelectProps {
  tsvState: TsvSyncState;
  onSelect: (d: DegreeProgram) => void;
}

/**
 * The programme picker plus the rules for labelling its options: show the live
 * subject count for the active sheet, and surface a user-named custom degree
 * even when discovery cannot find it.
 */
export default function ProgrammeSelect({ tsvState, onSelect }: ProgrammeSelectProps) {
  const subjectLabel = `${tsvState.courseCount} subject${tsvState.courseCount === 1 ? "" : "s"}`;

  const options: SelectOption[] = useMemo(() => {
    const opts: SelectOption[] = (tsvState.availableDegrees || []).map((d) => {
      const isActive = d.id === tsvState.activeDegree?.id;
      return {
        value: d.id,
        label: `${d.code} · ${d.name}`,
        sub: isActive
          ? subjectLabel
          : `${d.code}${d.years ? ` · ${d.years} yr${d.years > 1 ? "s" : ""}` : ""}`,
      };
    });
    /* Always show the currently loaded sheet (even custom TSV URLs) so its live count is visible */
    const active = tsvState.activeDegree;
    if (active && !opts.some((o) => o.value === active.id)) {
      opts.unshift({ value: active.id, label: `${active.code} · ${active.name}`, sub: subjectLabel });
    }
    return opts;
  }, [tsvState.availableDegrees, tsvState.activeDegree, subjectLabel]);

  if (options.length === 0) return null;

  return (
    <div className="nav-degree">
      <p className="nav-section-label">Programme</p>
      <CustomSelect
        id="nav-degree"
        options={options}
        value={tsvState.activeDegree?.id || ""}
        onChange={(val) => {
          const d = (tsvState.availableDegrees || []).find((x) => x.id === val);
          if (d) onSelect(d);
        }}
        triggerStyle={{ fontSize: 13, fontWeight: 600 }}
      />
    </div>
  );
}
