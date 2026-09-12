// Shared validation rules used by BOTH the browser forms and the server functions.

export const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/;
export const PHONE_RE = /^[0-9]{10}$/;
export const GITHUB_REPO_RE = /^https:\/\/(www\.)?github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/?$/;
export const GITHUB_ANY_RE = /^https:\/\/(www\.)?github\.com\/[A-Za-z0-9_.-]+(\/[A-Za-z0-9_.-]+)?\/?$/;
export const LINKEDIN_RE = /^https:\/\/(www\.)?linkedin\.com\/(in|company|pub)\/[A-Za-z0-9_%-]+\/?$/;
export const URL_RE = /^https?:\/\/[^\s]+\.[^\s]+$/;

export type Validator = (value: string) => string | null;

export const required = (label: string): Validator => (v) =>
  v && v.trim().length > 0 ? null : `${label} is required.`;

export const validEmail: Validator = (v) =>
  !v.trim() ? "Email address is required." : EMAIL_RE.test(v.trim()) ? null : "Please enter a valid email address, for example name@gmail.com.";

export const validPhone: Validator = (v) => {
  const t = v.trim();
  if (!t) return "Phone number is required.";
  if (/[^0-9]/.test(t)) return "Phone number must contain digits only.";
  if (!PHONE_RE.test(t)) return "Phone number must be exactly 10 digits.";
  return null;
};

export const validGithubRepo: Validator = (v) => {
  const t = v.trim();
  if (!t) return "GitHub repository URL is required.";
  return GITHUB_REPO_RE.test(t) ? null : "Enter a full repository URL, for example https://github.com/username/project.";
};

export const validLinkedin: Validator = (v) => {
  const t = v.trim();
  if (!t) return null; // optional
  return LINKEDIN_RE.test(t) ? null : "Enter a valid LinkedIn URL, for example https://linkedin.com/in/username.";
};

export const validUrlOptional: Validator = (v) => {
  const t = v.trim();
  if (!t) return null;
  return URL_RE.test(t) ? null : "Enter a valid URL starting with http:// or https://.";
};

export const validGraduationYear: Validator = (v) => {
  const t = v.trim();
  if (!t) return "Graduation year is required.";
  if (!/^[0-9]{4}$/.test(t)) return "Enter a 4-digit year, for example 2025.";
  const n = Number(t);
  if (n < 1950 || n > 2100) return "Enter a year between 1950 and 2100.";
  return null;
};

/** Split "https://github.com/owner/repo" into its parts. */
export function parseGithubRepo(url: string): { owner: string; repo: string } | null {
  const m = url.trim().match(/^https:\/\/(?:www\.)?github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?\/?$/);
  if (!m || !m[1] || !m[2]) return null;
  return { owner: m[1], repo: m[2] };
}

export const RESUME_TYPES = [".pdf", ".doc", ".docx"];
export const MAX_RESUME_BYTES = 10 * 1024 * 1024;

export function validateResumeFile(file: File): string | null {
  const name = file.name.toLowerCase();
  if (!RESUME_TYPES.some(ext => name.endsWith(ext))) return "Resume must be a PDF, DOC or DOCX file.";
  if (file.size > MAX_RESUME_BYTES) return "Resume must be smaller than 10MB.";
  return null;
}
