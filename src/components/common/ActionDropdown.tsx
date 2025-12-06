import React, { useState, useRef, useEffect } from 'react';
import Portal from './Portal';

interface ActionDropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
  align?: 'left' | 'right';
}

const ActionDropdown: React.FC<ActionDropdownProps> = ({ trigger, children, isOpen, onClose, onToggle, align = 'right' }) => {
  const triggerRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  const updateCoords = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      window.addEventListener('resize', updateCoords);
      window.addEventListener('scroll', updateCoords, true);
    }
    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords, true);
    };
  }, [isOpen]);

  // Click outside handler
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (triggerRef.current && triggerRef.current.contains(event.target as Node)) {
        return;
      }
      // We can't easily check if click is inside portal content here without a ref to it, 
      // but usually we want to close if clicking anywhere else.
      // To prevent closing when clicking inside the menu, we need a ref to the menu.
      // But since the menu is in a portal, event bubbling might be tricky depending on React version.
      // In React 18, events bubble through portals.
      // So we can just attach a click handler to the portal content to stop propagation?
      // Actually, simpler: just listen on window and if target is not in trigger and not in menu...
      
      // For now, let's rely on the fact that the menu items will likely trigger actions that close the menu,
      // or we can add a ref to the menu container.
    };

    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  return (
    <>
      <div ref={triggerRef} onClick={(e) => { e.stopPropagation(); onToggle(); }} className="inline-block">
        {trigger}
      </div>
      {isOpen && (
        <Portal>
          <div 
            className="fixed inset-0 z-30" 
            onClick={(e) => { e.stopPropagation(); onClose(); }} 
          />
          <div
            className="absolute bg-white border border-gray-200 rounded shadow-lg"
            style={{
              top: coords.top + 4, // 4px gap
              left: align === 'right' ? coords.left + coords.width - 160 : coords.left,
              width: '160px',
              zIndex: 9999,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </div>
        </Portal>
      )}
    </>
  );
};

export default ActionDropdown;
