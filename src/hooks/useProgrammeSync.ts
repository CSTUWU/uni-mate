import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Course, TsvSyncState, DegreeProgram } from "../types/gpa";
import {
  DEFAULT_GOOGLE_SHEET_TSV_URL,
  fetchCoursesFromTsvUrl,
  discoverDegreeProgramsFromSheet,
} from "../utils/tsvParser";
import { useDegreePrograms, useTsvCourses, baseUrlOf, tsvCoursesKey, degreesKey } from "./useGpaData";
import { usePersistedState } from "./usePersistedState";

const LS_TSV_URL = "unimate_tsv_url_v2";
const LS_DEGREE_ID = "unimate_active_degree_id_v2";
const LS_CUSTOM_DEGREES = "unimate_custom_degrees_v3";

/**
 * Owns the programme/sheet side of the app: which TSV sheet is loaded, which
 * degree is active, and the queries that discover courses and degrees from it.
 * Knows nothing about grades or dialogs - callers compose what they need.
 */
export function useProgrammeSync() {
  const queryClient = useQueryClient();

  /* null URL = manual mode, nothing to fetch */
  const [tsvUrl, setTsvUrl] = useState<string | null>(() => localStorage.getItem(LS_TSV_URL));
  const [activeDegree, setActiveDegree] = useState<DegreeProgram | null>(null);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [customDegrees, setCustomDegrees] = usePersistedState<DegreeProgram[]>(LS_CUSTOM_DEGREES, () => []);

  /* TSV data is cached per URL - no repeated fetches */
  const degreesQuery = useDegreePrograms(tsvUrl ? baseUrlOf(tsvUrl) : null);
  const coursesQuery = useTsvCourses(tsvUrl);

  const discovered = degreesQuery.data ?? [];
  const availableDegrees = [
    ...discovered,
    /* user-added degrees (named by them) - keep unless discovery later finds the same sheet */
    ...customDegrees.filter((c) => !discovered.some((d) => d.tsvUrl === c.tsvUrl)),
  ];

  /* Resolve the degree matching the current TSV URL (falls back to last selection) */
  const activeDegreeResolved =
    tsvUrl ? (availableDegrees.find((d) => d.tsvUrl === tsvUrl) ?? activeDegree) : null;

  const selectDegree = (d: DegreeProgram) => {
    setActiveDegree(d);
    setTsvUrl(d.tsvUrl);
    localStorage.setItem(LS_TSV_URL, d.tsvUrl);
    localStorage.setItem(LS_DEGREE_ID, d.id);
  };

  /** Drop the active programme and return to manual mode. */
  const clearProgramme = () => {
    setActiveDegree(null);
    setTsvUrl(null);
    localStorage.removeItem(LS_TSV_URL);
  };

  const syncUrl = async (url: string, degreeName?: string) => {
    const data = await fetchCoursesFromTsvUrl(url); // throws → sync modal shows the error
    queryClient.setQueryData<Course[]>(tsvCoursesKey(url), data);
    setTsvUrl(url);
    localStorage.setItem(LS_TSV_URL, url);
    setLastSynced(new Date().toLocaleTimeString());
    const base = baseUrlOf(url);
    const degs = await discoverDegreeProgramsFromSheet(base);
    queryClient.setQueryData<DegreeProgram[]>(degreesKey(base), degs);
    const match = degs.find((d) => d.tsvUrl === url);
    if (match) {
      setActiveDegree(match);
    } else {
      /* Not auto-discoverable → the user adds/names their own degree */
      const entry: DegreeProgram = {
        id: `custom-${Date.now()}`,
        code: "CUSTOM",
        name: degreeName?.trim() || "Custom Degree",
        gid: "",
        tsvUrl: url,
      };
      setCustomDegrees([...customDegrees.filter((c) => c.tsvUrl !== url), entry]);
      setActiveDegree(entry);
    }
  };

  /** Return to the bundled default sheet. Does not touch user grades. */
  const resetProgramme = async () => {
    queryClient.removeQueries({ queryKey: ["tsv-courses"] });
    queryClient.removeQueries({ queryKey: ["degrees"] });
    setActiveDegree(null);
    setTsvUrl(DEFAULT_GOOGLE_SHEET_TSV_URL);
    localStorage.setItem(LS_TSV_URL, DEFAULT_GOOGLE_SHEET_TSV_URL);
    const data = await fetchCoursesFromTsvUrl(DEFAULT_GOOGLE_SHEET_TSV_URL);
    queryClient.setQueryData<Course[]>(tsvCoursesKey(DEFAULT_GOOGLE_SHEET_TSV_URL), data);
    const degs = await discoverDegreeProgramsFromSheet(DEFAULT_GOOGLE_SHEET_TSV_URL);
    queryClient.setQueryData<DegreeProgram[]>(degreesKey(DEFAULT_GOOGLE_SHEET_TSV_URL), degs);
  };

  /* courseCount is supplied by the caller, which owns the combined course list. */
  const tsvState: Omit<TsvSyncState, "courseCount"> = {
    url: tsvUrl ?? "",
    lastSyncedAt: lastSynced,
    isLoading: coursesQuery.isFetching || degreesQuery.isFetching,
    error: coursesQuery.error instanceof Error ? coursesQuery.error.message
      : degreesQuery.error instanceof Error ? degreesQuery.error.message : null,
    activeDegree: activeDegreeResolved ?? undefined,
    availableDegrees,
  };

  return {
    tsvState,
    fetchedCourses: coursesQuery.data ?? [],
    selectDegree,
    clearProgramme,
    syncUrl,
    resetProgramme,
  };
}
