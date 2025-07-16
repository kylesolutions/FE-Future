import React from 'react';
import { Hash, Palette, Maximize2, Sparkles, Bookmark, Trash2 } from 'lucide-react';
import './NavIcons.css';

const iconMap = {
  frame: Hash,
  color: Palette,
  size: Maximize2,
  finish: Sparkles,
  hanging: Bookmark,
  remove: Trash2,
};

const categoryNames = {
  frame: 'Frame',
  color: 'Color',
  size: 'Size',
  finish: 'Finish',
  hanging: 'Hang',
  remove: 'Remove',
};

function NavIcons({ activeCategory, onCategorySelect }) {
  const categories = ['frame', 'color', 'size', 'finish', 'hanging', 'remove'];

  return (
    <div className="modern-nav-icons">
      {categories.map((category) => {
        const Icon = iconMap[category];
        const isActive = activeCategory === category;
        
        return (
          <button
            key={category}
            className={`nav-icon-button ${isActive ? 'active' : ''}`}
            onClick={() => onCategorySelect(category)}
            title={categoryNames[category]}
          >
            <div className="icon-wrapper">
              <Icon size={24} />
            </div>
            <span className="icon-label">
              {categoryNames[category]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default NavIcons;