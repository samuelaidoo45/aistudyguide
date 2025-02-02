const Footer = () => {
    return (
      <footer className="footer">
        <div className="footer-content">
          {/* About StudyGuide */}
          <div>
            <h3>About StudyGuide</h3>
            <p>
              StudyGuide is your AI-powered learning assistant. Our mission is to
              make education accessible, interactive, and engaging for everyone—
              no matter the complexity of the topic.
            </p>
          </div>
          {/* Quick Links */}
          <div>
            <h3>Quick Links</h3>
            <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
              <li>
                <a href="/privacy-policy">Privacy Policy</a>
              </li>
              <li>
                <a href="/terms-and-conditions">Terms and Conditions</a>
              </li>
            </ul>
          </div>
          {/* Contact */}
          <div>
            <h3>Contact</h3>
            <p>
              <strong>Email:</strong> samuelaidoo45@gmail.com <br />
              <strong>Twitter/X:</strong>{' '}
              <a href="https://x.com/_samuelaidoo">
                https://x.com/_samuelaidoo
              </a>
              <br />
            </p>
          </div>
        </div>
      </footer>
    );
  };
  
  export default Footer;
  