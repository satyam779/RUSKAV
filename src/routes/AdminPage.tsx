import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  categories,
  bioCategory,
  CERT_LABEL,
  COLOR_HEX,
  COLOR_LABEL,
  type CertKind,
  type ColorKey,
} from "../data/catalogue";
import { signOut, useAuth } from "../lib/auth";
import { isSupabaseConfigured, requireSupabase, supabase } from "../lib/supabase";
import {
  fallbackProducts,
  formatMoney,
  fromRow,
  toRow,
  type ShopProduct,
  type SpecRow,
} from "../lib/products";
import {
  Badge,
  EmptyState,
  Notice,
  PageHeader,
  Section,
  Spinner,
  buttonClass,
} from "../components/ui";

export type Range = { id: string; name: string };

const ALL_CATEGORIES: Range[] = [
  ...categories.map((c) => ({ id: c.id, name: c.shortName })),
  { id: bioCategory.id, name: bioCategory.shortName },
];

/**
 * The five ranges, as database rows.
 *
 * These are reference data, not something an admin invents — they come from the
 * print catalogue. `products.category_id` is a foreign key to them, so a
 * product cannot be saved until its range exists. Rather than make that a
 * manual step that fails confusingly, the dashboard writes them itself (see
 * `ensureRanges`).
 */
const CATEGORY_ROWS = [
  ...categories.map((c, i) => ({
    id: c.id,
    name: c.name,
    short_name: c.shortName,
    kicker: c.kicker,
    tagline: c.tagline,
    hero_image: c.heroImage,
    thumb: c.thumb,
    theme: c.theme,
    sort_order: i,
  })),
  {
    id: bioCategory.id,
    name: bioCategory.name,
    short_name: bioCategory.shortName,
    kicker: bioCategory.kicker,
    tagline: bioCategory.tagline,
    hero_image: bioCategory.heroImage,
    thumb: bioCategory.thumb,
    theme: bioCategory.theme,
    sort_order: categories.length,
  },
];

/**
 * Makes sure every range exists, and returns the ones the database actually
 * has. Safe to call on every dashboard load: it is an upsert on a fixed set of
 * five rows.
 */
async function ensureRanges(): Promise<Range[]> {
  const client = requireSupabase();

  const { error: writeError } = await client
    .from("categories")
    .upsert(CATEGORY_ROWS, { onConflict: "id" });
  // A write failure is not fatal here — the ranges may already be right, and
  // the read below is what the editor actually depends on.
  if (writeError) console.warn("Could not sync ranges:", writeError.message);

  const { data, error } = await client
    .from("categories")
    .select("id, short_name")
    .order("sort_order", { ascending: true });
  if (error) throw error;

  return (data ?? []).map((c) => ({
    id: c.id as string,
    name: (c.short_name as string) ?? (c.id as string),
  }));
}

const ALL_CERTS: CertKind[] = ["food", "dishwasher", "freezer", "microwave", "tuv"];
const ALL_COLORS = Object.keys(COLOR_HEX) as ColorKey[];
const STOCK_OPTIONS = [
  { value: "in_stock", label: "In stock" },
  { value: "made_to_order", label: "Made to order" },
  { value: "out_of_stock", label: "Out of stock" },
];

const field =
  "w-full rounded-xl border border-ink/12 bg-paper-dim/50 px-3 py-2 text-sm text-ink transition placeholder:text-ink-soft/60 focus:border-brand";
const label = "text-[11px] font-semibold uppercase tracking-wider text-ink-soft/70";

/**
 * Postgres error codes read as noise to anyone who is not a DBA, and the
 * difference between them is exactly what tells you what to do next.
 */
function describeWriteError(err: unknown): string {
  const e = err as { code?: string; message?: string } | null;
  const code = e?.code;
  const message = e?.message ?? "Something went wrong.";

  if (code === "42501") {
    return "The database refused the change: this account is signed in but is not an admin. Add its user id to the admins table (see supabase/make-admin.sql).";
  }
  if (code === "23503") {
    return "That range does not exist in the database. Reload the dashboard — it recreates the five ranges on load — or run supabase/seed-catalogue.sql.";
  }
  if (code === "23505") {
    return "That product code already exists. Codes have to be unique.";
  }
  if (code === "42P01") {
    return "The tables are missing. Run supabase/schema.sql in the Supabase SQL editor first.";
  }
  if (code === "42703") {
    return "Your database is a version behind this dashboard — it is missing a column the form writes (the HSN, lead time, case weight and carton fields are the recent ones). Re-run supabase/schema.sql in the SQL editor; it only adds what is missing.";
  }
  return message;
}

function blankProduct(): ShopProduct {
  return {
    id: "",
    code: "",
    name: "",
    description: null,
    categoryId: categories[0].id,
    groupName: null,
    size: null,
    casePack: 50,
    material: null,
    materialCode: null,
    surface: null,
    colors: [],
    certs: ["food", "dishwasher"],
    specs: [],
    qualityNotes: null,
    price: null,
    mrp: null,
    discountPercent: 0,
    priceUnit: "case",
    currency: "INR",
    taxPercent: 18,
    moq: 1,
    hsnCode: null,
    leadTime: null,
    caseWeightKg: null,
    cartonSize: null,
    stockStatus: "in_stock",
    images: [],
    isPublished: true,
    isFeatured: false,
    sortOrder: 0,
  };
}

/** A number input that allows an empty value to mean "not set". */
function NumberField({
  value,
  onChange,
  placeholder,
  step = "1",
  min,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  placeholder?: string;
  step?: string;
  min?: string;
}) {
  return (
    <input
      type="number"
      inputMode="decimal"
      step={step}
      min={min}
      value={value ?? ""}
      placeholder={placeholder}
      onChange={(e) => {
        const raw = e.target.value;
        onChange(raw === "" ? null : Number.parseFloat(raw));
      }}
      className={field}
    />
  );
}

// ------------------------------------------------------------ product editor

function ProductEditor({
  initial,
  ranges,
  onSaved,
  onCancel,
}: {
  initial: ShopProduct;
  /** Ranges the database actually has — not the static list, which it may not. */
  ranges: Range[];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<ShopProduct>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const isNew = !initial.id;
  const set = <K extends keyof ShopProduct>(key: K, value: ShopProduct[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const toggleIn = <T,>(list: T[], value: T) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const uploadImages = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setError(null);
    try {
      const client = requireSupabase();
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) {
          throw new Error(`${file.name} is not an image.`);
        }
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`${file.name} is larger than 5 MB — please resize it first.`);
        }
        // Namespace by product code and timestamp so re-uploading a file with
        // the same name cannot overwrite another product's image.
        const ext = file.name.split(".").pop() ?? "jpg";
        const safeCode = (draft.code || "product").replace(/[^a-zA-Z0-9-_]/g, "");
        const path = `${safeCode}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;

        const { error: uploadError } = await client.storage
          .from("product-images")
          .upload(path, file, { cacheControl: "31536000", upsert: false });
        if (uploadError) throw uploadError;

        const { data } = client.storage.from("product-images").getPublicUrl(path);
        urls.push(data.publicUrl);
      }
      setDraft((d) => ({ ...d, images: [...d.images, ...urls] }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const save = async () => {
    setError(null);
    if (!draft.code.trim()) return setError("A product code is required.");
    if (!draft.name.trim()) return setError("A product name is required.");

    setSaving(true);
    try {
      const client = requireSupabase();
      const row = toRow(draft);
      const { error: writeError } = isNew
        ? await client.from("products").insert(row)
        : await client.from("products").update(row).eq("id", draft.id);
      if (writeError) throw writeError;
      onSaved();
    } catch (err) {
      const e = err as { code?: string } | null;
      setError(
        e?.code === "23505"
          ? `Product code ${draft.code} already exists.`
          : describeWriteError(err)
      );
    } finally {
      setSaving(false);
    }
  };

  const updateSpec = (i: number, patch: Partial<SpecRow>) =>
    setDraft((d) => ({
      ...d,
      specs: d.specs.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
    }));

  return (
    <div className="rounded-3xl border border-brand/25 bg-white p-6 shadow-xl shadow-ink/5">
      <div className="flex items-center justify-between gap-4">
        <h3 className="font-display text-xl font-medium text-ink">
          {isNew ? "New product" : `Edit ${initial.code}`}
        </h3>
        <button type="button" onClick={onCancel} className={buttonClass("quiet", "!px-2")}>
          Cancel
        </button>
      </div>

      {error && (
        <div className="mt-4">
          <Notice tone="error">{error}</Notice>
        </div>
      )}

      {/* ------------------------------------------------------- identity */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className={label}>Product code *</span>
          <input
            value={draft.code}
            onChange={(e) => set("code", e.target.value.toUpperCase())}
            className={`${field} font-mono`}
            placeholder="RT1014"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={label}>Name *</span>
          <input
            value={draft.name}
            onChange={(e) => set("name", e.target.value)}
            className={field}
            placeholder="Fast Food Tray"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={label}>Range</span>
          <select
            value={draft.categoryId ?? ""}
            onChange={(e) => set("categoryId", e.target.value || null)}
            className={field}
          >
            <option value="">Unassigned</option>
            {ranges.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={label}>Product line</span>
          <input
            value={draft.groupName ?? ""}
            onChange={(e) => set("groupName", e.target.value || null)}
            className={field}
            placeholder="Budget Tray"
          />
        </label>
      </div>

      <label className="mt-4 flex flex-col gap-1.5">
        <span className={label}>Description</span>
        <textarea
          rows={2}
          value={draft.description ?? ""}
          onChange={(e) => set("description", e.target.value || null)}
          className={`resize-y ${field}`}
          placeholder="Shown on the product page, under the title."
        />
      </label>

      {/* ---------------------------------------------------- commercials */}
      <fieldset className="mt-8 rounded-2xl border border-ink/10 bg-paper-dim/40 p-5">
        <legend className="px-2 font-display text-base font-medium text-ink">
          Price &amp; discount
        </legend>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1.5">
            <span className={label}>Price per {draft.priceUnit}</span>
            <NumberField
              value={draft.price}
              onChange={(v) => set("price", v)}
              step="0.01"
              min="0"
              placeholder="Leave empty for on-request"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={label}>MRP (struck through)</span>
            <NumberField value={draft.mrp} onChange={(v) => set("mrp", v)} step="0.01" min="0" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={label}>Discount %</span>
            <NumberField
              value={draft.discountPercent}
              onChange={(v) => set("discountPercent", v ?? 0)}
              step="0.5"
              min="0"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={label}>GST %</span>
            <NumberField
              value={draft.taxPercent}
              onChange={(v) => set("taxPercent", v ?? 0)}
              step="0.5"
              min="0"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={label}>Sold per</span>
            <select
              value={draft.priceUnit}
              onChange={(e) => set("priceUnit", e.target.value)}
              className={field}
            >
              <option value="case">case</option>
              <option value="piece">piece</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={label}>Min. order (cases)</span>
            <NumberField value={draft.moq} onChange={(v) => set("moq", Math.max(1, v ?? 1))} min="1" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={label}>Stock</span>
            <select
              value={draft.stockStatus}
              onChange={(e) => set("stockStatus", e.target.value)}
              className={field}
            >
              {STOCK_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={label}>Sort order</span>
            <NumberField value={draft.sortOrder} onChange={(v) => set("sortOrder", v ?? 0)} />
          </label>
        </div>
        {draft.price !== null && draft.discountPercent > 0 && (
          <p className="mt-4 text-sm text-ink-soft">
            Customers will see{" "}
            <strong className="font-semibold text-ink">
              {formatMoney(draft.price * (1 - draft.discountPercent / 100), draft.currency)}
            </strong>{" "}
            per {draft.priceUnit}
            {draft.mrp && draft.mrp > draft.price
              ? `, struck through from ${formatMoney(draft.mrp, draft.currency)}`
              : ""}
            .
          </p>
        )}
      </fieldset>

      {/* ---------------------------------------------- specification ---- */}
      <fieldset className="mt-6 rounded-2xl border border-ink/10 bg-paper-dim/40 p-5">
        <legend className="px-2 font-display text-base font-medium text-ink">
          Specification
        </legend>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1.5">
            <span className={label}>Size</span>
            <input
              value={draft.size ?? ""}
              onChange={(e) => set("size", e.target.value || null)}
              className={field}
              placeholder={'10" x 14"'}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={label}>Case pack (ea.)</span>
            <NumberField
              value={draft.casePack}
              onChange={(v) => set("casePack", Math.max(1, v ?? 1))}
              min="1"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={label}>Material</span>
            <input
              value={draft.material ?? ""}
              onChange={(e) => set("material", e.target.value || null)}
              className={field}
              placeholder="Co-Polymer"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={label}>Recycling code</span>
            <input
              value={draft.materialCode ?? ""}
              onChange={(e) => set("materialCode", e.target.value || null)}
              className={field}
              placeholder="5 PP"
            />
          </label>
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className={label}>Surface</span>
            <input
              value={draft.surface ?? ""}
              onChange={(e) => set("surface", e.target.value || null)}
              className={field}
              placeholder="Textured (basket weave)"
            />
          </label>
        </div>

        <div className="mt-5">
          <span className={label}>Specification rows</span>
          <div className="mt-2 flex flex-col gap-2">
            {draft.specs.map((s, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={s.label}
                  onChange={(e) => updateSpec(i, { label: e.target.value })}
                  className={field}
                  placeholder="Heat resistance"
                />
                <input
                  value={s.value}
                  onChange={(e) => updateSpec(i, { value: e.target.value })}
                  className={field}
                  placeholder="-10°C to +82°C"
                />
                <button
                  type="button"
                  onClick={() =>
                    setDraft((d) => ({ ...d, specs: d.specs.filter((_, idx) => idx !== i) }))
                  }
                  className="shrink-0 rounded-xl border border-ink/12 px-3 text-sm text-ink-soft transition hover:border-brand hover:text-brand"
                >
                  <span className="sr-only">Remove this specification row</span>
                  <span aria-hidden="true">×</span>
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setDraft((d) => ({ ...d, specs: [...d.specs, { label: "", value: "" }] }))}
            className={buttonClass("outline", "mt-3 !px-4 !py-2 !text-xs")}
          >
            Add a specification row
          </button>
        </div>

        <label className="mt-5 flex flex-col gap-1.5">
          <span className={label}>Quality notes</span>
          <textarea
            rows={3}
            value={draft.qualityNotes ?? ""}
            onChange={(e) => set("qualityNotes", e.target.value || null)}
            className={`resize-y ${field}`}
            placeholder="Anything a buyer should know about durability, testing or handling."
          />
        </label>
      </fieldset>

      {/* -------------------------------------------- trade and dispatch */}
      <fieldset className="mt-6 rounded-2xl border border-ink/10 bg-paper-dim/40 p-5">
        <legend className="px-2 font-display text-base font-medium text-ink">
          Trade &amp; dispatch
        </legend>
        <p className="mb-4 text-xs text-ink-soft">
          What a distributor asks before ordering. Anything left empty is simply
          left off the product page.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1.5">
            <span className={label}>HSN code</span>
            <input
              value={draft.hsnCode ?? ""}
              onChange={(e) => set("hsnCode", e.target.value.trim() || null)}
              className={field}
              placeholder="3924"
              inputMode="numeric"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={label}>Lead time</span>
            <input
              value={draft.leadTime ?? ""}
              onChange={(e) => set("leadTime", e.target.value || null)}
              className={field}
              placeholder="Ships in 3–5 working days"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={label}>Case weight (kg)</span>
            <NumberField
              value={draft.caseWeightKg}
              onChange={(v) => set("caseWeightKg", v)}
              step="0.01"
              min="0"
              placeholder="Gross, per case"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={label}>Carton size</span>
            <input
              value={draft.cartonSize ?? ""}
              onChange={(e) => set("cartonSize", e.target.value || null)}
              className={field}
              placeholder="60 × 40 × 45 cm"
            />
          </label>
        </div>
      </fieldset>

      {/* --------------------------------------------- colours and certs */}
      <fieldset className="mt-6 rounded-2xl border border-ink/10 bg-paper-dim/40 p-5">
        <legend className="px-2 font-display text-base font-medium text-ink">
          Colourways &amp; ratings
        </legend>

        <span className={label}>Colourways</span>
        <ul className="mt-2 flex flex-wrap gap-2">
          {ALL_COLORS.map((c) => {
            const on = draft.colors.includes(c);
            return (
              <li key={c}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => set("colors", toggleIn(draft.colors, c))}
                  className={`flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-xs font-medium transition ${
                    on ? "border-brand bg-brand/8 text-ink" : "border-ink/12 text-ink-soft hover:border-ink/30"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className="h-4 w-4 rounded-full border border-ink/15"
                    style={{
                      background:
                        c === "transparent"
                          ? "repeating-conic-gradient(from 0deg, #fff 0deg 90deg, #e7e4da 90deg 180deg)"
                          : COLOR_HEX[c],
                    }}
                  />
                  {COLOR_LABEL[c]}
                </button>
              </li>
            );
          })}
        </ul>

        <span className={`${label} mt-5 block`}>Rated for</span>
        <ul className="mt-2 flex flex-wrap gap-2">
          {ALL_CERTS.map((c) => {
            const on = draft.certs.includes(c);
            return (
              <li key={c}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => set("certs", toggleIn(draft.certs, c))}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    on ? "border-brand bg-brand text-white" : "border-ink/12 text-ink-soft hover:border-ink/30"
                  }`}
                >
                  {CERT_LABEL[c]}
                </button>
              </li>
            );
          })}
        </ul>
      </fieldset>

      {/* ----------------------------------------------------- imagery */}
      <fieldset className="mt-6 rounded-2xl border border-ink/10 bg-paper-dim/40 p-5">
        <legend className="px-2 font-display text-base font-medium text-ink">Images</legend>
        <p className="text-xs text-ink-soft">
          The first image is used everywhere the product appears in a list. Square shots on a
          plain background sit best in the grid.
        </p>

        {draft.images.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-3">
            {draft.images.map((src, i) => (
              <li key={src} className="relative">
                <img
                  src={src}
                  alt=""
                  className="h-24 w-24 rounded-xl bg-studio object-cover"
                  loading="lazy"
                />
                {i === 0 && (
                  <span className="absolute bottom-1 left-1 rounded-full bg-ink/80 px-1.5 py-0.5 text-[9px] font-bold text-paper">
                    MAIN
                  </span>
                )}
                <div className="absolute -right-1.5 -top-1.5 flex gap-1">
                  {i > 0 && (
                    <button
                      type="button"
                      title="Make this the main image"
                      onClick={() =>
                        setDraft((d) => ({
                          ...d,
                          images: [src, ...d.images.filter((s) => s !== src)],
                        }))
                      }
                      className="grid h-6 w-6 place-items-center rounded-full bg-ink text-[10px] text-paper shadow"
                    >
                      <span className="sr-only">Make image {i + 1} the main image</span>
                      <span aria-hidden="true">★</span>
                    </button>
                  )}
                  <button
                    type="button"
                    title="Remove image"
                    onClick={() =>
                      setDraft((d) => ({ ...d, images: d.images.filter((s) => s !== src) }))
                    }
                    className="grid h-6 w-6 place-items-center rounded-full bg-brand text-[10px] text-white shadow"
                  >
                    <span className="sr-only">Remove image {i + 1}</span>
                    <span aria-hidden="true">×</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => uploadImages(e.target.files)}
            className="text-xs text-ink-soft file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-2 file:text-xs file:font-semibold file:text-paper"
          />
          {uploading && <span className="text-xs text-ink-soft">Uploading…</span>}
        </div>

        <label className="mt-4 flex flex-col gap-1.5">
          <span className={label}>…or paste an image URL</span>
          <input
            className={field}
            placeholder="/gallery/studio-plates.webp — press Enter to add"
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              const value = e.currentTarget.value.trim();
              if (!value) return;
              setDraft((d) => ({ ...d, images: [...d.images, value] }));
              e.currentTarget.value = "";
            }}
          />
        </label>
      </fieldset>

      {/* ---------------------------------------------------- visibility */}
      <div className="mt-6 flex flex-wrap items-center gap-5">
        <label className="flex items-center gap-2 text-sm font-medium text-ink">
          <input
            type="checkbox"
            checked={draft.isPublished}
            onChange={(e) => set("isPublished", e.target.checked)}
            className="h-4 w-4 accent-[#b91c2e]"
          />
          Published
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-ink">
          <input
            type="checkbox"
            checked={draft.isFeatured}
            onChange={(e) => set("isFeatured", e.target.checked)}
            className="h-4 w-4 accent-[#b91c2e]"
          />
          Featured on the home page
        </label>
      </div>

      <div className="mt-8 flex flex-wrap gap-3 border-t border-ink/10 pt-6">
        <button type="button" onClick={save} disabled={saving} className={buttonClass("primary")}>
          {saving ? "Saving…" : isNew ? "Create product" : "Save changes"}
        </button>
        <button type="button" onClick={onCancel} className={buttonClass("outline")}>
          Cancel
        </button>
      </div>
    </div>
  );
}

// -------------------------------------------------------------- products tab

function ProductsTab() {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [ranges, setRanges] = useState<Range[]>(ALL_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<ShopProduct | null>(null);
  const [query, setQuery] = useState("");
  const [seeding, setSeeding] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);

    // Ranges first. products.category_id is a foreign key, so without them a
    // brand new product cannot be saved at all — and the range dropdown would
    // be offering options the database is about to reject.
    try {
      const live = await ensureRanges();
      if (live.length) setRanges(live);
    } catch (err) {
      console.warn("Could not load ranges:", err);
    }

    const { data, error: err } = await supabase
      .from("products")
      .select("*")
      .order("sort_order", { ascending: true });
    setLoading(false);
    if (err) {
      setError(describeWriteError(err));
      return;
    }
    setError(null);
    setProducts((data ?? []).map(fromRow));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /**
   * First-run convenience: copy the print catalogue into the database so the
   * admin starts with all 39 codes to price, rather than an empty table and a
   * lot of retyping.
   *
   * Deliberately idempotent. A plain multi-row insert is all-or-nothing, so
   * pressing this twice used to fail the whole batch on the first duplicate
   * key and import nothing. `upsert` with `ignoreDuplicates` means pressing it
   * any number of times is safe, and prices already set are never overwritten.
   */
  const seed = async () => {
    setSeeding(true);
    setMessage(null);
    setError(null);
    try {
      const client = requireSupabase();

      // Ranges first: products.category_id is a foreign key, so inserting a
      // product before its range exists fails with a 409 that reads like a
      // duplicate but isn't.
      const liveRanges = await ensureRanges();
      if (!liveRanges.length) {
        throw new Error(
          "The ranges could not be written. Check that your user id is in the admins table."
        );
      }
      setRanges(liveRanges);

      const known = new Set(liveRanges.map((r) => r.id));
      const rows = fallbackProducts.map((p) => ({
        ...toRow({ ...p, id: "" }),
        // Never point at a range the database does not have.
        category_id: p.categoryId && known.has(p.categoryId) ? p.categoryId : null,
      }));

      const { data: inserted, error: insertError } = await client
        .from("products")
        .upsert(rows, { onConflict: "code", ignoreDuplicates: true })
        .select("code");
      if (insertError) throw insertError;

      const added = inserted?.length ?? 0;
      setMessage(
        added === 0
          ? `All ${rows.length} catalogue codes were already in the database — nothing to add.`
          : `Imported ${added} product ${added === 1 ? "code" : "codes"}. They are published with no price yet — set prices and they appear in the shop.`
      );
      await load();
    } catch (err) {
      setError(describeWriteError(err));
    } finally {
      setSeeding(false);
    }
  };

  const togglePublished = async (product: ShopProduct) => {
    if (!supabase) return;
    setProducts((list) =>
      list.map((p) => (p.id === product.id ? { ...p, isPublished: !p.isPublished } : p))
    );
    const { error: err } = await supabase
      .from("products")
      .update({ is_published: !product.isPublished })
      .eq("id", product.id);
    if (err) {
      setError(err.message);
      await load();
    }
  };

  const remove = async (product: ShopProduct) => {
    if (!supabase) return;
    if (!window.confirm(`Delete ${product.code} — ${product.name}? This cannot be undone.`)) return;
    const { error: err } = await supabase.from("products").delete().eq("id", product.id);
    if (err) {
      setError(err.message);
      return;
    }
    await load();
  };

  const filtered = useMemo(() => {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return products;
    return products.filter((p) => {
      const haystack = `${p.code} ${p.name} ${p.groupName ?? ""} ${p.material ?? ""}`.toLowerCase();
      return terms.every((t) => haystack.includes(t));
    });
  }, [products, query]);

  const priced = products.filter((p) => p.price !== null).length;

  if (editing) {
    return (
      <ProductEditor
        initial={editing}
        ranges={ranges}
        onCancel={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          void load();
        }}
      />
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-ink-soft">
            <strong className="font-semibold text-ink">{products.length}</strong> products ·{" "}
            <strong className="font-semibold text-ink">{priced}</strong> priced ·{" "}
            {products.filter((p) => p.isPublished).length} published
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setEditing(blankProduct())} className={buttonClass("primary")}>
            + New product
          </button>
          <button type="button" onClick={seed} disabled={seeding} className={buttonClass("outline")}>
            {seeding ? "Importing…" : "Import print catalogue"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-5">
          <Notice tone="error">{error}</Notice>
        </div>
      )}
      {message && (
        <div className="mt-5">
          <Notice>{message}</Notice>
        </div>
      )}

      <div className="mt-6">
        <label htmlFor="admin-search" className="sr-only">
          Search products
        </label>
        <input
          id="admin-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by code, name or material"
          className={`${field} max-w-sm`}
        />
      </div>

      {loading ? (
        <Spinner label="Loading products" />
      ) : filtered.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title={products.length ? "No products match that." : "No products yet"}
            body={
              products.length
                ? "Try a shorter search."
                : "Import the print catalogue to get all the codes in one go, then set prices on the ones you sell online."
            }
          >
            {!products.length && (
              <button type="button" onClick={seed} disabled={seeding} className={buttonClass("primary")}>
                Import print catalogue
              </button>
            )}
          </EmptyState>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-3xl border border-ink/10">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="bg-paper-dim text-xs uppercase tracking-wide text-ink-soft">
                <th scope="col" className="px-4 py-3 font-semibold">Code</th>
                <th scope="col" className="px-4 py-3 font-semibold">Product</th>
                <th scope="col" className="px-4 py-3 font-semibold">Price</th>
                <th scope="col" className="px-4 py-3 font-semibold">Discount</th>
                <th scope="col" className="px-4 py-3 font-semibold">Stock</th>
                <th scope="col" className="px-4 py-3 font-semibold">Live</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/8 bg-white/40">
              {filtered.map((p) => (
                <tr key={p.id}>
                  <th scope="row" className="whitespace-nowrap px-4 py-3 text-left font-mono text-[13px] font-semibold text-brand-dark">
                    {p.code}
                  </th>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-3">
                      {p.images[0] ? (
                        <img
                          src={p.images[0]}
                          alt=""
                          className="h-9 w-9 shrink-0 rounded-lg bg-studio object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-studio text-[9px] text-ink-soft/60">
                          no img
                        </span>
                      )}
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-ink">{p.name}</span>
                        <span className="block truncate text-xs text-ink-soft">
                          {[p.size, p.material].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {p.price === null ? (
                      <span className="text-ink-soft">On request</span>
                    ) : (
                      <span className="font-medium text-ink">
                        {formatMoney(p.price, p.currency)}
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {p.discountPercent > 0 ? (
                      <Badge tone="brand">{Math.round(p.discountPercent)}%</Badge>
                    ) : (
                      <span className="text-ink-soft/60">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-ink-soft">
                    {STOCK_OPTIONS.find((s) => s.value === p.stockStatus)?.label ?? p.stockStatus}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <button
                      type="button"
                      onClick={() => togglePublished(p)}
                      aria-pressed={p.isPublished}
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                        p.isPublished
                          ? "border-emerald-600/30 bg-emerald-600/10 text-emerald-800"
                          : "border-ink/15 text-ink-soft"
                      }`}
                    >
                      {p.isPublished ? "Live" : "Hidden"}
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setEditing(p)}
                      className="rounded-full border border-ink/15 px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-brand hover:text-brand"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(p)}
                      className="ml-2 rounded-full px-2 py-1.5 text-xs font-semibold text-ink-soft transition hover:text-brand"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- orders tab

type OrderRow = {
  id: string;
  reference: string;
  customer_name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  notes: string | null;
  kind: string;
  status: string;
  total: number | string;
  currency: string;
  created_at: string;
  order_items: {
    product_code: string;
    product_name: string;
    quantity: number;
    line_total: number | string;
  }[];
};

const STATUS_TONE: Record<string, "good" | "brand" | "warn" | "neutral"> = {
  paid: "good",
  pending: "warn",
  quoted: "brand",
  failed: "neutral",
  cancelled: "neutral",
};

function OrdersTab() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const { data, error: err } = await supabase
      .from("orders")
      .select("*, order_items(product_code, product_name, quantity, line_total)")
      .order("created_at", { ascending: false })
      .limit(200);
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setError(null);
    setOrders((data ?? []) as OrderRow[]);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const setStatus = async (order: OrderRow, status: string) => {
    if (!supabase) return;
    setOrders((list) => list.map((o) => (o.id === order.id ? { ...o, status } : o)));
    const { error: err } = await supabase.from("orders").update({ status }).eq("id", order.id);
    if (err) {
      setError(err.message);
      await load();
    }
  };

  if (loading) return <Spinner label="Loading orders" />;
  if (error) return <Notice tone="error">{error}</Notice>;
  if (!orders.length) {
    return (
      <EmptyState
        title="No orders yet"
        body="Enquiries and paid orders placed through the shop will appear here, newest first."
      />
    );
  }

  const revenue = orders
    .filter((o) => o.status === "paid")
    .reduce((sum, o) => sum + Number(o.total), 0);

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Orders", value: String(orders.length) },
          { label: "Paid", value: String(orders.filter((o) => o.status === "paid").length) },
          { label: "Paid revenue", value: formatMoney(revenue, orders[0]?.currency ?? "INR") },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-ink/10 bg-white/60 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft/70">
              {s.label}
            </p>
            <p className="font-display mt-1 text-2xl font-semibold text-ink">{s.value}</p>
          </div>
        ))}
      </div>

      <ul className="mt-6 flex flex-col gap-3">
        {orders.map((o) => {
          const expanded = open === o.id;
          return (
            <li key={o.id} className="overflow-hidden rounded-2xl border border-ink/10 bg-white/60">
              <button
                type="button"
                onClick={() => setOpen(expanded ? null : o.id)}
                aria-expanded={expanded}
                className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-4 text-left"
              >
                <span className="flex min-w-0 flex-col">
                  <span className="font-mono text-xs font-semibold text-brand-dark">
                    {o.reference}
                  </span>
                  <span className="truncate text-sm font-medium text-ink">
                    {o.customer_name}
                    {o.company ? ` · ${o.company}` : ""}
                  </span>
                  <span className="text-xs text-ink-soft">
                    {new Date(o.created_at).toLocaleString("en-IN")} ·{" "}
                    {o.order_items?.length ?? 0} lines
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <Badge tone={STATUS_TONE[o.status] ?? "neutral"}>{o.status}</Badge>
                  <span className="font-display text-lg font-semibold text-ink">
                    {formatMoney(Number(o.total), o.currency)}
                  </span>
                </span>
              </button>

              {expanded && (
                <div className="border-t border-ink/10 px-5 py-5">
                  <dl className="grid gap-3 text-sm sm:grid-cols-2">
                    {o.email && (
                      <div>
                        <dt className={label}>Email</dt>
                        <dd>
                          <a href={`mailto:${o.email}`} className="text-brand hover:underline">
                            {o.email}
                          </a>
                        </dd>
                      </div>
                    )}
                    {o.phone && (
                      <div>
                        <dt className={label}>Phone</dt>
                        <dd>
                          <a href={`tel:${o.phone}`} className="text-brand hover:underline">
                            {o.phone}
                          </a>
                        </dd>
                      </div>
                    )}
                    {o.city && (
                      <div>
                        <dt className={label}>Delivery city</dt>
                        <dd className="text-ink">{o.city}</dd>
                      </div>
                    )}
                    <div>
                      <dt className={label}>Type</dt>
                      <dd className="text-ink">{o.kind === "payment" ? "Online payment" : "Enquiry"}</dd>
                    </div>
                  </dl>

                  {o.notes && (
                    <p className="mt-4 whitespace-pre-line rounded-xl bg-paper-dim/60 p-3 text-sm text-ink-soft">
                      {o.notes}
                    </p>
                  )}

                  <table className="mt-5 w-full text-left text-sm">
                    <thead>
                      <tr className="text-xs uppercase tracking-wide text-ink-soft">
                        <th scope="col" className="py-2 font-semibold">Code</th>
                        <th scope="col" className="py-2 font-semibold">Product</th>
                        <th scope="col" className="py-2 font-semibold">Cases</th>
                        <th scope="col" className="py-2 text-right font-semibold">Line total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink/8">
                      {o.order_items?.map((item) => (
                        <tr key={item.product_code}>
                          <td className="py-2 font-mono text-xs font-semibold text-brand-dark">
                            {item.product_code}
                          </td>
                          <td className="py-2 text-ink">{item.product_name}</td>
                          <td className="py-2 text-ink-soft">{item.quantity}</td>
                          <td className="py-2 text-right font-medium text-ink">
                            {Number(item.line_total) > 0
                              ? formatMoney(Number(item.line_total), o.currency)
                              : "On request"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <span className={label}>Mark as</span>
                    {["quoted", "pending", "paid", "cancelled"].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStatus(o, s)}
                        disabled={o.status === s}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                          o.status === s
                            ? "border-brand bg-brand text-white"
                            : "border-ink/15 text-ink-soft hover:border-brand hover:text-brand"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ------------------------------------------------------------- enquiries tab

type EnquiryRow = {
  id: string;
  reference: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  contact_raw: string | null;
  interest: string | null;
  message: string | null;
  product_codes: string[] | null;
  channel: string;
  status: string;
  created_at: string;
};

const ENQUIRY_STATUS_TONE: Record<string, "good" | "brand" | "warn" | "neutral"> = {
  new: "brand",
  replied: "good",
  closed: "neutral",
};

// Everything the form sends now arrives here as "website". The older values
// are kept so enquiries taken before the form posted straight to this
// dashboard still read correctly.
const CHANNEL_LABEL: Record<string, string> = {
  website: "Website form",
  email: "Email",
  whatsapp: "WhatsApp",
  copy: "Copied",
};

function EnquiriesTab() {
  const [enquiries, setEnquiries] = useState<EnquiryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [onlyNew, setOnlyNew] = useState(false);

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const { data, error: err } = await supabase
      .from("enquiries")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    setLoading(false);
    if (err) {
      setError(describeWriteError(err));
      return;
    }
    setError(null);
    setEnquiries((data ?? []) as EnquiryRow[]);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const setStatus = async (row: EnquiryRow, status: string) => {
    if (!supabase) return;
    setEnquiries((list) => list.map((e) => (e.id === row.id ? { ...e, status } : e)));
    const { error: err } = await supabase
      .from("enquiries")
      .update({ status })
      .eq("id", row.id);
    if (err) {
      setError(describeWriteError(err));
      await load();
    }
  };

  if (loading) return <Spinner label="Loading enquiries" />;
  if (error) return <Notice tone="error">{error}</Notice>;

  if (!enquiries.length) {
    return (
      <EmptyState
        title="No enquiries yet"
        body="Messages sent from the contact form land here, newest first — with the product codes the sender had collected."
      />
    );
  }

  const newCount = enquiries.filter((e) => e.status === "new").length;
  const shown = onlyNew ? enquiries.filter((e) => e.status === "new") : enquiries;

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Enquiries", value: String(enquiries.length) },
          { label: "Unanswered", value: String(newCount) },
          {
            label: "With products attached",
            value: String(enquiries.filter((e) => (e.product_codes?.length ?? 0) > 0).length),
          },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-ink/10 bg-white/60 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft/70">
              {s.label}
            </p>
            <p className="font-display mt-1 text-2xl font-semibold text-ink">{s.value}</p>
          </div>
        ))}
      </div>

      {newCount > 0 && (
        <div className="mt-6">
          <button
            type="button"
            aria-pressed={onlyNew}
            onClick={() => setOnlyNew((v) => !v)}
            className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
              onlyNew
                ? "border-brand bg-brand text-white"
                : "border-ink/15 text-ink-soft hover:border-brand hover:text-brand"
            }`}
          >
            {onlyNew ? "Showing unanswered only" : `Show only the ${newCount} unanswered`}
          </button>
        </div>
      )}

      <ul className="mt-6 flex flex-col gap-3">
        {shown.map((e) => {
          const expanded = open === e.id;
          return (
            <li key={e.id} className="overflow-hidden rounded-2xl border border-ink/10 bg-white/60">
              <button
                type="button"
                onClick={() => setOpen(expanded ? null : e.id)}
                aria-expanded={expanded}
                className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-4 text-left"
              >
                <span className="flex min-w-0 flex-col">
                  <span className="font-mono text-xs font-semibold text-brand-dark">
                    {e.reference}
                  </span>
                  <span className="truncate text-sm font-medium text-ink">
                    {e.name}
                    {e.company ? ` \u00b7 ${e.company}` : ""}
                  </span>
                  <span className="truncate text-xs text-ink-soft">
                    {new Date(e.created_at).toLocaleString("en-IN")}
                    {e.interest ? ` \u00b7 ${e.interest}` : ""}
                    {(e.product_codes?.length ?? 0) > 0
                      ? ` \u00b7 ${e.product_codes?.length} product${
                          e.product_codes?.length === 1 ? "" : "s"
                        }`
                      : ""}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <Badge>{CHANNEL_LABEL[e.channel] ?? e.channel}</Badge>
                  <Badge tone={ENQUIRY_STATUS_TONE[e.status] ?? "neutral"}>{e.status}</Badge>
                </span>
              </button>

              {expanded && (
                <div className="border-t border-ink/10 px-5 py-5">
                  <dl className="grid gap-3 text-sm sm:grid-cols-2">
                    {e.email && (
                      <div>
                        <dt className={label}>Email</dt>
                        <dd>
                          <a href={`mailto:${e.email}`} className="text-brand hover:underline">
                            {e.email}
                          </a>
                        </dd>
                      </div>
                    )}
                    {e.phone && (
                      <div>
                        <dt className={label}>Phone</dt>
                        <dd className="flex flex-wrap gap-3">
                          <a href={`tel:${e.phone}`} className="text-brand hover:underline">
                            {e.phone}
                          </a>
                          <a
                            href={`https://wa.me/${e.phone.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-ink-soft hover:text-brand hover:underline"
                          >
                            WhatsApp
                          </a>
                        </dd>
                      </div>
                    )}
                    {/* Shown when the entry could not be parsed as either, so
                        a malformed contact is still actionable by hand. */}
                    {!e.email && !e.phone && e.contact_raw && (
                      <div>
                        <dt className={label}>Contact given</dt>
                        <dd className="text-ink">{e.contact_raw}</dd>
                      </div>
                    )}
                    {e.interest && (
                      <div>
                        <dt className={label}>Interested in</dt>
                        <dd className="text-ink">{e.interest}</dd>
                      </div>
                    )}
                  </dl>

                  {e.message ? (
                    <p className="mt-4 whitespace-pre-line rounded-xl bg-paper-dim/60 p-4 text-sm leading-relaxed text-ink">
                      {e.message}
                    </p>
                  ) : (
                    <p className="mt-4 text-sm italic text-ink-soft/70">
                      No message — they only picked a range.
                    </p>
                  )}

                  {(e.product_codes?.length ?? 0) > 0 && (
                    <div className="mt-4">
                      <p className={label}>Products they had collected</p>
                      <ul className="mt-2 flex flex-wrap gap-1.5">
                        {e.product_codes?.map((code) => (
                          <li key={code}>
                            <Link
                              to={`/shop/${encodeURIComponent(code)}`}
                              className="inline-block rounded-full border border-ink/12 bg-white px-2.5 py-1 font-mono text-[11px] font-semibold text-brand-dark transition hover:border-brand"
                            >
                              {code}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <span className={label}>Mark as</span>
                    {["new", "replied", "closed"].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStatus(e, s)}
                        disabled={e.status === s}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                          e.status === s
                            ? "border-brand bg-brand text-white"
                            : "border-ink/15 text-ink-soft hover:border-brand hover:text-brand"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                    {e.email && (
                      <a
                        href={`mailto:${e.email}?subject=${encodeURIComponent(
                          `Re: your Ruskav enquiry ${e.reference}`
                        )}`}
                        className={buttonClass("outline", "!px-4 !py-1.5 !text-xs")}
                      >
                        Reply by email
                      </a>
                    )}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// --------------------------------------------------------------- customers

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  provider: string | null;
  created_at: string;
  last_sign_in_at: string | null;
};

type CustomerOrderRow = {
  user_id: string | null;
  email: string | null;
  total: number | string | null;
  status: string;
};

const PROVIDER_LABEL: Record<string, string> = {
  google: "Google",
  email: "Password",
};

const formatDay = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "—";

/**
 * Everyone who has signed in.
 *
 * `auth.users` is not readable with the anon key, by design — `public.profiles`
 * is a mirror kept in step by a trigger, which is what makes this list possible
 * at all. Orders are matched by account first and by email second, so an order
 * placed as a guest before signing up still counts towards the person who
 * placed it.
 */
function CustomersTab() {
  const [people, setPeople] = useState<ProfileRow[]>([]);
  const [adminIds, setAdminIds] = useState<Set<string>>(new Set());
  const [orders, setOrders] = useState<CustomerOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    let cancelled = false;

    void (async () => {
      const [profiles, admins, orderRows] = await Promise.all([
        client
          .from("profiles")
          .select("id, email, full_name, avatar_url, provider, created_at, last_sign_in_at")
          .order("created_at", { ascending: false })
          .limit(500),
        client.from("admins").select("user_id"),
        client.from("orders").select("user_id, email, total, status").limit(2000),
      ]);
      if (cancelled) return;

      setLoading(false);
      if (profiles.error) {
        setError(describeWriteError(profiles.error));
        return;
      }
      setError(null);
      setPeople((profiles.data ?? []) as ProfileRow[]);
      setAdminIds(new Set(((admins.data ?? []) as { user_id: string }[]).map((a) => a.user_id)));
      setOrders((orderRows.data ?? []) as CustomerOrderRow[]);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const activity = useMemo(() => {
    const byId = new Map<string, { count: number; value: number }>();
    for (const person of people) {
      const email = person.email?.toLowerCase();
      const theirs = orders.filter(
        (o) => o.user_id === person.id || (!!email && o.email?.toLowerCase() === email)
      );
      byId.set(person.id, {
        count: theirs.length,
        value: theirs
          .filter((o) => o.status === "paid")
          .reduce((sum, o) => sum + Number(o.total ?? 0), 0),
      });
    }
    return byId;
  }, [people, orders]);

  if (loading) return <Spinner label="Loading customers" />;
  if (error) return <Notice tone="error">{error}</Notice>;

  if (!people.length) {
    return (
      <EmptyState
        title="Nobody has signed in yet"
        body="Accounts appear here the moment someone signs in with Google. Ordering never required an account, so this list will always be shorter than your order list."
      />
    );
  }

  const terms = query.trim().toLowerCase();
  const shown = terms
    ? people.filter((p) => `${p.full_name ?? ""} ${p.email ?? ""}`.toLowerCase().includes(terms))
    : people;

  const withOrders = people.filter((p) => (activity.get(p.id)?.count ?? 0) > 0).length;

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Accounts", value: String(people.length) },
          {
            label: "Signed in with Google",
            value: String(people.filter((p) => p.provider === "google").length),
          },
          { label: "Have ordered", value: String(withOrders) },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-ink/10 bg-white/60 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft/70">
              {s.label}
            </p>
            <p className="font-display mt-1 text-2xl font-semibold text-ink">{s.value}</p>
          </div>
        ))}
      </div>

      <label className="mt-6 block">
        <span className="sr-only">Search customers by name or email</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or email"
          className={field}
        />
      </label>

      <ul className="mt-4 flex flex-col gap-3">
        {shown.map((person) => {
          const stats = activity.get(person.id);
          const name = person.full_name?.trim() || person.email || "Unnamed account";
          return (
            <li
              key={person.id}
              className="flex flex-wrap items-center gap-4 rounded-2xl border border-ink/10 bg-white/60 px-5 py-4"
            >
              {person.avatar_url ? (
                <img
                  src={person.avatar_url}
                  alt=""
                  width={44}
                  height={44}
                  referrerPolicy="no-referrer"
                  className="h-11 w-11 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand/10 text-sm font-semibold text-brand-dark">
                  {name.slice(0, 1).toUpperCase()}
                </span>
              )}

              <div className="min-w-[12rem] flex-1">
                <p className="flex flex-wrap items-center gap-2 font-medium text-ink">
                  {name}
                  {adminIds.has(person.id) && <Badge tone="brand">Admin</Badge>}
                </p>
                {person.email && (
                  <a
                    href={`mailto:${person.email}`}
                    className="text-sm text-ink-soft transition hover:text-brand"
                  >
                    {person.email}
                  </a>
                )}
              </div>

              <dl className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs">
                <div>
                  <dt className={label}>Signed up</dt>
                  <dd className="text-ink">{formatDay(person.created_at)}</dd>
                </div>
                <div>
                  <dt className={label}>Last seen</dt>
                  <dd className="text-ink">{formatDay(person.last_sign_in_at)}</dd>
                </div>
                <div>
                  <dt className={label}>Orders</dt>
                  <dd className="text-ink">
                    {stats?.count ?? 0}
                    {stats && stats.value > 0 ? ` · ${formatMoney(stats.value)} paid` : ""}
                  </dd>
                </div>
              </dl>

              <Badge>{PROVIDER_LABEL[person.provider ?? ""] ?? person.provider ?? "Unknown"}</Badge>
            </li>
          );
        })}
      </ul>

      {!shown.length && (
        <p className="mt-6 text-center text-sm text-ink-soft">Nobody matches that search.</p>
      )}
    </div>
  );
}

// -------------------------------------------------------------------- page

const TABS = [
  { key: "products", label: "Products & pricing" },
  { key: "orders", label: "Orders" },
  { key: "enquiries", label: "Enquiries" },
  { key: "customers", label: "Customers" },
] as const;

export function AdminPage() {
  const { session, isAdmin, loading } = useAuth();
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("products");

  if (!isSupabaseConfigured) {
    return (
      <>
        <PageHeader kicker="Admin" title="The dashboard isn't connected yet." tone="dim" />
        <Section className="bg-paper pt-10 md:pt-14">
          <Notice tone="warn">
            Add <code className="font-mono text-xs">VITE_SUPABASE_URL</code> and{" "}
            <code className="font-mono text-xs">VITE_SUPABASE_ANON_KEY</code> to{" "}
            <code className="font-mono text-xs">.env.local</code>, run{" "}
            <code className="font-mono text-xs">supabase/schema.sql</code>, then restart the dev
            server. Full steps are in <code className="font-mono text-xs">README.md</code>.
          </Notice>
        </Section>
      </>
    );
  }

  if (loading) return <Spinner label="Checking your access" />;

  if (!session || !isAdmin) {
    return (
      <>
        <PageHeader
          kicker="Admin"
          title={session ? "This account isn't an admin." : "Please sign in."}
          intro={
            session
              ? "You're signed in, but your user id isn't in the admins table — so the database will refuse any changes."
              : "The dashboard is for staff managing products, prices and orders."
          }
          tone="dim"
        />
        <Section className="bg-paper pt-10 md:pt-14">
          <div className="flex flex-wrap gap-3">
            <Link to="/login" className={buttonClass("primary")}>
              Go to login
            </Link>
            {session && (
              <button type="button" onClick={() => void signOut()} className={buttonClass("outline")}>
                Sign out
              </button>
            )}
          </div>
        </Section>
      </>
    );
  }

  return (
    <>
      <PageHeader
        kicker="Admin dashboard"
        title="Products, prices, orders and enquiries."
        intro="Changes here are live for customers as soon as you save."
        tone="dim"
      >
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm text-ink-soft">Signed in as {session.user.email}</span>
          <button type="button" onClick={() => void signOut()} className={buttonClass("outline", "!py-2")}>
            Sign out
          </button>
        </div>
      </PageHeader>

      <Section className="bg-paper pt-10 md:pt-14">
        <div role="tablist" aria-label="Dashboard sections" className="mb-8 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                tab === t.key
                  ? "border-ink bg-ink text-paper"
                  : "border-ink/15 text-ink-soft hover:border-ink/35 hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "products" && <ProductsTab />}
        {tab === "orders" && <OrdersTab />}
        {tab === "enquiries" && <EnquiriesTab />}
        {tab === "customers" && <CustomersTab />}
      </Section>
    </>
  );
}
