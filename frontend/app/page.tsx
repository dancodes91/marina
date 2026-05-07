import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-semibold text-slate-900">Marina Service Portal</h1>
      <p className="max-w-md text-center text-slate-600">
        Submit and track boat service requests online.
      </p>
      <div className="flex gap-4">
        <Link
          className="rounded-lg bg-blue-700 px-5 py-2.5 text-white hover:bg-blue-800"
          href="/login"
        >
          Sign in
        </Link>
        <Link className="rounded-lg border border-slate-300 px-5 py-2.5 text-slate-800 hover:bg-slate-50" href="/claim">
          Claim account
        </Link>
      </div>
    </main>
  );
}
