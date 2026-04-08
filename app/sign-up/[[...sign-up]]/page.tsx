import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-navy-950 px-6 py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(79,163,188,0.2),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(139,218,239,0.14),transparent_28%)]" />
      <div className="relative z-10 w-full max-w-md rounded-[2rem] border border-white/10 bg-white/5 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <SignUp />
      </div>
    </main>
  );
}
