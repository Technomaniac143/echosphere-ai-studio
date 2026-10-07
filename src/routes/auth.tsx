import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, Radio } from "lucide-react";

export const Route = createFileRoute("/auth")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) throw redirect({ to: "/dashboard" });
  },
  head: () => ({
    meta: [
      { title: "Sign in — EchoSphere" },
      { name: "description", content: "Sign in or create an EchoSphere candidate account." },
    ],
  }),
  component: AuthPage,
});

const violetButton =
  "rounded-none bg-brand px-5 font-semibold text-white shadow-[4px_4px_0_#16121d] hover:bg-brand/90 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#16121d]";

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        });
        if (error) throw error;
        setMessage("Check your email for a confirmation link, then sign in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-12 md:px-16 lg:px-24 bg-[#f7f4fb]">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight mb-10">
          <span className="grid size-8 place-items-center bg-brand text-white shadow-[3px_3px_0_#f2dc47]">
            <Radio className="size-4" />
          </span>
          EchoSphere
        </Link>

        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          {mode === "signin" ? "Welcome back." : "Create your account."}
        </h1>
        <p className="mt-3 text-muted-foreground">
          {mode === "signin"
            ? "Sign in to continue practicing with your AI interview panel."
            : "Join EchoSphere and start your adaptive interview practice."}
        </p>

        <Tabs
          value={mode}
          onValueChange={(v) => setMode(v as typeof mode)}
          className="mt-8 w-full max-w-md"
        >
          <TabsList className="grid w-full grid-cols-2 rounded-none border border-foreground/15 bg-white">
            <TabsTrigger
              value="signin"
              className="rounded-none data-[state=active]:bg-brand data-[state=active]:text-white"
            >
              Sign in
            </TabsTrigger>
            <TabsTrigger
              value="signup"
              className="rounded-none data-[state=active]:bg-brand data-[state=active]:text-white"
            >
              Sign up
            </TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <AuthForm
              mode="signin"
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              name={name}
              setName={setName}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              loading={loading}
              error={error}
              message={message}
              onSubmit={submit}
            />
          </TabsContent>
          <TabsContent value="signup">
            <AuthForm
              mode="signup"
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              name={name}
              setName={setName}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              loading={loading}
              error={error}
              message={message}
              onSubmit={submit}
            />
          </TabsContent>
        </Tabs>
      </div>

      <div className="hidden lg:flex flex-col justify-center bg-brand p-16 text-white">
        <p className="font-mono text-xs uppercase tracking-[.2em] text-highlight">
          Candidate workspace
        </p>
        <h2 className="mt-6 text-4xl font-semibold leading-tight max-w-md">
          A quiet, intelligent space to sharpen how you answer.
        </h2>
        <p className="mt-6 text-white/70 leading-relaxed max-w-md">
          Practice with a coordinated AI panel, get evidence-backed scores, and build a personalized
          improvement roadmap.
        </p>
      </div>
    </main>
  );
}

function AuthForm({
  mode,
  email,
  setEmail,
  password,
  setPassword,
  name,
  setName,
  showPassword,
  setShowPassword,
  loading,
  error,
  message,
  onSubmit,
}: {
  mode: "signin" | "signup";
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  name: string;
  setName: (v: string) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  loading: boolean;
  error: string | null;
  message: string | null;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4 max-w-md">
      {mode === "signup" && (
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Arjun Sharma"
            required
            className="h-12 rounded-none border-foreground/20"
          />
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          className="h-12 rounded-none border-foreground/20"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
            className="h-12 rounded-none border-foreground/20 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {message && <p className="text-sm text-success">{message}</p>}

      <Button
        type="submit"
        disabled={loading || !email || !password || (mode === "signup" && !name)}
        className={cn(violetButton, "h-12 w-full")}
      >
        {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
      </Button>

      <div className="relative my-4 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-foreground/15" />
        </div>
        <span className="relative bg-[#f7f4fb] px-2 text-xs uppercase text-muted-foreground font-mono">
          Or
        </span>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={() => {
          if (typeof window !== "undefined") {
            localStorage.setItem("echosphere_demo_user", "true");
            window.location.href = "/setup";
          }
        }}
        className="h-12 w-full rounded-none border-2 border-brand font-semibold text-brand hover:bg-brand hover:text-white"
      >
        ⚡ Continue as Guest Candidate (Instant Demo)
      </Button>
    </form>
  );
}
