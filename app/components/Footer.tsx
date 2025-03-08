const Footer = () => {
    return (
      <footer className="bg-indigo-900 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* About StudyGuide */}
          <div>
            <h3 className="text-xl font-semibold mb-4 text-white">About TopicSimplify</h3>
            <p className="text-gray-100">
              TopicSimplify is your AI-powered learning assistant. Our mission is to
              make education accessible, interactive, and engaging for everyone—
              no matter the complexity of the topic.
            </p>
          </div>
          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-semibold mb-4 text-white">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a href="/privacy-policy" className="text-gray-100 hover:text-indigo-300 transition-colors">Privacy Policy</a>
              </li>
              <li>
                <a href="/terms-and-conditions" className="text-gray-100 hover:text-indigo-300 transition-colors">Terms and Conditions</a>
              </li>
            </ul>
          </div>
          {/* Contact */}
          <div>
            <h3 className="text-xl font-semibold mb-4 text-white">Contact</h3>
            <p className="text-gray-100">
              <strong>Email:</strong> samuelaidoo45@gmail.com <br />
              <strong>Twitter/X:</strong>{' '}
              <a href="https://x.com/_samuelaidoo" className="text-gray-100 hover:text-indigo-300 transition-colors">
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
  