"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/app/lib/supabase';
import Link from 'next/link';

const CTA = () => {
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
    <section className="cta-section">
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Learning?</h2>
        <p className="text-xl mb-8 max-w-2xl mx-auto">
          Join thousands of students who are already using our platform to master new subjects faster and more effectively.
        </p>
        <Link href="/auth/login" className="btn btn-primary">
          Get Started Now
        </Link>
      </div>
    </section>
  );
};

export default CTA;
  