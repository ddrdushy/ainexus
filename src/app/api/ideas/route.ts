import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data: ideas, error } = await supabase
      .from('ai_ideas')
      .select('*')
      .eq('is_approved', true)
      .eq('is_nsfw', false)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch ideas' },
        { status: 500 }
      )
    }

    // Transform the data to match the expected format
    const formattedIdeas = ideas?.map(idea => ({
      ...idea,
      tags: Array.isArray(idea.tags) ? idea.tags : JSON.parse(idea.tags || '[]')
    })) || []

    return NextResponse.json(formattedIdeas)
  } catch (error) {
    console.error('Failed to fetch ideas:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ideas' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, description, category, tags, authorName } = await request.json()

    if (!title || !description || !category) {
      return NextResponse.json(
        { error: 'Title, description, and category are required' },
        { status: 400 }
      )
    }

    const { data: idea, error } = await supabase
      .from('ai_ideas')
      .insert({
        title,
        description,
        category,
        tags: tags || [],
        author_name: authorName || null,
        is_approved: true, // Auto-approve after content moderation
        is_nsfw: false
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to create idea' },
        { status: 500 }
      )
    }

    // Transform the data to match the expected format
    const formattedIdea = {
      ...idea,
      tags: Array.isArray(idea.tags) ? idea.tags : JSON.parse(idea.tags || '[]')
    }

    return NextResponse.json(formattedIdea, { status: 201 })
  } catch (error) {
    console.error('Failed to create idea:', error)
    return NextResponse.json(
      { error: 'Failed to create idea' },
      { status: 500 }
    )
  }
}