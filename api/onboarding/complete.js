import { openai } from '../lib/claude.js'
import { supabase } from '../lib/supabase.js'
import { verifyAuth } from '../middleware/auth.js'

export const config = {
  maxDuration: 60,
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const user = await verifyAuth(req)
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { conversation_history } = req.body

  if (!conversation_history || conversation_history.length < 4) {
    return res
      .status(400)
      .json({ error: 'Need more conversation to build your profile' })
  }

  try {
    const conversationText = conversation_history
      .map((m) => `${m.role === 'user' ? 'Client' : 'Sage'}: ${m.content}`)
      .join('\n\n')

    const extractionResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 4096,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are a clinical psychologist. Respond with valid JSON only.',
        },
        {
          role: 'user',
          content: `Review this intake conversation and extract a comprehensive life context document. This document will be used by an AI wellness coach to provide deeply personalized guidance in future sessions.

CONVERSATION:
${conversationText}

Generate a JSON response with this EXACT structure (fill in based on what was discussed, use null for anything not covered):

{
  "life_context_document": "A 3-5 paragraph narrative summary written in second person ('You are...', 'You grew up...') that captures who this person is — their story, their patterns, their pain points, their strengths, and what they're seeking. This should read like a clinical intake summary but in warm, human language. Include specific details they shared. This is the most important field.",

  "display_name": "Their first name",
  "age": null,

  "attachment_patterns": {
    "primary_style": "secure/anxious/avoidant/disorganized or null",
    "notes": "Brief description of how this shows up for them"
  },

  "core_schemas": ["List of identified schemas from the conversation, e.g., 'abandonment', 'unrelenting_standards', 'defectiveness'"],

  "defense_mechanisms": ["Primary defense mechanisms observed, e.g., 'intellectualization', 'humor', 'avoidance'"],

  "shadow_material": "What they seem to reject or avoid in themselves",

  "relational_patterns": {
    "role": "caretaker/fixer/pleaser/rebel/etc or null",
    "conflict_style": "How they handle conflict",
    "vulnerability": "Can they be vulnerable? With whom?"
  },

  "existential_landscape": {
    "meaning_sources": "What gives them meaning",
    "authenticity": "Are they living authentically or performing?",
    "core_fears": "What are they most afraid of?"
  },

  "presenting_concerns": ["Main issues they brought up"],
  "strengths": ["Strengths and resilience factors identified"],
  "goals": ["What they want to work on or change"],

  "somatic_behavioral": {
    "stress_location": "Where stress lives in their body",
    "sleep": null,
    "substances": null,
    "exercise": null,
    "energy": null
  },

  "therapeutic_approach_notes": "Based on this person's presentation, which therapeutic frameworks would be most helpful? (e.g., 'Schema therapy for abandonment patterns, ACT for flexibility around unrelenting standards, Jungian shadow work for rejected anger')"
}`,
        },
      ],
    })

    const extracted = JSON.parse(extractionResponse.choices[0].message.content)

    const questionnaire = {
      life_context_document: extracted.life_context_document,
      attachment_patterns: extracted.attachment_patterns,
      core_schemas: extracted.core_schemas,
      defense_mechanisms: extracted.defense_mechanisms,
      shadow_material: extracted.shadow_material,
      relational_patterns: extracted.relational_patterns,
      existential_landscape: extracted.existential_landscape,
      presenting_concerns: extracted.presenting_concerns,
      strengths: extracted.strengths,
      goals: extracted.goals,
      somatic_behavioral: extracted.somatic_behavioral,
      therapeutic_approach_notes: extracted.therapeutic_approach_notes,
      intake_message_count: conversation_history.length,
      completed_at: new Date().toISOString(),
    }

    const profileUpdates = {
      questionnaire,
      onboarding_completed: true,
    }

    if (extracted.display_name) {
      profileUpdates.display_name = extracted.display_name
    }
    if (extracted.age) {
      profileUpdates.age = extracted.age
    }

    const { error } = await supabase
      .from('profiles')
      .update(profileUpdates)
      .eq('id', user.id)

    if (error) throw error

    res.json({
      success: true,
      life_context_preview:
        extracted.life_context_document?.substring(0, 200) + '...',
    })
  } catch (error) {
    console.error('Onboarding complete error:', error)
    res.status(500).json({ error: 'Failed to generate your profile' })
  }
}
