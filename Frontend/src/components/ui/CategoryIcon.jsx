import React, { useState } from 'react';
import { Briefcase } from 'lucide-react';

/**
 * Rounded-square icon tile + label, used for the home hero's category row
 * and anywhere else a compact category shortcut is needed. Tries the
 * Cloudinary `imageUrl` first; falls back to `fallbackIcon` (or a generic
 * briefcase) when there's no image, or it fails to load.
 */
// eslint-disable-next-line no-unused-vars -- FallbackIcon is used as a JSX tag below; core no-unused-vars can't see JSX-only usage without eslint-plugin-react (pre-existing project gap, see SectionHeader.jsx)
const CategoryIcon = ({ label, imageUrl, fallbackIcon: FallbackIcon = Briefcase, onClick }) => {
  const [errored, setErrored] = useState(false);
  const showImage = imageUrl && !errored;

  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2 group cursor-pointer">
      <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center overflow-hidden shadow-sm group-hover:bg-primary transition-all text-primary group-hover:text-primary-foreground">
        {showImage ? (
          <img
            src={imageUrl}
            alt={label}
            className="w-full h-full object-cover"
            onError={() => setErrored(true)}
          />
        ) : (
          <FallbackIcon className="w-6 h-6" />
        )}
      </div>
      <span className="text-xs font-medium text-muted-foreground text-center leading-tight">{label}</span>
    </button>
  );
};

export default CategoryIcon;
