import { COLOR_HEX, COLOR_LABEL, type ColorKey } from "../data/catalogue";

export function ColorSwatches({ colors, size = 22 }: { colors: ColorKey[]; size?: number }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {colors.map((c) => (
        <li key={c} title={COLOR_LABEL[c]}>
          {c === "transparent" ? (
            <span
              className="block rounded-full border border-ink/15"
              style={{
                width: size,
                height: size,
                background:
                  "repeating-conic-gradient(from 0deg, #ffffff 0deg 90deg, #e7e4da 90deg 180deg)",
              }}
            />
          ) : (
            <span
              className="block rounded-full border border-ink/10 shadow-sm"
              style={{ width: size, height: size, background: COLOR_HEX[c] }}
            />
          )}
        </li>
      ))}
    </ul>
  );
}
