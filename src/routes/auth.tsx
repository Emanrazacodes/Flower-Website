import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Flower2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Bloomora" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [signInData, setSignInData] = useState({ email: "", password: "" });
  const [signUpData, setSignUpData] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (user) navigate({ to: "/" }); }, [user, navigate]);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(signInData);
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back!");
    navigate({ to: "/" });
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: signUpData.email,
      password: signUpData.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: signUpData.name },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Account created — you're signed in.");
    navigate({ to: "/" });
  };

  const googleSignIn = async () => {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) toast.error(result.error.message ?? "Google sign-in failed");
  };

  return (
    <div className="container mx-auto flex max-w-md flex-col items-center px-4 py-16">
      <Link to="/" className="mb-6 flex items-center gap-2 text-primary">
        <Flower2 className="h-6 w-6" /> <span className="font-display text-2xl">Bloomora</span>
      </Link>
      <div className="w-full rounded-3xl border border-border/60 bg-card p-8 shadow-petal">
        <Tabs defaultValue="signin">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Create account</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form onSubmit={signIn} className="mt-6 space-y-4">
              <div><Label>Email</Label><Input type="email" required value={signInData.email} onChange={(e) => setSignInData({ ...signInData, email: e.target.value })} /></div>
              <div><Label>Password</Label><Input type="password" required value={signInData.password} onChange={(e) => setSignInData({ ...signInData, password: e.target.value })} /></div>
              <Button type="submit" className="w-full" disabled={loading}>Sign in</Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={signUp} className="mt-6 space-y-4">
              <div><Label>Full name</Label><Input required value={signUpData.name} onChange={(e) => setSignUpData({ ...signUpData, name: e.target.value })} /></div>
              <div><Label>Email</Label><Input type="email" required value={signUpData.email} onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })} /></div>
              <div><Label>Password</Label><Input type="password" required minLength={6} value={signUpData.password} onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })} /></div>
              <Button type="submit" className="w-full" disabled={loading}>Create account</Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
        </div>
        <Button type="button" variant="outline" className="w-full" onClick={googleSignIn}>
          Continue with Google
        </Button>
      </div>
    </div>
  );
}
