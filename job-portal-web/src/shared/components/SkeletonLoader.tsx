type Props = { variant?: "card" | "text" | "circle"; count?: number; width?: number | string; height?: number | string };

export default function SkeletonLoader({ variant = "text", count = 1, width, height }: Props) {
  const defaults = {
    card: { width: width || "100%", height: height || 140, radius: 8 },
    text: { width: width || "100%", height: height || 16, radius: 6 },
    circle: { width: width || 48, height: height || 48, radius: "50%" },
  }[variant];
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {Array.from({ length: count }, (_, index) => (
        <div
          key={`${variant}-${index}`}
          aria-hidden="true"
          style={{
            width: defaults.width, height: defaults.height, borderRadius: defaults.radius,
            background: "linear-gradient(90deg,#E5E7EB 0%,#FFFFFF 50%,#E5E7EB 100%)", backgroundSize: "200% 100%",
          }}
        />
      ))}
    </div>
  );
}
