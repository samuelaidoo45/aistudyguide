"use client"

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  href?: string;
  className?: string;
}

export default function Logo({ href = "/", className = "" }: LogoProps) {
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Use useEffect to handle client-side only logic
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleLogoLoad = () => {
    setLogoLoaded(true);
  };

  const handleLogoError = () => {
    setLogoError(true);
    // Removed console.error to avoid unnecessary logging
  };

  // Initial server render - always show both logo and text to avoid hydration mismatch
  // Client-side logic will handle showing/hiding based on load state
  const logoContent = (
    <div className={`relative w-[150px] h-[50px] ${className}`}>
      {/* Always render the Image component for SSR */}
      <Image 
        src="/images/logo.png" 
        alt="TopicSimplify Logo" 
        fill
        style={{ 
          objectFit: 'contain',
          // Only hide the image client-side after mount if there was an error
          opacity: isMounted && logoError ? 0 : 1 
        }}
        priority
        sizes="150px"
        onLoad={handleLogoLoad}
        onError={handleLogoError}
      />
      
      {/* Always render the text fallback for SSR */}
      <div 
        className="text-xl font-bold text-indigo-600 absolute inset-0 flex items-center justify-center"
        style={{ 
          // Only hide the text client-side after mount if the logo loaded successfully
          opacity: isMounted && logoLoaded && !logoError ? 0 : 1 
        }}
      >
        TopicSimplify
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="navbar-logo">
        {logoContent}
      </Link>
    );
  }

  return logoContent;
} 