import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const GROQ_API_KEY = process.env.GROQ_API_KEY;
if (!GROQ_API_KEY) {
  console.error('GROQ_API_KEY is not set in .env');
  process.exit(1);
}

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const PIPELINE_CONTEXT = `
PHARMORA PIPELINE DATA:
| Asset | Therapeutic Area | Stage | Description | Launch Year | Market Opportunity | Approval Probability |
|-------|-----------------|-------|-------------|-------------|-------------------|---------------------|
| PH-CV-301 | Cardiovascular | Phase 3 | New approach to cholesterol management for improved heart outcomes | 2026 | $15B | 97% |
| PH-CV-302 | Cardiovascular | Phase 3 | Blood thinner to prevent clot-related heart conditions | 2026 | $12B | 94% |
| PH-CV-201 | Cardiovascular | Phase 2 | Medication improving cardiac contractility and heart pumping efficiency | 2028 | $8B | 71% |
| PH-EN-201 | Endocrinology | Phase 2 | Oral medication to improve blood sugar control | 2029 | $8B | 71% |
| PH-EN-202 | Endocrinology | Phase 2 | Oral medication for appetite control and weight management | 2028 | $7B | 66% |
| PH-EN-101 | Endocrinology | Phase 1 | Gene therapy aimed at restoring insulin production | 2030+ | $3B | N/A |

RISK-ADJUSTED OPPORTUNITIES:
- PH-CV-301: $14.55B (97% x $15B) — Near-term, low-risk
- PH-CV-302: $11.28B (94% x $12B) — Near-term, low-risk
- PH-CV-201: $5.68B (71% x $8B) — Mid-term
- PH-EN-201: $5.68B (71% x $8B) + diversification boost
- PH-EN-202: $4.62B (66% x $7B) + diversification boost
- PH-EN-101: Not enough approval data — long-term, high-risk, strategically important

SCORING LOGIC:
- Cardiovascular Phase 3 assets score highest for near-term revenue and lower risk.
- Endocrinology assets receive a diversification boost because Pharmora needs to reduce cardiovascular dependence.
- PH-EN-101 (gene therapy) is long-term, high-risk, strategically important but NOT the top immediate priority.
- Always explain tradeoffs rather than simply picking the highest score.
`;

const COMPETITOR_CONTEXT = `
COMPETITOR DATA:
1. Cardiva — Focus: Cardiovascular, obesity, diabetes
   Initiatives: Private hospital partnerships, AI-driven clinical design, Remote cardiac monitoring platforms
   Threat: MOST DIRECT strategic threat (overlaps with Pharmora in CV, obesity, diabetes AND invests in AI clinical design)

2. Firenza — Focus: Cardiovascular, obesity, diabetes
   Initiatives: Affordable oral obesity formulations, Digital engagement platforms, Primary care and retail health outreach
   Threat: STRONG COMMERCIAL threat (affordable oral obesity could undercut PH-EN-202)

3. BioNova — Focus: Cardiovascular, obesity, diabetes
   Initiatives: Licensing overseas biotech candidates, Partnering with smaller biotech firms, Shared R&D costs and faster market access
   Threat: PIPELINE ACCELERATION threat (licensing and partnerships for speed)

4. Ash & Co — Focus: Oncology, metabolic disorders
   Initiatives: U.S.-based biologics and metabolic manufacturing hub, Generative AI in drug discovery, Lab-to-launch automation systems
   Threat: TECHNOLOGY AND R&D BENCHMARK threat
`;

const PHARMORA_CONTEXT = `
PHARMORA CONTEXT:
- Mid-sized pharmaceutical company historically focused on cardiovascular prescription drugs
- Five-year turnaround strategy: R&D modernization, endocrinology expansion, AI-supported decision-making
- Key strategic issue: too dependent on cardiovascular products
- Needs to use near-term cardiovascular revenue while expanding into obesity, diabetes, and endocrinology
- Current portfolio: ~66% of pipeline value in cardiovascular
- Diversification target: reduce cardiovascular dependence significantly by 2030
`;

function buildSystemPrompt(role: string): string {
  return `You are Pharmora Signal, an internal AI strategy copilot for Pharmora employees. You help with cardiometabolic strategy, pipeline decisions, competitor analysis, payer strategy, and compliance questions.

The user's current role is: ${role}

Role context (weight your answers accordingly):
- C-Suite: strategy, market share, growth, prioritization, executive action
- R&D: pipeline, clinical trial design, endpoints, evidence gaps, development risk
- Finance: ROI, R&D allocation, payer pressure, pricing risk
- Marketing: competitor positioning, prescriber strategy, trust, access messaging
- Regulatory/Compliance: compliance risk, audit trail, human review, AI guardrails
- IT: data sources, access control, system workflow, security

${PHARMORA_CONTEXT}

${PIPELINE_CONTEXT}

${COMPETITOR_CONTEXT}

HOW TO RESPOND:
Respond naturally and conversationally, like a knowledgeable senior strategy consultant talking to a colleague. Use whatever format best fits the question:
- For greetings or casual messages: respond briefly and naturally.
- For simple questions: give a direct answer with supporting data.
- For complex strategic questions: use paragraphs, bullet points, numbered lists, or tables as appropriate.
- For comparisons: use side-by-side analysis.
- For action-oriented questions: lead with the recommendation, then explain why.

Always ground your answers in the specific Pharmora data above. Reference asset codes (PH-CV-301, etc.), dollar figures, approval probabilities, and competitor names when relevant. Be specific, not generic.

At the end of strategic responses, include a brief note about which team should review the recommendation (e.g., "This should be reviewed by R&D and Finance before proceeding.").

RULES:
- NEVER claim FDA approval
- NEVER give medical advice or prescription recommendations
- NEVER invent competitors or pipeline assets not in the data above
- NEVER invent market figures not provided above
- You are internal decision support only — always note that human review is required for action
- If asked something outside Pharmora strategy, politely redirect
- Be concise. Don't pad responses with filler.`;
}

app.post('/api/chat', async (req, res) => {
  try {
    const { messages, role } = req.body;

    if (!messages || !role) {
      return res.status(400).json({ error: 'messages and role are required' });
    }

    const systemPrompt = buildSystemPrompt(role);

    console.log(`[Pharmora Signal] Request from role="${role}", ${messages.length} message(s), last: "${messages[messages.length - 1]?.content?.slice(0, 60)}..."`);

    const groqMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: groqMessages,
        temperature: 0.85,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', response.status, errorText);
      return res.status(response.status).json({ error: `Groq API error: ${response.status}` });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    console.log(`[Pharmora Signal] Response received (${content.length} chars)`);
    return res.json({ content });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Pharmora Signal API server running on port ${PORT}`);
});
