import React, { useEffect, useState, useRef } from 'react';

type Suggestion<T> = T & { id?: string };

type AutocompleteProps<T> = {
  value?: string;
  onSelect: (item: T | null) => void;
  onInputChange?: (value: string) => void;
  fetchSuggestions: (q: string) => Promise<T[]>;
  renderSuggestion?: (item: T) => React.ReactNode;
  placeholder?: string;
  className?: string;
};

function useDebouncedValue<T>(value: T, delay = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export default function Autocomplete<T extends { [key: string]: any }>({
  value = '',
  onSelect,
  onInputChange,
  fetchSuggestions,
  renderSuggestion,
  placeholder = '',
  className = ''
}: AutocompleteProps<T>) {
  const [input, setInput] = useState(value);
  const debounced = useDebouncedValue(input, 250);
  const [suggestions, setSuggestions] = useState<T[]>([]);
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setInput(value);
  }, [value]);

  useEffect(() => {
    let mounted = true;
    if (debounced && debounced.trim().length > 0) {
      fetchSuggestions(debounced).then(items => {
        if (mounted) {
          setSuggestions(items);
          setOpen(true);
          setHighlightedIndex(-1);
        }
      }).catch(() => {
        if (mounted) {
          setSuggestions([]);
        }
      });
    } else {
      setSuggestions([]);
      setOpen(false);
    }
    return () => { mounted = false; };
  }, [debounced, fetchSuggestions]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const handleSelect = (item: T) => {
    setInput(item.name || item.code || String(item));
    setOpen(false);
    onSelect(item);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0) {
        handleSelect(suggestions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <input
        type="text"
        value={input}
        placeholder={placeholder}
        onChange={(e) => {
          const nextValue = e.target.value;
          setInput(nextValue);
          onInputChange?.(nextValue);
          onSelect(null);
        }}
        onKeyDown={handleKeyDown}
        className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      />

      {open && suggestions.length > 0 && (
        <div className="absolute z-40 mt-1 w-full bg-white border border-gray-200 rounded shadow-lg max-h-52 overflow-y-auto">
          {suggestions.map((s: T, i: number) => (
            <button
              key={(s as any).code || (s as any).id || i}
              type="button"
              onClick={() => handleSelect(s)}
              onMouseEnter={() => setHighlightedIndex(i)}
              className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${i === highlightedIndex ? 'bg-gray-100' : ''}`}
            >
              {renderSuggestion ? renderSuggestion(s) : (
                <div className="flex justify-between items-center">
                  <div className="truncate">
                    <div className="font-medium text-sm">
                      {/* Simple highlight match logic */}
                      {(() => {
                        const text = (s as any).name || (s as any).code || '';
                        if (!input) return text;
                        const parts = text.split(new RegExp(`(${input})`, 'gi'));
                        return parts.map((part: string, idx: number) => 
                          part.toLowerCase() === input.toLowerCase() ? <span key={idx} className="bg-yellow-100 font-semibold">{part}</span> : part
                        );
                      })()}
                    </div>
                    <div className="text-xs text-gray-500">{(s as any).code}</div>
                  </div>
                  <div className="text-sm text-gray-700">₹{(s as any).cost}</div>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
