"use client";

import { FormEvent, useState } from "react";

const PROPERTY_TYPES = [
  "Apartment",
  "House",
  "Land",
  "Commercial",
] as const;

const CONDITIONS = [
  "New Build",
  "After Renovation",
  "Needs Renovation",
  "Raw Land",
  "Ready to Build",
] as const;

const FEATURES = [
  "Sea View",
  "Parking",
  "Pool",
  "Terrace",
  "Elevator",
  "Mountain View",
  "Garden",
  "Garage",
] as const;

const INFRASTRUCTURE = [
  "🚇 Metro",
  "🎓 University",
  "🏫 School",
  "👶 Kindergarten",
  "🚌 Bus Station",
  "🏥 Hospital",
  "🛒 Shopping Center / Mall",
  "🌳 Park",
  "🏖️ Beach",
  "🏞️ Close to River",
  "🏞️ Close to Lake",
  "✈️ Airport",
] as const;

const CURRENCIES = ["USD", "EUR", "GEL"] as const;
const LANGUAGES = [
  "English",
  "Georgian",
  "Turkish",
  "Russian",
  "Kyrgyz",
  "Kazakh",
  "German",
  "Spanish",
  "French",
  "Italian",
  "Portuguese",
  "Arabic",
] as const;
const TONES = ["Professional", "Friendly", "Luxury"] as const;

type PropertyType = (typeof PROPERTY_TYPES)[number];

type GenerateResult = {
  description: string;
  translation: string;
  social_post: string;
};

function ResultCard({
  title,
  content,
  rtl = false,
}: {
  title: string;
  content: string;
  rtl?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 text-gray-900 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-gray-800 transition hover:bg-slate-50"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <p
        dir={rtl ? "rtl" : undefined}
        className={`whitespace-pre-wrap text-sm leading-relaxed text-gray-800${rtl ? " text-right" : ""}`}
      >
        {content}
      </p>
    </div>
  );
}

export default function Home() {
  const [propertyType, setPropertyType] = useState<PropertyType>("Apartment");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [rooms, setRooms] = useState("");
  const [floor, setFloor] = useState("");
  const [totalFloors, setTotalFloors] = useState("");
  const [condition, setCondition] = useState<string>(CONDITIONS[0]);
  const [features, setFeatures] = useState<string[]>([]);
  const [infrastructure, setInfrastructure] = useState<string[]>([]);
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState<string>(CURRENCIES[0]);
  const [targetLanguage, setTargetLanguage] = useState<string>(LANGUAGES[0]);
  const [tone, setTone] = useState<string>(TONES[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResult | null>(null);

  const showRooms = propertyType !== "Land";
  const showFloors =
    propertyType !== "Land" && propertyType !== "House";

  function toggleFeature(feature: string) {
    setFeatures((prev) =>
      prev.includes(feature)
        ? prev.filter((f) => f !== feature)
        : [...prev, feature],
    );
  }

  function toggleInfrastructure(item: string) {
    setInfrastructure((prev) =>
      prev.includes(item)
        ? prev.filter((i) => i !== item)
        : [...prev, item],
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyType,
          city,
          area: Number(area),
          ...(showRooms && rooms ? { rooms: Number(rooms) } : {}),
          ...(showFloors && floor && totalFloors
            ? { floor: Number(floor), totalFloors: Number(totalFloors) }
            : {}),
          condition,
          features,
          infrastructure,
          price: Number(price),
          currency,
          targetLanguage,
          tone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Generation failed");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100";
  const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            AI Property Description Generator
          </h1>
          <p className="mt-2 text-slate-500">
            Fill in the property details and generate professional marketing
            copy instantly.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
        >
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Property type</label>
              <select
                className={inputClass}
                value={propertyType}
                onChange={(e) =>
                  setPropertyType(e.target.value as PropertyType)
                }
              >
                {PROPERTY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>City</label>
              <input
                type="text"
                required
                className={inputClass}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Tbilisi"
              />
            </div>

            <div>
              <label className={labelClass}>Area (m²)</label>
              <input
                type="number"
                required
                min={1}
                className={inputClass}
                value={area}
                onChange={(e) => setArea(e.target.value)}
              />
            </div>

            {showRooms && (
              <div>
                <label className={labelClass}>Rooms</label>
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  value={rooms}
                  onChange={(e) => setRooms(e.target.value)}
                />
              </div>
            )}

            {showFloors && (
              <>
                <div>
                  <label className={labelClass}>Floor</label>
                  <input
                    type="number"
                    min={0}
                    className={inputClass}
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>Total floors</label>
                  <input
                    type="number"
                    min={1}
                    className={inputClass}
                    value={totalFloors}
                    onChange={(e) => setTotalFloors(e.target.value)}
                  />
                </div>
              </>
            )}

            <div>
              <label className={labelClass}>Condition</label>
              <select
                className={inputClass}
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
              >
                {CONDITIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Price</label>
              <input
                type="number"
                required
                min={0}
                className={inputClass}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>Currency</label>
              <select
                className={inputClass}
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Target language for translation</label>
              <select
                className={inputClass}
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Tone</label>
              <select
                className={inputClass}
                value={tone}
                onChange={(e) => setTone(e.target.value)}
              >
                {TONES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <fieldset className="mt-6">
            <legend className={labelClass}>Features</legend>
            <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {FEATURES.map((feature) => (
                <label
                  key={feature}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={features.includes(feature)}
                    onChange={() => toggleFeature(feature)}
                    className="rounded border-slate-300"
                  />
                  {feature}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-6">
            <legend className={labelClass}>Nearby Infrastructure</legend>
            <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {INFRASTRUCTURE.map((item) => (
                <label
                  key={item}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={infrastructure.includes(item)}
                    onChange={() => toggleInfrastructure(item)}
                    className="rounded border-slate-300"
                  />
                  {item}
                </label>
              ))}
            </div>
          </fieldset>

          <button
            type="submit"
            disabled={loading}
            className="mt-8 w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Generating…" : "Generate Description"}
          </button>

          {error && (
            <p className="mt-4 text-center text-sm text-red-600">{error}</p>
          )}
        </form>

        {result && (
          <div className="mt-10 space-y-6">
            <ResultCard title="Property Description" content={result.description} />
            <ResultCard
              title="Translation"
              content={result.translation}
              rtl={targetLanguage === "Arabic"}
            />
            <ResultCard
              title="Social Media Post"
              content={result.social_post}
              rtl={targetLanguage === "Arabic"}
            />
          </div>
        )}
      </div>
    </div>
  );
}
