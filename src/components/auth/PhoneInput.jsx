import { useState, useRef, useEffect } from 'react';

const COUNTRY_CODES = [
  { code: '+1', country: 'US', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+91', country: 'IN', flag: '🇮🇳' },
  { code: '+61', country: 'AU', flag: '🇦🇺' },
  { code: '+49', country: 'DE', flag: '🇩🇪' },
  { code: '+33', country: 'FR', flag: '🇫🇷' },
  { code: '+81', country: 'JP', flag: '🇯🇵' },
];

export default function PhoneInput({ value, onChange, onSubmit, disabled, error }) {
  const [countryCode, setCountryCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Parse existing value
    if (value) {
      for (const cc of COUNTRY_CODES) {
        if (value.startsWith(cc.code)) {
          setCountryCode(cc.code);
          setPhoneNumber(value.slice(cc.code.length));
          break;
        }
      }
    }
  }, []);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePhoneChange = (e) => {
    const cleaned = e.target.value.replace(/\D/g, '');
    setPhoneNumber(cleaned);
    onChange(countryCode + cleaned);
  };

  const handleCountrySelect = (code) => {
    setCountryCode(code);
    setShowDropdown(false);
    onChange(code + phoneNumber);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && phoneNumber.length >= 10) {
      onSubmit?.();
    }
  };

  const selectedCountry = COUNTRY_CODES.find(c => c.code === countryCode);

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {/* Country code dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            disabled={disabled}
            className="flex items-center gap-1 px-3 py-3 bg-white/10 rounded-xl border border-white/20 text-white min-w-[80px] hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            <span>{selectedCountry?.flag}</span>
            <span className="text-sm">{countryCode}</span>
            <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-slate-800 rounded-xl border border-white/20 shadow-lg overflow-hidden z-50 min-w-[150px]">
              {COUNTRY_CODES.map((cc) => (
                <button
                  key={cc.code}
                  type="button"
                  onClick={() => handleCountrySelect(cc.code)}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/10 text-white text-left"
                >
                  <span>{cc.flag}</span>
                  <span className="text-sm">{cc.code}</span>
                  <span className="text-xs opacity-50">{cc.country}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Phone number input */}
        <input
          ref={inputRef}
          type="tel"
          value={phoneNumber}
          onChange={handlePhoneChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Phone number"
          className="flex-1 px-4 py-3 bg-white/10 rounded-xl border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-white/40 disabled:opacity-50"
          autoComplete="tel"
        />
      </div>

      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}
    </div>
  );
}
