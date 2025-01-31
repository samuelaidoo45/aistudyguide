const Features = () => {
    const featureList = [
      {
        title: 'AI-Powered Outlines',
        description:
          'Generate comprehensive study outlines instantly, with smart topic organization and key concepts highlighted.',
      },
      {
        title: 'Interactive Learning',
        description:
          'Engage with content through dynamic Q&A, get instant clarification, and explore related concepts seamlessly.',
      },
      {
        title: 'Smart Summaries',
        description:
          'Convert complex topics into concise, easy-to-understand summaries that capture essential information.',
      },
      // Uncomment if needed
      // {
      //   title: 'Progress Tracking',
      //   description:
      //     'Monitor your learning journey with detailed analytics and personalized improvement suggestions.',
      // },
    ];
  
    return (
      <section id="features" className="section">
        <h2 className="section-title">Powerful Features</h2>
        <div className="feature-grid">
          {featureList.map((feature, index) => (
            <div className="feature-card" key={index}>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>
    );
  };
  
  export default Features;
  