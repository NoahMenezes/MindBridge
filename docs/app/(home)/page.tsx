import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] text-center px-4 bg-white dark:bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] dark:from-zinc-900 dark:via-black dark:to-black transition-colors duration-500">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 dark:opacity-20 pointer-events-none"></div>

      <div className="relative z-10 space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800/50 border border-zinc-700/50 text-xs font-medium text-zinc-400">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          Neural Identity Engine Active
        </div>

        <h1 className="text-6xl md:text-8xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-500">
          MindBridge
        </h1>

        <p className="max-w-[600px] text-zinc-600 dark:text-zinc-400 text-lg md:text-xl leading-relaxed mx-auto">
          The cross-platform Neural Operating System for AI tools.
          Persistent memory, unified identity, and seamless context bridging.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/docs"
            className="px-8 py-3 rounded-xl bg-black text-white dark:bg-white dark:text-black font-semibold hover:opacity-90 transition-all shadow-[0_0_20px_rgba(0,0,0,0.1)] dark:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
          >
            Explore Docs
          </Link>
          <a
            href="https://github.com/NoahMenezes/MindBridge"
            target="_blank"
            rel="noreferrer"
            className="px-8 py-3 rounded-xl bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-white font-semibold border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all"
          >
            GitHub
          </a>
        </div>
      </div>

      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-8 opacity-40 grayscale contrast-125">
        <span className="text-sm font-bold tracking-widest text-zinc-500">CHATGPT</span>
        <span className="text-sm font-bold tracking-widest text-zinc-500">CLAUDE</span>
        <span className="text-sm font-bold tracking-widest text-zinc-500">GEMINI</span>
        <span className="text-sm font-bold tracking-widest text-zinc-500">COPILOT</span>
      </div>
    </main>
  );
}
