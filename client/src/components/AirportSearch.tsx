import { useState, useRef, useEffect, useCallback } from "react";
import { MapPin, X } from "lucide-react";
import { searchAirports, distanceNm, type Airport } from "@/lib/airportData";

interface AirportSearchProps {
  value: Airport | null;
  onChange: (airport: Airport | null) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

export function AirportSearch({ value, onChange, placeholder = "Search ICAO, city or name…", label, className }: AirportSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Airport[]>([]);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // When a value is selected externally, clear the query
  useEffect(() => {
    if (value) setQuery("");
  }, [value]);

  const search = useCallback((q: string) => {
    setQuery(q);
    if (q.length === 0) {
      setResults([]);
      setOpen(false);
      return;
    }
    const hits = searchAirports(q, 12);
    setResults(hits);
    setOpen(hits.length > 0);
    setHighlighted(0);
  }, []);

  function select(ap: Airport) {
    onChange(ap);
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  function clear() {
    onChange(null);
    setQuery("");
    setResults([]);
    setOpen(false);
    inputRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted(h => Math.min(h + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted(h => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[highlighted]) select(results[highlighted]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Scroll highlighted item into view
  useEffect(() => {
    if (listRef.current) {
      const el = listRef.current.children[highlighted] as HTMLElement;
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [highlighted]);

  const typeLabel: Record<string, string> = {
    large: "Intl",
    medium: "Regional",
    small: "General",
    heliport: "Heli",
    seaplane: "Seaplane",
  };

  const typeColor: Record<string, string> = {
    large: "text-teal-400",
    medium: "text-blue-400",
    small: "text-slate-400",
    heliport: "text-purple-400",
    seaplane: "text-cyan-400",
  };

  return (
    <div ref={containerRef} className={`relative ${className ?? ""}`}>
      {label && <label className="text-[10px] text-muted-foreground block mb-0.5">{label}</label>}

      {/* Selected value pill */}
      {value ? (
        <div className="flex items-center gap-1.5 w-full text-xs bg-background border border-[#01696F]/60 rounded px-2 py-1.5 min-h-[30px]">
          <MapPin size={11} className="text-[#01696F] shrink-0" />
          <span className="font-mono font-semibold text-[#4F98A3]">{value.icao}</span>
          <span className="text-foreground truncate flex-1">{value.city || value.name}</span>
          <button
            type="button"
            onClick={clear}
            className="text-muted-foreground hover:text-foreground shrink-0 ml-auto"
          >
            <X size={11} />
          </button>
        </div>
      ) : (
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => search(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => query && setOpen(results.length > 0)}
          placeholder={placeholder}
          className="w-full text-xs bg-background border border-card-border rounded px-2 py-1.5 focus:outline-none focus:border-[#01696F]/60 transition-colors placeholder:text-muted-foreground/50"
          autoComplete="off"
          spellCheck={false}
        />
      )}

      {/* Dropdown */}
      {open && results.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 top-full left-0 right-0 mt-0.5 bg-[#1C1B19] border border-[#393836] rounded-md shadow-xl max-h-52 overflow-y-auto py-0.5"
        >
          {results.map((ap, i) => (
            <li key={ap.icao}>
              <button
                type="button"
                onMouseDown={e => { e.preventDefault(); select(ap); }}
                onMouseEnter={() => setHighlighted(i)}
                className={`w-full text-left px-2.5 py-1.5 flex items-center gap-2 text-xs transition-colors ${
                  i === highlighted ? "bg-[#393836]" : "hover:bg-[#393836]/50"
                }`}
              >
                {/* ICAO badge */}
                <span className="font-mono font-bold text-[11px] text-[#4F98A3] w-10 shrink-0">{ap.icao}</span>

                {/* Name + city */}
                <span className="flex-1 min-w-0">
                  <span className="text-foreground font-medium truncate block">
                    {ap.city && ap.city !== ap.name ? ap.city : ap.name}
                  </span>
                  {ap.city && ap.city !== ap.name && (
                    <span className="text-muted-foreground text-[10px] truncate block">{ap.name}</span>
                  )}
                </span>

                {/* State + type */}
                <span className="flex flex-col items-end shrink-0 gap-0.5">
                  {ap.state && <span className="text-[10px] text-muted-foreground">{ap.state}</span>}
                  <span className={`text-[9px] font-medium ${typeColor[ap.type] ?? "text-slate-400"}`}>
                    {typeLabel[ap.type] ?? ap.type}
                  </span>
                </span>

                {/* IATA if available */}
                {ap.iata && (
                  <span className="text-[10px] text-muted-foreground/60 font-mono shrink-0">{ap.iata}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Pair of From/To airport selectors with auto-distance calculation */
interface AirportLegPickerProps {
  fromAirport: Airport | null;
  toAirport: Airport | null;
  onFromChange: (ap: Airport | null) => void;
  onToChange: (ap: Airport | null) => void;
  onDistanceCalculated: (nm: number) => void;
}

export function AirportLegPicker({
  fromAirport, toAirport, onFromChange, onToChange, onDistanceCalculated
}: AirportLegPickerProps) {

  // Auto-calculate distance when both endpoints are set
  useEffect(() => {
    if (
      fromAirport?.lat != null && fromAirport?.lon != null &&
      toAirport?.lat != null && toAirport?.lon != null
    ) {
      const nm = distanceNm(fromAirport.lat, fromAirport.lon, toAirport.lat, toAirport.lon);
      if (nm > 0) onDistanceCalculated(nm);
    }
  }, [fromAirport, toAirport]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="grid grid-cols-2 gap-2">
      <AirportSearch
        label="From"
        value={fromAirport}
        onChange={onFromChange}
        placeholder="ICAO, city or name…"
      />
      <AirportSearch
        label="To"
        value={toAirport}
        onChange={onToChange}
        placeholder="ICAO, city or name…"
      />
    </div>
  );
}
