// EliteCrew signature loader — the logo mark inside a thin spinning gold arc.
// The mobile apps render the identical design (customer-app src/components/ui.js
// BrandSpinner) so loading feels the same on every surface.
//
//   <BrandLoader fullScreen label="Loading your bookings" />   // page-level
//   <BrandLoader size={40} />                                   // inline block

export default function BrandLoader({ label, size = 64, fullScreen = false }) {
  const inner = (
    <div className="flex flex-col items-center gap-5">
      <div className="relative" style={{ width: size, height: size }}>
        <div
          className="absolute inset-0 rounded-full border-2 border-zinc-200 animate-spin"
          style={{ borderTopColor: "#C8A45C" }}
        />
        <img
          src="/elitecrew_logo.png"
          alt=""
          className="absolute inset-0 m-auto object-contain"
          style={{ width: size * 0.48, height: size * 0.48 }}
        />
      </div>
      {label ? (
        <p className="text-zinc-400 font-bold tracking-widest uppercase text-[11px]">{label}</p>
      ) : null}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center font-sans">
        {inner}
      </div>
    );
  }
  return inner;
}
