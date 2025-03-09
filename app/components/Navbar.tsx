"use client"

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from "next/image";
import { createClient } from '@/app/lib/supabase';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();
  const navRef = useRef<HTMLDivElement>(null);

  // Handle scroll to add shadow
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check if user is logged in
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, [supabase]);

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node) && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Toggle mobile menu
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Mobile menu styles - Improved with solid background and better visibility
  const mobileMenuStyle = {
    position: 'absolute' as const,
    top: '70px',
    left: '16px',
    right: '16px',
    backgroundColor: '#FFFFFF',
    padding: '16px',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15)',
    zIndex: 50,
    display: isMenuOpen ? 'flex' : 'none',
    flexDirection: 'column' as const,
    gap: '10px',
    borderRadius: '8px',
    border: '2px solid #e5e7eb'
  };

  // Mobile menu item styles - Enhanced for better visibility
  const mobileMenuItemStyle = {
    padding: '14px 16px',
    borderRadius: '6px',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    fontWeight: 600,
    textAlign: 'left' as const,
    display: 'block',
    width: '100%',
    marginBottom: '8px',
    border: '1px solid #e5e7eb',
    transition: 'all 0.2s ease'
  };

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`} ref={navRef}>
      <div className="navbar-container">
        {/* Logo */}
        <Link href="/" className="navbar-logo">
          <div className="relative w-[150px] h-[50px]">
            <Image 
              src="/images/logo.png" 
              alt="TopicSimplify Logo" 
              fill
              style={{ objectFit: 'contain' }}
              priority
              sizes="150px"
              onError={(e) => {
                // Fallback to text if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  const fallback = document.createElement('div');
                  fallback.className = 'text-xl font-bold text-indigo-600';
                  fallback.textContent = 'TopicSimplify';
                  parent.appendChild(fallback);
                }
              }}
            />
          </div>
        </Link>

        {/* Hamburger Button (Visible on Mobile) - Enhanced for better visibility */}
        <button
          className="md:hidden bg-white p-2 rounded-md border-2 border-gray-300 shadow-md"
          aria-label="Toggle navigation menu"
          onClick={toggleMenu}
          style={{
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 60,
            backgroundColor: isMenuOpen ? '#f0f5ff' : '#ffffff',
            borderColor: isMenuOpen ? '#4f46e5' : '#d1d5db'
          }}
        >
          <div style={{ width: '24px', height: '18px', position: 'relative' }}>
            <span 
              style={{
                display: 'block',
                position: 'absolute',
                height: '3px',
                width: '100%',
                background: isMenuOpen ? '#4f46e5' : '#374151',
                borderRadius: '2px',
                opacity: 1,
                left: 0,
                transform: isMenuOpen ? 'rotate(45deg)' : 'rotate(0)',
                transition: 'transform 0.25s ease-in-out, background 0.25s ease',
                top: isMenuOpen ? '8px' : '0'
              }}
            />
            <span 
              style={{
                display: 'block',
                position: 'absolute',
                height: '3px',
                width: '100%',
                background: isMenuOpen ? '#4f46e5' : '#374151',
                borderRadius: '2px',
                opacity: isMenuOpen ? 0 : 1,
                left: 0,
                transition: 'opacity 0.25s ease-in-out, background 0.25s ease',
                top: '8px'
              }}
            />
            <span 
              style={{
                display: 'block',
                position: 'absolute',
                height: '3px',
                width: '100%',
                background: isMenuOpen ? '#4f46e5' : '#374151',
                borderRadius: '2px',
                opacity: 1,
                left: 0,
                transform: isMenuOpen ? 'rotate(-45deg)' : 'rotate(0)',
                transition: 'transform 0.25s ease-in-out, background 0.25s ease',
                top: isMenuOpen ? '8px' : '16px'
              }}
            />
          </div>
        </button>

        {/* Desktop Nav Links */}
        <div className="nav-links hidden md:flex">
          <div className="flex items-center space-x-6">
            <Link href="#features">Features</Link>
            <Link href="#how-it-works">How It Works</Link>
            <Link href="#testimonials">Testimonials</Link>
          </div>
          
          {!loading && (
            <div className="ml-auto flex items-center space-x-4">
              {user ? (
                <motion.div
                  className="flex items-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Link 
                    href="/dashboard" 
                    className="btn btn-secondary"
                  >
                    Dashboard
                  </Link>
                </motion.div>
              ) : (
                <motion.div
                  className="flex items-center space-x-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Link 
                    href="/auth/login" 
                    className="text-indigo-600 hover:text-indigo-500 font-medium"
                  >
                    Sign in
                  </Link>
                  <Link 
                    href="/auth/register" 
                    className="btn btn-primary text-white"
                    style={{ color: 'white' }}
                  >
                    Get Started
                  </Link>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Mobile Menu (Completely separate from desktop menu) */}
        <div style={mobileMenuStyle}>
          <Link 
            href="#features" 
            style={{
              ...mobileMenuItemStyle,
              borderLeft: '4px solid #818cf8'
            }} 
            onClick={() => setIsMenuOpen(false)}
          >
            Features
          </Link>
          <Link 
            href="#how-it-works" 
            style={{
              ...mobileMenuItemStyle,
              borderLeft: '4px solid #818cf8'
            }} 
            onClick={() => setIsMenuOpen(false)}
          >
            How It Works
          </Link>
          <Link 
            href="#testimonials" 
            style={{
              ...mobileMenuItemStyle,
              borderLeft: '4px solid #818cf8'
            }} 
            onClick={() => setIsMenuOpen(false)}
          >
            Testimonials
          </Link>
          
          {!loading && (
            <>
              {user ? (
                <Link 
                  href="/dashboard" 
                  style={{
                    ...mobileMenuItemStyle,
                    backgroundColor: '#4f46e5',
                    color: 'white',
                    fontWeight: 600,
                    textAlign: 'center' as const,
                    borderLeft: 'none'
                  }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link 
                    href="/auth/login" 
                    style={{
                      ...mobileMenuItemStyle,
                      borderLeft: '4px solid #818cf8'
                    }}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign in
                  </Link>
                  <Link 
                    href="/auth/register" 
                    style={{
                      ...mobileMenuItemStyle,
                      backgroundColor: '#4f46e5',
                      color: 'white',
                      fontWeight: 600,
                      textAlign: 'center' as const,
                      borderLeft: 'none'
                    }}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
