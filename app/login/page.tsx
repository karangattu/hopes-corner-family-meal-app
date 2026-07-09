import { redirect } from "next/navigation";
import { signIn } from "@/app/actions/auth";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  if (!hasSupabaseConfig()) {
    return (
      <main className="login-shell">
        <section className="login-panel">
          <div>
            <p className="eyebrow">Hope&apos;s Corner</p>
            <h1>Supabase setup</h1>
          </div>
          <p className="setup-copy">
            Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
          </p>
        </section>
      </main>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  const { error } = await searchParams;

  return (
    <main className="login-shell">
      <form className="login-panel" action={signIn}>
        <div>
          <p className="eyebrow">Hope&apos;s Corner</p>
          <h1>Delivery routes</h1>
        </div>

        <label>
          Email
          <input name="email" type="email" autoComplete="email" required />
        </label>

        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </label>

        {error ? <p className="form-error">{error}</p> : null}

        <button className="primary-button" type="submit">
          Sign in
        </button>
      </form>
    </main>
  );
}
