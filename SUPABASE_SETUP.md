# Supabase Setup for StudyGuide

This document provides instructions for setting up Supabase for the StudyGuide application.

## Prerequisites

1. Create a Supabase account at [https://supabase.com](https://supabase.com)
2. Create a new Supabase project

## Database Setup

The application requires several tables to store user data, topics, subtopics, notes, study sessions, and achievements. The SQL migration file is located at `supabase/migrations/20240701000000_create_study_tables.sql`.

### Option 1: Using the SQL Editor

1. Open your Supabase project
2. Go to the SQL Editor
3. Copy the contents of the migration file
4. Run the SQL commands

### Option 2: Using Supabase CLI

1. Install the Supabase CLI: `npm install -g supabase`
2. Login to Supabase: `supabase login`
3. Link your project: `supabase link --project-ref <your-project-ref>`
4. Push the migrations: `supabase db push`

## Authentication Setup

The application uses Supabase Authentication with email/password and Google OAuth.

### Email/Password Authentication

1. Go to Authentication > Settings
2. Enable Email/Password sign-in method
3. Configure email templates for:
   - Confirmation
   - Invitation
   - Magic Link
   - Reset Password

### Google OAuth Setup

1. Go to Authentication > Settings > OAuth Providers
2. Enable Google
3. Create OAuth credentials in the [Google Cloud Console](https://console.cloud.google.com/):
   - Create a new project
   - Configure the OAuth consent screen
   - Create OAuth 2.0 Client ID
   - Add authorized redirect URIs: `https://<your-project-ref>.supabase.co/auth/v1/callback`
4. Add your Google Client ID and Secret to Supabase

## Environment Variables

Update your `.env.local` file with your Supabase URL and anon key:

```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

## Row Level Security (RLS)

The migration file includes RLS policies to ensure users can only access their own data. These policies are automatically applied when you run the migration.

## Testing

After setting up Supabase:

1. Run the application: `npm run dev`
2. Register a new user
3. Create a new topic
4. Verify that the data is stored in Supabase

## Troubleshooting

If you encounter issues:

1. Check the browser console for errors
2. Verify that your environment variables are correct
3. Check the Supabase logs in the dashboard
4. Ensure that RLS policies are correctly applied

## Database Schema

The application uses the following tables:

- `topics`: Stores the main topics created by users
- `subtopics`: Stores subtopics within each main topic
- `notes`: Stores detailed notes for each subtopic
- `study_sessions`: Tracks user study history
- `achievements`: Stores user achievements

Each table has appropriate RLS policies to ensure data security. 