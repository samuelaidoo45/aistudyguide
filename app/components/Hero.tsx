import Image from 'next/image'; // If you have images
import styles from '../styles/Hero.module.css'; // Optional: for component-specific styles

const Hero = () => {
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

        {/* Call to Action Button */}
        <a href="/studyguide/home" className="btn btn-primary">
          Start Learning Smarter
        </a>
      </div>
    </section>
  );
};

export default Hero;
