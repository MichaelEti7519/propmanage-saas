import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDown01Icon, Tick02Icon } from '@hugeicons/core-free-icons';
import './GlideSelect.css';

export interface GlideSelectOption {
  value: string;
  label: string;
  tag?: string;
}

interface GlideSelectProps {
  options: GlideSelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string, option: GlideSelectOption) => void;
  ariaLabel: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function GlideSelect({
  options,
  value,
  defaultValue,
  onChange,
  ariaLabel,
  placeholder = 'Choose a document type',
  disabled = false,
  className = '',
}: GlideSelectProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue ?? '');
  const selectedValue = value ?? uncontrolledValue;
  const selectedIndex = options.findIndex((option) => option.value === selectedValue);
  const pillIndex = activeIndex ?? Math.max(0, selectedIndex);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
        setActiveIndex(null);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => document.removeEventListener('pointerdown', handlePointerDown, true);
  }, [open]);

  useEffect(() => {
    if (disabled) {
      setOpen(false);
      setActiveIndex(null);
    }
  }, [disabled]);

  const choose = (index: number) => {
    const option = options[index];
    if (!option) return;
    if (value === undefined) setUncontrolledValue(option.value);
    if (option.value !== selectedValue) onChange?.(option.value, option);
    setOpen(false);
    setActiveIndex(null);
    buttonRef.current?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    const currentIndex = activeIndex ?? Math.max(0, selectedIndex);
    if (!open && ['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(event.key)) {
      event.preventDefault();
      setOpen(true);
      setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
      return;
    }
    if (!open) return;

    if (event.key === 'Escape' || event.key === 'Tab') {
      if (event.key === 'Escape') event.preventDefault();
      setOpen(false);
      setActiveIndex(null);
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex((currentIndex + direction + options.length) % options.length);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      setActiveIndex(event.key === 'Home' ? 0 : options.length - 1);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      choose(currentIndex);
    }
  };

  return (
    <div ref={rootRef} className={`glide-select ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-activedescendant={open && activeIndex !== null ? `${id}-option-${activeIndex}` : undefined}
        disabled={disabled}
        className="glide-select__trigger"
        onClick={() => {
          setOpen((isOpen) => {
            if (!isOpen) setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
            else setActiveIndex(null);
            return !isOpen;
          });
        }}
        onKeyDown={handleKeyDown}
      >
        <span className={!selectedValue ? 'glide-select__placeholder' : ''}>
          {options[selectedIndex]?.label ?? placeholder}
        </span>
        <HugeiconsIcon icon={ArrowDown01Icon} size={16} strokeWidth={2} className={`glide-select__arrow${open ? ' is-open' : ''}`} />
      </button>

      {open && (
        <div className="glide-select__menu" id={`${id}-list`} role="listbox" aria-label={ariaLabel}>
          <span
            aria-hidden="true"
            className="glide-select__pill"
            style={{ transform: `translateY(${pillIndex * 36}px)` }}
          />
          {options.map((option, index) => (
            <button
              key={option.value}
              id={`${id}-option-${index}`}
              type="button"
              role="option"
              aria-selected={selectedValue === option.value}
              className="glide-select__option"
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => choose(index)}
            >
              <span>{option.label}</span>
              {option.tag && <span className="glide-select__tag">{option.tag}</span>}
              {selectedValue === option.value && <HugeiconsIcon icon={Tick02Icon} size={16} strokeWidth={2.5} className="glide-select__check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}