# AI Study Guide

AI Study Guide is an intelligent learning platform that helps users create comprehensive study materials using AI. The platform generates detailed outlines, study notes, quizzes, and interactive learning content for any topic.

## Features

- **AI-Powered Content Generation**
  - Generates detailed main outlines for any topic
  - Creates comprehensive sub-outlines for specific areas
  - Produces in-depth study notes with examples and explanations

- **Interactive Learning Tools**
  - Dynamic quiz generation with instant feedback
  - "Dive Deeper" feature for exploring advanced concepts
  - Text-to-speech functionality for audio learning

- **Export Options**
  - Export notes to Word documents
  - Download outlines in various formats
  - Save and organize study materials

- **User-Friendly Interface**
  - Modern, responsive design
  - Dark/light mode support
  - Intuitive navigation with breadcrumbs
  - Progress tracking

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn
- Supabase account for database functionality

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/aistudyguide.git
   cd aistudyguide
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   Create a `.env.local` file with the following:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Database**: Supabase
- **Authentication**: Supabase Auth
- **AI Integration**: Custom AI endpoints for content generation
- **Export**: file-saver, sanitize-html for document exports

## Project Structure

```
aistudyguide/
├── app/
│   ├── components/      # Reusable UI components
│   ├── dashboard/       # Dashboard and study features
│   ├── lib/            # Utility functions and libraries
│   ├── utils/          # Helper functions
│   └── page.tsx        # Landing page
├── public/             # Static assets
└── styles/            # Global styles
```

## Recent Updates

- Added Word document export functionality
- Implemented TinyLaunch badge integration
- Enhanced UI with modern styling
- Added text-to-speech capabilities
- Improved quiz generation and feedback system

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with [Next.js](https://nextjs.org)
- Powered by [Supabase](https://supabase.com)
- Styled with [Tailwind CSS](https://tailwindcss.com)

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
