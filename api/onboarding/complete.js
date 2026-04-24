import { openai } from '../_lib/claude.js'
import { supabase } from '../_lib/supabase.js'
import { verifyAuth } from '../_middleware/auth.js'

export const config = {
  maxDuration: 120,
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
      max_tokens: 8192,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are a world-class clinical psychologist and psychoanalyst with 30 years of experience. You see patterns others miss. You understand people at a level that feels almost supernatural. Respond with valid JSON only.',
        },
        {
          role: 'user',
          content: `Analyze this intake conversation with extraordinary depth. Your analysis will be shown to the client as a "deep profile" — it should feel revelatory, like you dove into their brain and surfaced things they barely knew about themselves. Be specific, use their actual words and stories when possible. Never be generic.

CONVERSATION:
${conversationText}

Generate a JSON response with this EXACT structure. Be SPECIFIC to this person — no generic filler. If something wasn't discussed, use null rather than guessing. But for what WAS discussed, go DEEP.

{
  "display_name": "Their first name",
  "age": null,

  "life_context_document": "A 4-6 paragraph narrative written in second person ('You are...') that reads like the most insightful character study ever written about this person. Include specific details from their story. This should make them feel deeply understood — almost uncomfortably so.",

  "personality_archetype": {
    "label": "A compelling 2-4 word archetype label (e.g., 'The Quiet Architect', 'The Reluctant Caretaker', 'The Armored Romantic'). This should feel true and specific to them.",
    "description": "2-3 sentences explaining why this archetype fits them based on what they shared."
  },

  "the_headline": "One powerful sentence that captures who this person is at their core — the kind of line that makes them stop and think. Like a thesis statement for their psyche. Example: 'You've spent your whole life proving you don't need anyone, but the exhaustion of doing it alone is what finally brought you here.'",

  "revelations": [
    {
      "title": "Short label (3-6 words)",
      "insight": "A specific, revelatory insight about this person — something they might not fully realize about themselves. 2-3 sentences. Reference specific things they said. These should feel like 'how did you know that?' moments.",
      "evidence": "The specific thing they said or pattern you noticed that led to this insight."
    }
  ],

  "inner_world": {
    "core_belief": "The deepest belief they hold about themselves, often formed in childhood. One sentence.",
    "inner_critic_voice": "What their inner critic says to them — the specific message. Put it in quotes like dialogue.",
    "what_they_crave": "What they most deeply want but may struggle to ask for.",
    "what_they_avoid": "The feeling, situation, or truth they work hardest to avoid.",
    "superpower": "Their greatest psychological strength — the thing they don't give themselves enough credit for."
  },

  "attachment_patterns": {
    "primary_style": "secure/anxious-preoccupied/dismissive-avoidant/fearful-avoidant or null",
    "how_it_shows_up": "2-3 sentences about how this attachment style specifically manifests in THEIR life, referencing what they shared.",
    "in_relationships": "How this plays out in their romantic/close relationships specifically.",
    "origin_story": "Where this attachment pattern likely formed — what in their childhood/family created this."
  },

  "core_schemas": [
    {
      "schema": "Schema name (e.g., 'Abandonment', 'Unrelenting Standards', 'Defectiveness')",
      "how_it_runs_their_life": "2-3 sentences about how this schema specifically shows up in their daily life, decisions, and relationships. Be concrete.",
      "they_might_not_realize": "The subtle way this schema operates that they probably don't see."
    }
  ],

  "defense_mechanisms": [
    {
      "mechanism": "Name of the defense (e.g., 'Intellectualization', 'Humor as deflection')",
      "description": "How they specifically use this defense — with examples from the conversation."
    }
  ],

  "shadow_profile": {
    "rejected_self": "The part of themselves they push away or deny. What would they never want to be seen as?",
    "projection_pattern": "What they tend to criticize in others that might be a disowned part of themselves.",
    "the_mask": "The version of themselves they present to the world vs. who they are underneath."
  },

  "relational_patterns": {
    "role_in_relationships": "The role they consistently play (caretaker, fixer, performer, rebel, ghost, etc.) with specific evidence.",
    "conflict_style": "What they do when tension arises — fight, flee, freeze, or fawn? How specifically?",
    "vulnerability_capacity": "How capable are they of being truly vulnerable? What happens when they try?",
    "pattern_they_repeat": "A recurring relational pattern they may not fully see."
  },

  "emotional_fingerprint": {
    "dominant_emotions": ["The 2-3 emotions they seem to experience most often"],
    "suppressed_emotions": ["The 1-2 emotions they have the hardest time accessing or expressing"],
    "emotional_range": "narrow/moderate/wide — how much emotional range did they demonstrate?",
    "regulation_style": "How do they manage difficult emotions? Over-control, under-control, or healthy regulation?"
  },

  "existential_landscape": {
    "meaning_sources": "What gives their life meaning — or the absence they feel.",
    "authenticity_gap": "The distance between who they are and who they're performing as. What role are they playing that isn't them?",
    "core_fears": "Their deepest fears — not surface fears, but the existential ones.",
    "relationship_with_mortality": "How do they relate to the finite nature of life? Do they live urgently or avoid thinking about it?"
  },

  "behavioral_patterns": {
    "under_stress": "What they do when the pressure is on — their go-to coping behaviors.",
    "self_sabotage": "How they get in their own way. The specific pattern of self-sabotage, if any.",
    "energy_sources": "What genuinely recharges them vs. what they think recharges them.",
    "decision_making": "How they make decisions — gut, analysis, avoidance, or outsourcing to others?"
  },

  "presenting_concerns": ["Main issues that brought them here"],
  "strengths": ["Their genuine strengths — not platitudes, but real things you noticed"],
  "growth_edges": ["The specific areas where growth is possible — where the work is"],
  "goals": ["What they want to work on"],

  "somatic_behavioral": {
    "stress_location": "Where stress lives in their body",
    "sleep": null,
    "substances": null,
    "exercise": null,
    "energy": null
  },

  "therapeutic_approach_notes": "Based on this specific person, which therapeutic frameworks and specific interventions would be most effective and why? Be specific — not just 'CBT' but 'CBT for the catastrophizing pattern around work performance, combined with schema therapy to address the unrelenting standards schema that drives their perfectionism.'"
}

CRITICAL: Generate 4-7 revelations. Each one should be specific enough that this person would say 'wow, that's exactly right.' Never be vague or generic. If you only have enough data for fewer insights, that's fine — quality over quantity. Use null for any field where the conversation didn't provide enough information.`,
        },
      ],
    })

    const extracted = JSON.parse(extractionResponse.choices[0].message.content)

    const questionnaire = {
      life_context_document: extracted.life_context_document,
      personality_archetype: extracted.personality_archetype,
      the_headline: extracted.the_headline,
      revelations: extracted.revelations,
      inner_world: extracted.inner_world,
      attachment_patterns: extracted.attachment_patterns,
      core_schemas: extracted.core_schemas,
      defense_mechanisms: extracted.defense_mechanisms,
      shadow_profile: extracted.shadow_profile,
      relational_patterns: extracted.relational_patterns,
      emotional_fingerprint: extracted.emotional_fingerprint,
      existential_landscape: extracted.existential_landscape,
      behavioral_patterns: extracted.behavioral_patterns,
      presenting_concerns: extracted.presenting_concerns,
      strengths: extracted.strengths,
      growth_edges: extracted.growth_edges,
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
      profile: extracted,
    })
  } catch (error) {
    console.error('Onboarding complete error:', error)
    res.status(500).json({ error: 'Failed to generate your profile' })
  }
}
