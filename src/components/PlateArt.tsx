const PLATE_HEX: Record<string, string> = {
  red: "#E60012",
  gold: "#C8963A",
  silver: "#9AA5B1",
  black: "#2B2B2B",
  blue: "#1E6FBA",
};

const CATEGORY_GLYPH: Record<string, string> = {
  sushi: "鮨",
  sashimi: "刺",
  rolls: "卷",
  set: "盛",
  noodles: "麵",
  dessert: "甘",
  drinks: "飲",
};

/** Stylised sushi-plate illustration used in place of food photography (POC). */
export function PlateArt({
  plateColor,
  category,
  className,
}: {
  plateColor: string;
  category: string;
  className?: string;
}) {
  const rim = PLATE_HEX[plateColor] ?? PLATE_HEX.red;
  const glyph = CATEGORY_GLYPH[category] ?? "鮨";
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <circle cx="60" cy="60" r="56" fill={rim} />
      <circle cx="60" cy="60" r="48" fill="#FFFFFF" />
      <circle cx="60" cy="60" r="48" fill="none" stroke="#E5E7EB" strokeWidth="1" />
      {/* nigiri: rice + topping */}
      <ellipse cx="60" cy="78" rx="26" ry="12" fill="#FDFDF8" stroke="#E3E0D2" strokeWidth="1.5" />
      <rect x="36" y="52" width="48" height="20" rx="10" fill={rim} opacity="0.88" />
      <rect x="36" y="52" width="48" height="8" rx="4" fill="#FFFFFF" opacity="0.25" />
      <text
        x="60"
        y="47"
        textAnchor="middle"
        fontSize="16"
        fontWeight="700"
        fill="#3A3A3A"
        fontFamily="'Hiragino Sans','Noto Sans TC',sans-serif"
      >
        {glyph}
      </text>
    </svg>
  );
}
