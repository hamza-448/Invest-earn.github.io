export function Ambient() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-40 -left-32 size-[560px] rounded-full bg-accent/25 blur-[120px] animate-[floaty_14s_ease-in-out_infinite]" />
      <div className="absolute top-1/3 -right-40 size-[520px] rounded-full bg-brand/20 blur-[130px] animate-[floaty2_16s_ease-in-out_infinite]" />
      <div className="absolute bottom-0 left-1/3 size-[460px] rounded-full bg-accent/15 blur-[120px]" />
    </div>
  );
}
