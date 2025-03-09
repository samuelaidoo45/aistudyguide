"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/app/lib/supabase';
import Link from 'next/link';
// import Image from 'next/image'; // If you have images
// import styles from '../styles/Hero.module.css'; // Optional: for component-specific styles

const Hero = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

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

  return (
    <section className="hero improved-hero">
      {/* Optional Overlay for Depth */}
      <div className="hero-overlay"></div>

      <div className="hero-content">
        {/* New Subtitle (Tagline) */}
        <h2 className="hero-subtitle">Empower Your Learning Journey</h2>

        {/* Main Heading */}
        <h1>Transform Complex Topics into Clear Understanding</h1>

        {/* Supporting Text */}
        <p>
          Harness the power of AI to break down any subject into digestible,
          structured knowledge. Master new concepts faster than ever before.
        </p>

        {/* Call to Action Button - Direct to sign in */}
        <Link href="/auth/login" className="btn btn-primary">
          Start Learning Smarter
        </Link>
      </div>
    </section>
  );
};

export default Hero;
