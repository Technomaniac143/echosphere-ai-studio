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
  status?: string | undefined;
  technical?: number | null | undefined;
  behavioral?: number | null | undefined;
  productManager?: number | null | undefined;
  hiringManager?: number | null | undefined;
  terminationReason?: string | null | undefined;
};

export type CandidateProfile = {
  fullName: string;
  email: string;
  phone: string;
  resumeName: string;
  github: string;
  linkedin: string;
  bestProject: string;
  experience: string;
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
  fullName: "", email: "", phone: "", resumeName: "", github: "", linkedin: "", bestProject: "", experience: "",
  institution: "", degree: "", department: "", graduationYear: "",
  certificationName: "", certificationOrg: "", certificationYear: "", certificationUrl: "",
};

export const requiredProfileFields: (keyof CandidateProfile)[] = [
  "fullName", "email", "phone", "resumeName", "github", "institution", "degree", "department", "graduationYear",
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

const emptyState: CandidateState = {
  name: "", email: "", photo: null, profile: emptyProfile, history: [], targetRole: undefined,
};

function dbToState(db: any): CandidateState {
  const certs = Array.isArray(db.certifications) && db.certifications.length > 0 ? db.certifications[0] : {};
  return {
    name: db.full_name || "",
    email: db.email || "",
    photo: db.photo_url || null,
    profile: {
      fullName: db.full_name || "",
      email: db.email || "",
      phone: db.phone || "",
      resumeName: db.resume_path ? (String(db.resume_path).split("/").pop() ?? "") : "",
      github: db.github_url || "",
      linkedin: db.linkedin_url || "",
      bestProject: db.best_project_url || "",
      experience: db.experience || "",
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

function profileToDb(p: CandidateProfile): any {
  return {
    full_name: p.fullName,
    email: p.email,
    phone: p.phone,
    github_url: p.github,
    linkedin_url: p.linkedin,
    best_project_url: p.bestProject,
    experience: p.experience,
    institution: p.institution,
    degree: p.degree,
    department: p.department,
    graduation_year: p.graduationYear ? p.graduationYear.trim() : null,
    certifications: p.certificationName
      ? [{ name: p.certificationName, org: p.certificationOrg, year: p.certificationYear, url: p.certificationUrl }]
      : [],
    resume_path: p.resumeName || null,
  };
}

type Ctx = {
  candidate: CandidateState;
  setPhoto: (dataUrl: string | null) => void;
  setProfile: (profile: CandidateProfile) => Promise<{ ok: boolean; error?: string }>;
  refresh: () => void;
  profileComplete: boolean;
  cumulative: number;
  previousCumulative: number | null;
  loading: boolean;
};

const CandidateContext = createContext<Ctx | null>(null);

export function CandidateProvider({ children }: { children: ReactNode }) {
  const [candidate, setCandidate] = useState<CandidateState>(emptyState);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const fetchProfile = useServerFn(getProfile);
  const saveProfile = useServerFn(upsertProfile);
  const savePhoto = useServerFn(uploadPhoto);
  const fetchInterviews = useServerFn(listInterviews);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        if (!cancelled) { setCandidate(emptyState); setLoading(false); }
        return;
      }
      try {
        const [profile, interviews] = await Promise.all([fetchProfile({ data: undefined }), fetchInterviews({ data: undefined })]);
        if (cancelled) return;
        const base = profile ? dbToState(profile) : emptyState;
        setCandidate({ ...base, history: (interviews ?? []) as any });
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
    return () => { cancelled = true; subscription.unsubscribe(); };
  }, [fetchProfile, fetchInterviews, tick]);

  const refresh = useCallback(() => setTick(t => t + 1), []);

  const setPhoto = useCallback(async (photo: string | null) => {
    setCandidate(c => ({ ...c, photo }));
    if (!photo) return;
    try {
      const result = await savePhoto({ data: { base64: photo, contentType: "image/jpeg" } });
      if (result?.url) setCandidate(c => ({ ...c, photo: result.url }));
    } catch (e) {
      console.error("Failed to upload photo", e);
    }
  }, [savePhoto]);

  const setProfile = useCallback(async (profile: CandidateProfile): Promise<{ ok: boolean; error?: string }> => {
    try {
      const saved: any = await saveProfile({ data: profileToDb(profile) });
      const base = saved ? dbToState(saved) : null;
      setCandidate(c => (base ? { ...base, history: c.history, photo: base.photo ?? c.photo } : { ...c, profile }));
      return { ok: true };
    } catch (e: any) {
      const message = e?.message?.includes("[") ? "Some details could not be saved. Please check the highlighted fields." : (e?.message ?? "Your profile could not be saved.");
      return { ok: false, error: message };
    }
  }, [saveProfile]);

  const value = useMemo<Ctx>(() => {
    const latest = candidate.history[0];
    return {
      candidate,
      setPhoto,
      setProfile,
      refresh,
      profileComplete: isProfileComplete(candidate.profile),
      cumulative: latest?.cumulative ?? 0,
      previousCumulative: candidate.history[1]?.cumulative ?? null,
      loading,
    };
  }, [candidate, setPhoto, setProfile, refresh, loading]);

  return <CandidateContext.Provider value={value}>{children}</CandidateContext.Provider>;
}

export function useCandidate(): Ctx {
  const ctx = useContext(CandidateContext);
  if (!ctx) throw new Error("useCandidate must be used inside CandidateProvider");
  return ctx;
}
