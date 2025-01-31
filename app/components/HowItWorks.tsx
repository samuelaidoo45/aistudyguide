const HowItWorks = () => {
    const steps = [
      {
        number: 1,
        title: 'Enter Your Topic',
        description:
          'Type in any subject you want to learn about, from quantum physics to ancient history.',
      },
      {
        number: 2,
        title: 'Get Instant Analysis',
        description:
          'Our AI analyzes and breaks down the topic into a clear, structured outline with key concepts.',
      },
      {
        number: 3,
        title: 'Learn & Interact',
        description:
          'Explore deeper with interactive Q&A, generate summaries, and track your progress.',
      },
    ];
  
    return (
      <section id="how-it-works" className="how-it-works section">
        <h2 className="section-title">How It Works</h2>
        <div className="step-container">
          {steps.map((step) => (
            <div className="step" key={step.number}>
              <div className="step-number">{step.number}</div>
              <div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  };
  
  export default HowItWorks;
  