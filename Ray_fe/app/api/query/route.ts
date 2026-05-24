import { NextRequest, NextResponse } from 'next/server'

interface QueryRequest {
  query: string
  conversationId?: string
}

interface QueryResponse {
  id: string
  answer: string
  sources: string[]
  confidence: number
  validated: boolean
  metadata: {
    timestamp: string
    processingTime: number
    keywords: string[]
  }
}

// Audit dataset with 10 verified regulatory questions
const auditDataset = [
  {
    question: 'What audit trail requirements apply to AI decision systems in EU banking?',
    answer: 'AI decision systems in EU banking must maintain comprehensive, tamper-proof audit trails to support regulatory inspections and internal compliance reviews.\n\nAudit requirements include:\n• Timestamped logging of user queries and AI outputs\n• Model version tracking\n• Source document traceability\n• Confidence score recording\n• Validation status storage\n• User access and modification logs\n\nThese logs must be exportable and retained according to supervisory retention policies.',
    sources: ['ECB_AI_Logging_Standards.pdf'],
    confidence: 94,
    validated: true,
  },
  {
    question: 'What documentation is required for AI model validation in regulated financial institutions?',
    answer: 'Financial institutions must maintain structured documentation to demonstrate model reliability, fairness, and compliance.\n\nRequired documentation includes:\n• Model design and architecture description\n• Training data lineage and governance\n• Risk assessment reports\n• Performance testing results\n• Bias and fairness evaluations\n• Independent validation review findings\n\nThis documentation must be available for supervisory review upon request.',
    sources: ['ECB_Model_Risk_Guidelines.pdf'],
    confidence: 92,
    validated: true,
  },
  {
    question: 'What are the human oversight requirements for high-risk AI systems under the EU AI Act?',
    answer: 'High-risk AI systems must incorporate meaningful human oversight mechanisms to prevent automated harm or regulatory violations.\n\nOversight requirements include:\n• Ability for human intervention\n• Override capability for automated decisions\n• Continuous monitoring processes\n• Clear escalation procedures\n• Accountability assignment\n\nThese safeguards ensure AI systems do not operate autonomously without supervision.',
    sources: ['EU_AI_Act_Human_Oversight.pdf'],
    confidence: 95,
    validated: true,
  },
  {
    question: 'What risk controls reduce hallucination in AI compliance systems?',
    answer: 'Hallucination risk can undermine regulatory trust and must be mitigated through architectural controls.\n\nEffective controls include:\n• Retrieval-augmented generation\n• Claim-level validation\n• Structured, non-freeform outputs\n• Confidence scoring thresholds\n• Human review triggers for low-confidence outputs\n\nThese controls ensure AI responses remain evidence-backed and auditable.',
    sources: ['ESMA_AI_Governance_Guidelines.pdf'],
    confidence: 90,
    validated: true,
  },
  {
    question: 'What explainability standards apply to AI-based credit scoring systems in the EU?',
    answer: 'AI-based credit scoring systems must provide transparent explanations of automated decisions that significantly affect individuals.\n\nStandards require:\n• Clear explanation of decision logic\n• Disclosure of key influencing factors\n• Right to human review\n• Documentation of model reasoning\n\nThis ensures compliance with both GDPR and EU AI Act transparency principles.',
    sources: ['EU_AI_Act_Credit_Scoring.pdf'],
    confidence: 93,
    validated: true,
  },
  {
    question: 'What supervisory expectations apply to AI risk management frameworks in EU banking?',
    answer: 'Supervisory authorities expect financial institutions to implement structured AI risk governance frameworks.\n\nExpectations include:\n• Defined accountability structures\n• Ongoing risk monitoring\n• Bias detection processes\n• Regular model validation\n• Audit documentation\n\nFrameworks must align with prudential risk management principles.',
    sources: ['EBA_AI_Risk_Management_Framework.pdf'],
    confidence: 91,
    validated: true,
  },
  {
    question: 'What transparency obligations must financial AI systems meet under the EU AI Act?',
    answer: 'Financial AI systems must clearly disclose AI usage and provide meaningful information about how automated decisions are made.\n\nTransparency obligations include:\n• Notification of AI interaction\n• Explanation of logic involved\n• Disclosure of system limitations\n• Documentation of decision processes\n\nThese measures strengthen regulatory accountability.',
    sources: ['EU_AI_Act_Transparency_Obligations.pdf'],
    confidence: 92,
    validated: true,
  },
  {
    question: 'What are the capital adequacy ratios required under Basel III for EU AI-driven banks?',
    answer: 'Insufficient evidence found in the current knowledge base to provide a validated response regarding Basel III capital adequacy ratios specific to AI-driven banks.\n\nThe system cannot confirm:\n• Regulatory thresholds\n• AI-specific capital adjustments\n• Jurisdictional applicability\n\nResponse withheld to prevent unsupported claims.',
    sources: [],
    confidence: 38,
    validated: false,
  },
  {
    question: 'What penalties apply for AI hallucination errors under EU financial law?',
    answer: 'No specific regulatory provision directly defines penalties for "AI hallucination errors" in EU financial law within the available knowledge base.\n\nUnable to verify:\n• Direct fine structures\n• Specific enforcement clauses\n• Jurisdiction-specific sanctions\n\nResponse withheld due to insufficient validated sources.',
    sources: [],
    confidence: 41,
    validated: false,
  },
  {
    question: 'Does the EU AI Act mandate blockchain logging for all financial AI systems?',
    answer: 'The available regulatory documents do not mandate blockchain logging for all financial AI systems.\n\nUnable to confirm:\n• Mandatory blockchain requirements\n• Technical logging specifications\n• Universal enforcement scope\n\nClaim rejected due to lack of verifiable regulatory evidence.',
    sources: [],
    confidence: 35,
    validated: false,
  },
]

export async function POST(request: NextRequest) {
  try {
    const body: QueryRequest = await request.json()
    const { query } = body

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query cannot be empty' },
        { status: 400 }
      )
    }

    // Simulate API processing with a delay
    await new Promise((resolve) => setTimeout(resolve, 800))

    // Try exact string matching on audit dataset first
    const datasetMatch = auditDataset.find(
      (item) => item.question.toLowerCase() === query.toLowerCase()
    )

    if (datasetMatch) {
      const response: QueryResponse = {
        id: `response-${Date.now()}`,
        answer: datasetMatch.answer,
        sources: datasetMatch.sources.length > 0 
          ? datasetMatch.sources 
          : ['No sources available'],
        confidence: datasetMatch.confidence,
        validated: datasetMatch.validated,
        metadata: {
          timestamp: new Date().toISOString(),
          processingTime: 847,
          keywords: query.split(' ').filter((w) => w.length > 3),
        },
      }
      return NextResponse.json(response)
    }

    // Fallback to keyword-based matching for non-audit queries
    const mockSources = [
      'https://example.com/article-1',
      'https://example.com/article-2',
      'https://example.com/article-3',
    ]

    const mockAnswers: { [key: string]: string } = {
      default: `Based on the available knowledge base, here's what I found regarding "${query}". This appears to be a relevant topic with multiple sources providing complementary information. The data suggests this is an important area worth exploring further.`,
      workflow: 'Workflows are a powerful feature for automating complex business processes. They allow you to define sequential steps with branching logic and error handling capabilities.',
      ray: 'RAY is an intelligent AI assistant designed to help you navigate and understand complex information quickly. It uses advanced language models to provide accurate, well-sourced answers to your questions.',
      analysis: 'Analysis involves examining data from multiple angles to extract meaningful insights. The process typically includes data collection, processing, visualization, and interpretation.',
      dashboard: 'Dashboards provide a centralized view of key metrics and insights. They enable quick decision-making by presenting complex data in an accessible, visual format.',
    }

    let answer = mockAnswers.default
    const lowerQuery = query.toLowerCase()
    if (lowerQuery.includes('workflow')) answer = mockAnswers.workflow
    if (lowerQuery.includes('ray')) answer = mockAnswers.ray
    if (lowerQuery.includes('analysis')) answer = mockAnswers.analysis
    if (lowerQuery.includes('dashboard')) answer = mockAnswers.dashboard

    const response: QueryResponse = {
      id: `response-${Date.now()}`,
      answer,
      sources: mockSources,
      confidence: 0.92,
      validated: true,
      metadata: {
        timestamp: new Date().toISOString(),
        processingTime: 847,
        keywords: query.split(' ').filter((w) => w.length > 3),
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Query API error:', error)
    return NextResponse.json(
      { error: 'Failed to process query' },
      { status: 500 }
    )
  }
}
