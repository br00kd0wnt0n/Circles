import { useState, useRef, useEffect } from 'react';

export default function OTPInput({ length = 6, value, onChange, onComplete, disabled, error }) {
  const [digits, setDigits] = useState(Array(length).fill(''));
  const inputRefs = useRef([]);

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    // Sync external value
    if (value) {
      const newDigits = value.split('').slice(0, length);
      while (newDigits.length < length) newDigits.push('');
      setDigits(newDigits);
    }
  }, [value, length]);

  const handleChange = (index, e) => {
    const val = e.target.value;

    // Handle paste
    if (val.length > 1) {
      const pasted = val.replace(/\D/g, '').slice(0, length);
      const newDigits = [...pasted.split(''), ...Array(length - pasted.length).fill('')].slice(0, length);
      setDigits(newDigits);
      onChange(newDigits.join(''));

      if (pasted.length === length) {
        onComplete?.(newDigits.join(''));
      } else {
        inputRefs.current[pasted.length]?.focus();
      }
      return;
    }

    const digit = val.replace(/\D/g, '');
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);

    const code = newDigits.join('');
    onChange(code);

    // Move to next input
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if complete
    if (code.length === length) {
      onComplete?.(code);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      // Move to previous input on backspace
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleFocus = (e) => {
    e.target.select();
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-center gap-2">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={length}
            value={digit}
            onChange={(e) => handleChange(index, e)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onFocus={handleFocus}
            disabled={disabled}
            className={`w-12 h-14 text-center text-xl font-bold bg-white/10 rounded-xl border text-white focus:outline-none transition-all disabled:opacity-50
              ${error ? 'border-red-400' : 'border-white/20 focus:border-white/40'}`}
            autoComplete="one-time-code"
          />
        ))}
      </div>

      {error && (
        <p className="text-red-400 text-sm text-center">{error}</p>
      )}
    </div>
  );
}
