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
              className="dark:brightness-0 dark:invert"
              priority
              sizes="150px"
              onError={(e) => {
                // Fallback to text if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  const fallback = document.createElement('div');
                  fallback.className = 'text-xl font-bold text-indigo-600 dark:text-indigo-400';
                  fallback.textContent = 'TopicSimplify';
                  parent.appendChild(fallback);
                }
              }}
            />
          </div>
        </Link>

        {/* Hamburger Button (Visible on Mobile) */}
        <button
          className="md:hidden hamburger-btn"
          aria-label="Toggle navigation menu"
          onClick={toggleMenu}
        >
          <div style={{ width: '24px', height: '18px', position: 'relative' }}>
            <span 
              className="hamburger-line"
              style={{
                left: 0,
                backgroundColor: 'var(--text-primary)',
                transform: isMenuOpen ? 'rotate(45deg)' : 'rotate(0)',
                top: isMenuOpen ? '8px' : '0'
              }}
            />
            <span 
              className="hamburger-line"
              style={{
                left: 0,
                backgroundColor: 'var(--text-primary)',
                opacity: isMenuOpen ? 0 : 1,
                top: '8px'
              }}
            />
            <span 
              className="hamburger-line"
              style={{
                left: 0,
                backgroundColor: 'var(--text-primary)',
                transform: isMenuOpen ? 'rotate(-45deg)' : 'rotate(0)',
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
                    className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
                  >
                    Sign in
                  </Link>
                  <Link 
                    href="/auth/register" 
                    className="btn btn-primary text-white"
                    style={{ color: 'white' }}
                  >
                    Sign Up
                  </Link>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden mobile-menu ${isMenuOpen ? 'flex' : 'hidden'}`}>
          <Link 
            href="#features" 
            className="mobile-menu-item border-l-4 border-indigo-400"
            onClick={() => setIsMenuOpen(false)}
          >
            Features
          </Link>
          <Link 
            href="#how-it-works" 
            className="mobile-menu-item border-l-4 border-indigo-400"
            onClick={() => setIsMenuOpen(false)}
          >
            How It Works
          </Link>
          <Link 
            href="#testimonials" 
            className="mobile-menu-item border-l-4 border-indigo-400"
            onClick={() => setIsMenuOpen(false)}
          >
            Testimonials
          </Link>
          
          {!loading && (
            <>
              {user ? (
                <Link 
                  href="/dashboard" 
                  className="mobile-menu-item mobile-menu-item-highlight"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link 
                    href="/auth/login" 
                    className="mobile-menu-item border-l-4 border-indigo-400"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign in
                  </Link>
                  <Link 
                    href="/auth/register" 
                    className="mobile-menu-item mobile-menu-item-highlight"
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