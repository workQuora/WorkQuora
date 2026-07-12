import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 select-none">
      <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-primary via-indigo-500 to-cyan-400 shadow-[0_0_15px_rgba(30,0,169,0.25)]">
        <span className="text-base font-black tracking-tighter text-white">W</span>
      </span>
      <span className="text-lg font-extrabold tracking-tight text-foreground">
        Work
        <span className="bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">
          Quora
        </span>
      </span>
    </Link>
  );
}
