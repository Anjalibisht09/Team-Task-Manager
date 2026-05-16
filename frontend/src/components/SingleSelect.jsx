import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export default function SingleSelect({ options, value, onChange, placeholder = "Select an option..." }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // If we have a selected value, find its corresponding option to display its name when not searching
  const selectedOption = options.find(o => o.id === value || o.value === value);
  const displayValue = isOpen ? query : (selectedOption ? (selectedOption.name || selectedOption.label) : '');

  const filteredOptions = options.filter(opt => {
    const searchString = `${opt.name || opt.label || ''} ${opt.email || ''}`.toLowerCase();
    return searchString.includes(query.toLowerCase());
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setQuery(''); // Reset query when closing without selection
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    onChange(option.id !== undefined ? option.id : option.value);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          type="text"
          className="tf-input"
          placeholder={selectedOption ? (selectedOption.name || selectedOption.label) : placeholder}
          value={displayValue}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            setQuery(''); // Clear text so user can see full list and type new search
          }}
          style={{ paddingRight: '32px', cursor: isOpen ? 'text' : 'pointer' }}
        />
        <ChevronDown 
          size={16} 
          color="var(--text-muted)" 
          style={{ 
            position: 'absolute', right: '12px', 
            pointerEvents: 'none',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }} 
        />
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%', left: 0, right: 0,
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--glass-border)',
          borderRadius: '8px',
          marginTop: '4px',
          maxHeight: '200px',
          overflowY: 'auto',
          zIndex: 50,
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
        }}>
          {filteredOptions.length === 0 ? (
            <div style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
              No matches found.
            </div>
          ) : (
            filteredOptions.map(opt => {
              const optId = opt.id !== undefined ? opt.id : opt.value;
              const isSelected = optId === value;
              return (
                <div 
                  key={optId}
                  onClick={() => handleSelect(opt)}
                  style={{
                    padding: '10px 12px',
                    cursor: 'pointer',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
                    background: isSelected ? 'rgba(99,102,241,0.1)' : 'transparent',
                    fontSize: '0.9rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div>
                    <div style={{ fontWeight: isSelected ? 700 : 500 }}>{opt.name || opt.label}</div>
                    {opt.email && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{opt.email}</div>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
