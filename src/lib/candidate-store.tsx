import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getProfile, upsertProfile, uploadPhoto } from "./profile.functions";
import { listInterviews } from "./interview.functions";
import { supabase } from "@/integrations/supabase/client";

export type CompetencyScore = { name: string; score: number };

export type InterviewRecord = {
  id: string;
  company: string;
  role: string;
  domain: string;
  date: string;
  cumulative: number;
  competencies: CompetencyScore[];
  photo?: string | undefined;
  overall_score?: number | undefined;
  competency_scores?: any[] | undefined;
  strengths?: string[] | undefined;
  improvements?: string[] | undefined;
  recommendation?: string | undefined;
  panel_scores?: any[] | undefined;
  created_at?: string | undefined;
};

export type CandidateProfile = {
  resumeName: string;
  github: string;
  institution: string;
  degree: string;
  department: string;
  graduationYear: string;
  certificationName: string;
  certificationOrg: string;
  certificationYear: string;
  certificationUrl: string;
};

export const emptyProfile: CandidateProfile = {
  resumeName: "", github: "", institution: "", degree: "", department: "",
  graduationYear: "", certificationName: "", certificationOrg: "", certificationYear: "", certificationUrl: "",
};

export const requiredProfileFields: (keyof CandidateProfile)[] = [
  "resumeName", "github", "institution", "degree", "department", "graduationYear",
];

export function isProfileComplete(profile: CandidateProfile) {
  return requiredProfileFields.every(f => (profile[f] ?? "").trim().length > 0);
}

export type CandidateState = {
  name: string;
  email: string;
  photo: string | null;
  profile: CandidateProfile;
  history: InterviewRecord[];
  targetRole?: string | undefined;
};

export const defaultCompetencies: CompetencyScore[] = [
  { name: "Communication", score: 0 },
  { name: "Technical Depth", score: 0 },
  { name: "Problem Solving", score: 0 },
  { name: "Product Thinking", score: 0 },
  { name: "Leadership", score: 0 },
  { name: "Adaptability", score: 0 },
];

const emptyState: CandidateState = {
  name: "",
  email: "",
  photo: null,
  profile: emptyProfile,
  history: [],
  targetRole: undefined,
};

function dbToState(db: any): CandidateState {
  const certs = Array.isArray(db.certifications) && db.certifications.length > 0 ? db.certifications[0] : {};
  return {
    name: db.full_name || "",
    email: db.email || "",
    photo: null,
    profile: {
      resumeName: db.resume_path ? db.resume_path.split("/").pop() : "",
      github: db.github_url || "",
      institution: db.institution || "",
      degree: db.degree || "",
      department: db.department || "",
      graduationYear: db.graduation_year ? String(db.graduation_year) : "",
      certificationName: certs.name || "",
      certificationOrg: certs.org || "",
      certificationYear: certs.year || "",
      certificationUrl: certs.url || "",
    },
    history: [],
    targetRole: db.target_role || undefined,
  };
}

function stateToDb(state: CandidateState): any {
  return {
    full_name: state.name,
    email: state.email,
    github_url: state.profile.github,
    institution: state.profile.institution,
    degree: state.profile.degree,
    department: state.profile.department,
    graduation_year: state.profile.graduationYear ? Number(state.profile.graduationYear) : null,
    certifications: state.profile.certificationName
      ? [{ name: state.profile.certificationName, org: state.profile.certificationOrg, year: state.profile.certificationYear, url: state.profile.certificationUrl }]
      : [],
    photo_path: state.photo ? "pending" : null,
  };
}

type Ctx = {
  candidate: CandidateState;
  setPhoto: (dataUrl: string | null) => void;
  setProfile: (profile: CandidateProfile) => void;
  profileComplete: boolean;
  cumulative: number;
  previousCumulative: number | null;
  loading: boolean;
};

const CandidateContext = createContext<Ctx | null>(null);

export function CandidateProvider({ children }: { children: ReactNode }) {
  const [candidate, setCandidate] = useState<CandidateState>(emptyState);
  const [loading, setLoading] = useState(true);
  const fetchProfile = useServerFn(getProfile);
  const saveProfile = useServerFn(upsertProfile);
  const savePhoto = useServerFn(uploadPhoto);
  const fetchInterviews = useServerFn(listInterviews);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        if (!cancelled) {
          setCandidate(emptyState);
          setLoading(false);
        }
        return;
      }
      try {
        const [profile, interviews] = await Promise.all([fetchProfile({ data: undefined }), fetchInterviews({ data: undefined })]);
        if (cancelled) return;
        const base = profile ? dbToState(profile) : emptyState;
        setCandidate({ ...base, history: interviews ?? [] });
      } catch (e) {
        console.error("Failed to load candidate data", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") load();
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [fetchProfile, fetchInterviews]);

  const setPhoto = useCallback(async (photo: string | null) => {
    setCandidate(c => ({ ...c, photo }));
    if (!photo) return;
    try {
      const result = await savePhoto({ data: { base64: photo, contentType: "image/jpeg" } });
      if (result?.url) {
        setCandidate(c => ({ ...c, photo: result.url }));
      }
    } catch (e) {
      console.error("Failed to upload photo", e);
    }
  }, [savePhoto]);

  const setProfile = useCallback(async (profile: CandidateProfile) => {
    setCandidate(c => {
      const next = { ...c, profile };
      (async () => {
        try {
          await saveProfile({ data: stateToDb(next) });
        } catch (e) {
          console.error("Failed to save profile", e);
        }
      })();
      return next;
    });
  }, [saveProfile]);

  const value = useMemo<Ctx>(() => {
    const latest = candidate.history[0];
    return {
      candidate,
      setPhoto,
      setProfile,
      profileComplete: isProfileComplete(candidate.profile),
      cumulative: latest?.cumulative ?? 0,
      previousCumulative: candidate.history[1]?.cumulative ?? null,
      loading,
    };
  }, [candidate, setPhoto, setProfile, loading]);

  return <CandidateContext.Provider value={value}>{children}</CandidateContext.Provider>;
}

export function useCandidate(): Ctx {
  const ctx = useContext(CandidateContext);
  if (!ctx) throw new Error("useCandidate must be used inside CandidateProvider");
  return ctx;
}
