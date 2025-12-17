# Supabase Setup Guide

Follow these steps to set up your Supabase database and configure the application:

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" 
3. Sign up or log in
4. Click "New Project"
5. Choose your organization
6. Set up your project:
   - **Project Name**: `ai-ideas-platform` (or your preferred name)
   - **Database Password**: Create a strong password
   - **Region**: Choose the closest region to your users
7. Click "Create new project"

## 2. Get Your Supabase Credentials

Once your project is created:

1. Go to **Project Settings** (gear icon in the left sidebar)
2. Navigate to **API** section
3. You'll find:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon public**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## 3. Set Up Database Schema

1. Go to **SQL Editor** in the Supabase dashboard
2. Click "New query"
3. Copy and paste the contents of `supabase-schema.sql` file
4. Click "Run" to execute the schema

## 4. Update Environment Variables

Update your `.env` file with your Supabase credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## 5. Test the Application

1. Restart your development server: `bun run dev`
2. The application should now connect to your Supabase database
3. Try submitting an AI idea to test the connection

## Features Enabled

- ✅ Real-time data synchronization
- ✅ Automatic timestamps
- ✅ Row Level Security (RLS)
- ✅ JSON support for tags
- ✅ Scalable cloud database
- ✅ Built-in authentication (if needed later)

## Troubleshooting

If you encounter issues:

1. **Connection errors**: Double-check your URL and keys in `.env`
2. **Schema errors**: Make sure you ran the SQL schema in Supabase
3. **Permission errors**: Ensure RLS policies are correctly set up

## Migration Benefits

- **Scalability**: Supabase handles scaling automatically
- **Real-time**: Built-in real-time subscriptions
- **Security**: Row Level Security out of the box
- **Performance**: Optimized queries and indexing
- **Backup**: Automatic backups and point-in-time recovery