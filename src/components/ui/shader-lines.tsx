export function ShaderAnimation() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 40px,
              rgba(45, 212, 191, 0.3) 40px,
              rgba(45, 212, 191, 0.3) 41px
            ),
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 40px,
              rgba(45, 212, 191, 0.15) 40px,
              rgba(45, 212, 191, 0.15) 41px
            ),
            radial-gradient(
              ellipse at 50% 50%,
              rgba(45, 212, 191, 0.08) 0%,
              transparent 70%
            )
          `,
        }}
      />

      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          background: `
            linear-gradient(
              105deg,
              transparent 40%,
              rgba(45, 212, 191, 0.4) 45%,
              transparent 50%,
              rgba(45, 212, 191, 0.2) 55%,
              transparent 60%
            )
          `,
          backgroundSize: "200% 100%",
          animation: "shimmer 8s ease-in-out infinite",
        }}
      />

      <div
        className="absolute -top-1/2 -left-1/2 w-full h-full opacity-[0.04]"
        style={{
          background: "radial-gradient(circle at 30% 50%, rgba(45, 212, 191, 0.8) 0%, transparent 50%)",
          animation: "drift 12s ease-in-out infinite",
        }}
      />
      <div
        className="absolute -bottom-1/2 -right-1/2 w-full h-full opacity-[0.04]"
        style={{
          background: "radial-gradient(circle at 70% 50%, rgba(56, 189, 248, 0.8) 0%, transparent 50%)",
          animation: "drift 10s ease-in-out infinite reverse",
        }}
      />
    </div>
  )
}
