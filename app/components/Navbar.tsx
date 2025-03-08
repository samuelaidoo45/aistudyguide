"use client"

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from "next/image"; // Import Image component from Next.js
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
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();
  }, [supabase]);

  // Toggle mobile menu
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        {/* Logo */}
        <Link href="/" className="navbar-logo">
          <Image 
            src="/images/logo.png" 
            alt="StudyGuide Logo" 
            width={150} 
            height={50} 
            priority
          />
        </Link>

        {/* Hamburger Button (Visible on Mobile) */}
        <button
          className={`nav-toggle ${isMenuOpen ? 'active' : ''}`}
          aria-label="Toggle navigation menu"
          onClick={toggleMenu}
        >
          <span className="hamburger"></span>
        </button>

        {/* Nav Links */}
        <div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
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
      </div>
    </nav>
  );
};

export default Navbar;
