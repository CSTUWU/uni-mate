import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Course } from "../types/gpa";
import {
  discoverDegreeProgramsFromSheet,
  fetchCoursesFromTsvUrl,
} from "../utils/tsvParser";

const LS_FETCHED_CACHE = "unimate_tsv_cache_v3";
const FRESH_MS = 10 * 60 * 1000;

/** Strip any gid segment so discovery is keyed per spreadsheet, not per sheet */
export function baseUrlOf(tsvUrl: string): string {
  return tsvUrl.split("&gid=")[0].split("?gid=")[0];
}

export function tsvCoursesKey(tsvUrl: string | null) {
  return ["tsv-courses", tsvUrl] as const;
}

export function degreesKey(baseUrl: string | null) {
  return ["degrees", baseUrl] as const;
}

/* ── Persistent cache of raw fetched courses (per TSV URL, with timestamp) ── */

interface CachedTsv {
  data: Course[];
  ts: number;
}

function readFetchedCache(url: string): CachedTsv | undefined {
  try {
    const raw = localStorage.getItem(LS_FETCHED_CACHE);
    if (!raw) return undefined;
    const map = JSON.parse(raw) as Record<string, CachedTsv>;
    const entry = map?.[url];
    return entry && Array.isArray(entry.data) && entry.data.length > 0 ? entry : undefined;
  } catch {
    return undefined;
  }
}

function writeFetchedCache(url: string, data: Course[]) {
  try {
    const raw = localStorage.getItem(LS_FETCHED_CACHE);
    const map = raw ? (JSON.parse(raw) as Record<string, CachedTsv>) : {};
    map[url] = { data, ts: Date.now() };
    localStorage.setItem(LS_FETCHED_CACHE, JSON.stringify(map));
  } catch {
    /* storage full / unavailable - cache is best-effort */
  }
}

/**
 * Degree programme discovery. Cached per spreadsheet base URL so it only
 * runs once per session (sheet metadata rarely changes); explicit sync
 * refreshes the cache via setQueryData.
 */
export function useDegreePrograms(baseUrl: string | null) {
  return useQuery({
    queryKey: degreesKey(baseUrl),
    queryFn: () => discoverDegreeProgramsFromSheet(baseUrl!),
    enabled: !!baseUrl,
    staleTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    placeholderData: [],
  });
}

/**
 * Raw course list for a TSV URL. Data is cached in-memory (TanStack) and
 * persisted to localStorage, so revisiting a degree or reloading the page
 * serves the cache instead of hitting Google Sheets again. Stale cached
 * data refreshes in the background.
 */
export function useTsvCourses(tsvUrl: string | null) {
  const cached = useMemo(() => (tsvUrl ? readFetchedCache(tsvUrl) : undefined), [tsvUrl]);

  const query = useQuery({
    queryKey: tsvCoursesKey(tsvUrl),
    queryFn: () => fetchCoursesFromTsvUrl(tsvUrl!),
    enabled: !!tsvUrl,
    staleTime: FRESH_MS,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    ...(cached ? { initialData: cached.data, initialDataUpdatedAt: cached.ts } : {}),
  });

  /* Keep the persisted cache in sync with whatever data is current */
  useEffect(() => {
    if (query.data && tsvUrl) writeFetchedCache(tsvUrl, query.data);
  }, [query.data, tsvUrl]);

  return query;
}
