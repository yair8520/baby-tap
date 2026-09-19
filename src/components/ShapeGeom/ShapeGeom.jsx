/** Shared SVG shape renderer used by ShapeMatch, ShapeMemory, and Pattern. */
export function ShapeGeom({
  shape,
  size,
  fill,
  stroke,
  strokeWidth,
  dash,
  strokeDash,
  opacity,
}) {
  const dashArray = dash ?? strokeDash;
  const p = {
    fill: fill ?? "none",
    stroke: stroke ?? "none",
    strokeWidth: strokeWidth ?? 0,
    strokeLinejoin: "round",
    strokeLinecap: "round",
    opacity: opacity ?? 1,
    ...(dashArray ? { strokeDasharray: dashArray } : {}),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{ display: "block", overflow: "visible" }}
    >
      {shape === "circle" && <circle cx="50" cy="50" r="43" {...p} />}
      {shape === "square" && (
        <rect x="8" y="8" width="84" height="84" rx="12" {...p} />
      )}
      {shape === "triangle" && <polygon points="50,7 93,89 7,89" {...p} />}
      {shape === "star" && (
        <polygon
          points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35"
          {...p}
        />
      )}
      {shape === "hexagon" && (
        <polygon points="50,5 92,27 92,73 50,95 8,73 8,27" {...p} />
      )}
    </svg>
  );
}
