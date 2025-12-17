import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json()
    
    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    const zai = await ZAI.create()
    
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a content moderator for an AI idea sharing platform. Your task is to check if the given content is appropriate for a professional, creative, and inspiring community.

        Rules:
        - Content should be about AI, technology, innovation, or creative ideas
        - No NSFW, sexual content, hate speech, violence, or illegal activities
        - No spam, advertising, or promotional content
        - No harmful, dangerous, or unethical suggestions
        - Content should be constructive and positive

        Respond with a JSON object:
        {
          "isAppropriate": true/false,
          "reason": "Brief explanation if not appropriate",
          "warning": "User-friendly warning message if not appropriate"
        }`
        },
        {
          role: 'user',
          content: `Please review this content for appropriateness: "${content}"`
        }
      ],
      temperature: 0.3,
      max_tokens: 200
    })

    const response = completion.choices[0]?.message?.content
    
    if (!response) {
      return NextResponse.json(
        { isAppropriate: true, warning: '' },
        { status: 200 }
      )
    }

    try {
      const moderationResult = JSON.parse(response)
      return NextResponse.json(moderationResult)
    } catch (parseError) {
      // If JSON parsing fails, do a basic check
      const isAppropriate = !response.toLowerCase().includes('not appropriate') && 
                           !response.toLowerCase().includes('inappropriate')
      return NextResponse.json({
        isAppropriate,
        warning: isAppropriate ? '' : 'Please revise your content to be more appropriate for our community.'
      })
    }

  } catch (error) {
    console.error('Content moderation error:', error)
    return NextResponse.json(
      { isAppropriate: true, warning: '' }, // Allow content if moderation fails
      { status: 200 }
    )
  }
}