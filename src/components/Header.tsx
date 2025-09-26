export default function Header() {
    return (
      <header className="mx-auto mt-1 max-w-6xl px-4">
        <div className="rounded-2xl border border-white/5 bg-bg-card shadow-soft">
          <div className="py-2 text-center">
            <h1
              className="
                text-xl sm:text-3xl font-semibold tracking-wide text-primary
                drop-shadow-[0_0_8px_rgba(0,255,247,0.35)]
              "
            >
            Naay Duwa?
            </h1>
          </div>
          <div className="h-px w-full bg-white/10" />
        </div>
      </header>
    );
  }