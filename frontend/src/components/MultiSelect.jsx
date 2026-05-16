import React, { useState, useRef, useEffect } from 'react';

export default function MultiSelect({ options, selected, onChange, placeholder = "Type to search..." }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Filter out options that are already selected
  const availableOptions = options.filter(opt => !selected.includes(opt.id));
  
  // Filter by query
  const filteredOptions = availableOptions.filter(opt => {
    const searchString = `${opt.name || ''} ${opt.email || ''}`.toLowerCase();
    return searchString.includes(query.toLowerCase());
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    onChange([...selected, option.id]);
    setQuery('');
    setIsOpen(false);
  };

  const handleRemove = (id) => {
    onChange(selected.filter(s => s !== id));
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Selected Items area */}
      {selected.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
          {selected.map(id => {
            const opt = options.find(o => o.id === id);
            if (!opt) return null;
            return (
              <div key={id} style={{
                background: 'rgba(99,102,241,0.15)',
                border: '1px solid var(--accent)',
                color: 'var(--text-primary)',
                padding: '4px 8px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                {opt.name} {opt.role && <span style={{fontSize: '0.7rem', opacity: 0.7}}>({opt.role})</span>}
                <button 
                  type="button" 
                  onClick={() => handleRemove(id)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: 0 }}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Input */}
      <input
        type="text"
        className="tf-input"
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
      />

      {/* Dropdown Menu */}
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
            filteredOptions.map(opt => (
              <div 
                key={opt.id}
                onClick={() => handleSelect(opt)}
                style={{
                  padding: '10px 12px',
                  cursor: 'pointer',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{opt.name}</div>
                  {opt.email && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{opt.email}</div>}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
