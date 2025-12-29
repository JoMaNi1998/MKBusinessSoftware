import { useEffect, RefObject } from 'react';

/**
 * Hook für Click-Outside Detection
 *
 * Ruft den Handler auf, wenn außerhalb des referenzierten Elements geklickt wird.
 *
 * @param ref - RefObject des Elements
 * @param handler - Callback-Funktion bei Click-Outside
 * @param enabled - Optional: Hook aktivieren/deaktivieren (default: true)
 *
 * @example
 * ```tsx
 * const dropdownRef = useRef<HTMLDivElement>(null);
 * const [isOpen, setIsOpen] = useState(false);
 *
 * useClickOutside(dropdownRef, () => setIsOpen(false), isOpen);
 *
 * return (
 *   <div ref={dropdownRef}>
 *     {isOpen && <Dropdown />}
 *   </div>
 * );
 * ```
 */
export const useClickOutside = <T extends HTMLElement = HTMLElement>(
  ref: RefObject<T>,
  handler: () => void,
  enabled: boolean = true
): void => {
  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event: MouseEvent): void => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handler();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [ref, handler, enabled]);
};

export default useClickOutside;
