'use client';

type SearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
};

export function SearchField({
  value,
  onChange,
  placeholder = 'Search...',
  ariaLabel = 'Search',
}: SearchFieldProps) {
  return (
    <div className="search-field">
      <span className="search-field-icon" aria-hidden="true">⌕</span>
      <input
        aria-label={ariaLabel}
        className="input search-field-input"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type="search"
        value={value}
      />
    </div>
  );
}
