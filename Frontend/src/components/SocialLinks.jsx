import React from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/appStore';

const SocialLinks = () => {
  const { maintenanceData } = useAppStore();
  const socials = maintenanceData?.socials || {};

  // Build the list of active links dynamically
  const activeSocials = [
    socials.website && {
      label: 'Website',
      href: socials.website,
      svg: (
        <svg className="w-4 h-4 stroke-current fill-none stroke-[2]" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20"/>
        </svg>
      )
    },
    socials.whatsapp && {
      label: 'WhatsApp',
      href: socials.whatsapp,
      svg: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.247 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.438 9.888-9.886.002-5.449-4.436-9.888-9.886-9.888-5.449 0-9.888 4.439-9.89 9.888-.001 2.014.518 3.657 1.485 5.267l-.974 3.559 3.669-.963zm12.338-6.192c-.3-.149-1.777-.878-2.05-.978-.272-.098-.47-.149-.669.149-.198.297-.767.978-.94 1.178-.173.197-.347.223-.647.074-.3-.149-1.265-.467-2.41-1.487-.89-.793-1.49-1.773-1.665-2.07-.173-.3-.018-.462.13-.61.135-.133.3-.347.45-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.568-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.778-.727 2.025-1.429.247-.699.247-1.299.173-1.429-.074-.124-.272-.198-.572-.347z"/>
        </svg>
      )
    },
    socials.telegram && {
      label: 'Telegram',
      href: socials.telegram,
      svg: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M23.977 2.658c-.144-.805-.724-1.39-1.503-1.498-1.5-.205-20.916 7.9-22.1 8.434-.842.38-.838 1.18-.015 1.5 2.152.84 5.342 1.9 5.342 1.9s1.464 4.542 2.227 6.772c.22.642.756.66 1.082.164.71-1.082 2.766-3.832 2.766-3.832s3.6 2.72 6.55 4.8c1.1.77 1.88.35 2.14-.972 1.168-5.9 3.864-18.72 4.05-20.448.006-.05.006-.1.006-.15zM8.364 13.914l11.455-7.316-9.282 8.643-.223 2.584z"/>
        </svg>
      )
    },
    socials.facebook && {
      label: 'Facebook',
      href: socials.facebook,
      svg: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      )
    },
    socials.twitter && {
      label: 'Twitter',
      href: socials.twitter,
      svg: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
        </svg>
      )
    },
    socials.instagram && {
      label: 'Instagram',
      href: socials.instagram,
      svg: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051C.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
        </svg>
      )
    }
  ].filter(Boolean);

  return (
    <div className="flex gap-4 items-center justify-center relative z-20">
      {activeSocials.map((soc) => (
        <motion.a
          key={soc.label}
          href={soc.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={soc.label}
          className="p-3 bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-xl text-slate-500 dark:text-muted-foreground hover:text-slate-900 dark:hover:text-white transition-colors duration-300 relative group flex items-center justify-center"
          whileHover={{ 
            y: -3, 
            rotate: 4, 
            borderColor: 'rgba(99, 102, 241, 0.3)',
            boxShadow: '0 0 15px rgba(99, 102, 241, 0.2)'
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
        >
          {soc.svg}
          
          {/* Tooltip */}
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-white dark:bg-[#09090B] border border-slate-200 dark:border-white/10 rounded-lg text-[9px] font-bold uppercase tracking-wider text-slate-900 dark:text-white opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-300 shadow-xl whitespace-nowrap">
            {soc.label}
          </span>
        </motion.a>
      ))}
    </div>
  );
};

export default SocialLinks;

