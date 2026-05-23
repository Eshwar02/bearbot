export default function InfoLoading() {
  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="size-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        <p className="text-white/50 text-sm">Loading...</p>
      </div>
    </div>
  );
}
