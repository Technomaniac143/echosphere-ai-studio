import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

/**
 * Local candidate state (photo + interview history).
 * NOTE (future): this will be backed by a real database with recorded
 * interview data; for now everything lives in the browser.
 */
export type CompetencyScore = { name: string; score: number };

export type InterviewRecord = {
  id: string;
  company: string;
  role: string;
  domain: string;
  date: string;
  cumulative: number;
  competencies: CompetencyScore[];
  photo?: string;
};

export type CandidateState = {
  name: string;
  email: string;
  photo: string | null;
  history: InterviewRecord[];
};

const STORAGE_KEY = "echosphere.candidate.v1";

export const defaultCompetencies: CompetencyScore[] = [
  { name: "Communication", score: 86 },
  { name: "Technical Depth", score: 84 },
  { name: "Problem Solving", score: 78 },
  { name: "Product Thinking", score: 61 },
  { name: "Leadership", score: 75 },
  { name: "Adaptability", score: 79 },
];

const defaultState: CandidateState = {
  name: "Arjun Sharma",
  email: "arjun.sharma@example.com",
  photo: null,
  history: [
    { id: "r1", company: "Amazon", role: "Backend Engineer", domain: "Backend Systems", date: "May 18, 2025", cumulative: 82, competencies: defaultCompetencies },
    { id: "r2", company: "Microsoft", role: "Staff Software Engineer", domain: "Distributed Systems", date: "Apr 02, 2025", cumulative: 76, competencies: [
      { name: "Communication", score: 80 }, { name: "Technical Depth", score: 79 }, { name: "Problem Solving", score: 74 },
      { name: "Product Thinking", score: 58 }, { name: "Leadership", score: 72 }, { name: "Adaptability", score: 73 },
    ] },
    { id: "r3", company: "Google", role: "Senior Software Engineer", domain: "Data Engineering", date: "Feb 21, 2025", cumulative: 71, competencies: [
      { name: "Communication", score: 74 }, { name: "Technical Depth", score: 72 }, { name: "Problem Solving", score: 70 },
      { name: "Product Thinking", score: 55 }, { name: "Leadership", score: 68 }, { name: "Adaptability", score: 70 },
    ] },
  ],
};

type Ctx = {
  candidate: CandidateState;
  setPhoto: (dataUrl: string | null) => void;
  cumulative: number;
  previousCumulative: number | null;
};

const CandidateContext = createContext<Ctx | null>(null);

export function CandidateProvider({ children }: { children: ReactNode }) {
  const [candidate, setCandidate] = useState<CandidateState>(defaultState);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<CandidateState>;
        setCandidate(c => ({ ...c, ...parsed, history: parsed.history?.length ? parsed.history : c.history }));
      }
    } catch { /* ignore malformed storage */ }
  }, []);

  const setPhoto = useCallback((photo: string | null) => {
    setCandidate(c => {
      const next = { ...c, photo, history: c.history.map(h => ({ ...h, photo: photo ?? undefined })) };
      try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* quota */ }
      return next;
    });
  }, []);

  const value = useMemo<Ctx>(() => {
    const latest = candidate.history[0];
    return {
      candidate,
      setPhoto,
      cumulative: latest?.cumulative ?? 0,
      previousCumulative: candidate.history[1]?.cumulative ?? null,
    };
  }, [candidate, setPhoto]);

  return <CandidateContext.Provider value={value}>{children}</CandidateContext.Provider>;
}

export function useCandidate(): Ctx {
  const ctx = useContext(CandidateContext);
  if (!ctx) throw new Error("useCandidate must be used inside CandidateProvider");
  return ctx;
}
