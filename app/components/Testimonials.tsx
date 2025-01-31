const Testimonials = () => {
    const testimonials = [
      {
        content:
          'StudyGuide has revolutionized how I approach new subjects. The AI-generated outlines save me hours of research time.',
        author: 'Sarah Chen',
        role: 'Graduate Student',
      },
      {
        content:
          "The interactive learning features help me understand complex topics quickly. It's like having a personal tutor available 24/7.",
        author: 'Marcus Johnson',
        role: 'Software Engineer',
      },
      {
        content:
          'Perfect for both quick reviews and deep dives into new subjects. The progress tracking keeps me motivated.',
        author: 'Emily Thompson',
        role: 'Freelance Writer',
      },
    ];
  
    return (
      <section id="testimonials" className="section">
        <h2 className="section-title">What Our Users Say</h2>
        <div className="testimonial-grid">
          {testimonials.map((testimonial, index) => (
            <div className="testimonial-card" key={index}>
              <div className="testimonial-content">"{testimonial.content}"</div>
              <div className="testimonial-author">
                <div className="author-avatar"></div>
                <div>
                  <strong>{testimonial.author}</strong>
                  <div>{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  };
  
  export default Testimonials;
  