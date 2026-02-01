// Comprehensive Regulations Database
// Summaries with official EUR-Lex links for GDPR, eIDAS 2.0, AML/6AMLD, and EU AI Act

export interface Article {
  id: string;
  title: string;
  summary: string;
  relevance: string; // Why it matters for identity/KYC
  officialLink: string;
  keywords: string[];
}

export interface Framework {
  id: string;
  name: string;
  fullName: string;
  description: string;
  officialLink: string;
  articles: Article[];
}

export const regulations: Framework[] = [
  {
    id: "gdpr",
    name: "GDPR",
    fullName: "General Data Protection Regulation",
    description: "EU regulation on data protection and privacy, governing how personal data must be collected, processed, and stored.",
    officialLink: "https://gdpr-info.eu/",
    articles: [
      {
        id: "gdpr-art-5",
        title: "Article 5 - Principles relating to processing",
        summary: "Personal data must be processed lawfully, fairly, and transparently. Data must be collected for specified purposes, be adequate and relevant, kept accurate, stored only as long as necessary, and processed securely.",
        relevance: "Core principles for all identity data processing. Every KYC operation must demonstrate compliance with these principles.",
        officialLink: "https://gdpr-info.eu/art-5-gdpr/",
        keywords: ["lawfulness", "fairness", "transparency", "purpose limitation", "data minimization", "accuracy", "storage limitation", "integrity", "confidentiality"]
      },
      {
        id: "gdpr-art-6",
        title: "Article 6 - Lawfulness of processing",
        summary: "Processing is lawful only if: consent given, necessary for contract, legal obligation, vital interests, public interest, or legitimate interests. At least one legal basis must apply.",
        relevance: "KYC processing typically relies on legal obligation (AML requirements) or contract necessity. Must document the legal basis used.",
        officialLink: "https://gdpr-info.eu/art-6-gdpr/",
        keywords: ["consent", "contract", "legal obligation", "legitimate interest", "lawful basis"]
      },
      {
        id: "gdpr-art-7",
        title: "Article 7 - Conditions for consent",
        summary: "Consent must be freely given, specific, informed, and unambiguous. Controller must demonstrate consent was given. Withdrawal must be as easy as giving consent.",
        relevance: "When using consent as legal basis for identity verification, these strict conditions apply. Consider if legal obligation is more appropriate.",
        officialLink: "https://gdpr-info.eu/art-7-gdpr/",
        keywords: ["consent", "freely given", "specific", "informed", "unambiguous", "withdrawal"]
      },
      {
        id: "gdpr-art-9",
        title: "Article 9 - Processing of special categories",
        summary: "Processing of biometric data for identification, racial/ethnic origin, and other sensitive data is prohibited unless specific exceptions apply (explicit consent, legal obligation, etc.).",
        relevance: "Critical for biometric identity verification. Biometric data used for identification is a special category requiring explicit legal basis.",
        officialLink: "https://gdpr-info.eu/art-9-gdpr/",
        keywords: ["biometric", "special category", "sensitive data", "explicit consent", "identification"]
      },
      {
        id: "gdpr-art-12",
        title: "Article 12 - Transparent information and communication",
        summary: "Information provided to data subjects must be concise, transparent, intelligible, easily accessible, and in clear plain language. Must facilitate exercise of data subject rights.",
        relevance: "Privacy notices for identity verification must be clear. Users must understand how their identity data is processed.",
        officialLink: "https://gdpr-info.eu/art-12-gdpr/",
        keywords: ["transparency", "communication", "plain language", "accessible"]
      },
      {
        id: "gdpr-art-13",
        title: "Article 13 - Information when data collected from subject",
        summary: "When collecting personal data directly, must provide: controller identity, purposes, legal basis, recipients, retention period, data subject rights, and right to complain.",
        relevance: "At point of identity collection, users must receive comprehensive information about processing of their identity data.",
        officialLink: "https://gdpr-info.eu/art-13-gdpr/",
        keywords: ["privacy notice", "data collection", "information rights", "transparency"]
      },
      {
        id: "gdpr-art-15",
        title: "Article 15 - Right of access",
        summary: "Data subjects have the right to obtain confirmation of processing and access to their personal data, including purposes, categories, recipients, retention, and source.",
        relevance: "Customers can request access to all identity data held about them. Systems must support data export.",
        officialLink: "https://gdpr-info.eu/art-15-gdpr/",
        keywords: ["access right", "data subject request", "SAR", "data export"]
      },
      {
        id: "gdpr-art-17",
        title: "Article 17 - Right to erasure ('right to be forgotten')",
        summary: "Data subjects can request deletion when: data no longer necessary, consent withdrawn, objection to processing, unlawful processing, or legal obligation. Does not apply when processing required by law.",
        relevance: "Identity data may need to be retained for AML purposes even after erasure request. Document the legal basis for retention.",
        officialLink: "https://gdpr-info.eu/art-17-gdpr/",
        keywords: ["erasure", "deletion", "right to be forgotten", "retention exception"]
      },
      {
        id: "gdpr-art-25",
        title: "Article 25 - Data protection by design and default",
        summary: "Controllers must implement technical and organizational measures to integrate data protection into processing. By default, only necessary personal data should be processed.",
        relevance: "Identity verification systems must be designed with privacy built-in. Collect minimum data needed for verification.",
        officialLink: "https://gdpr-info.eu/art-25-gdpr/",
        keywords: ["privacy by design", "privacy by default", "data minimization", "technical measures"]
      },
      {
        id: "gdpr-art-30",
        title: "Article 30 - Records of processing activities",
        summary: "Controllers must maintain written records of processing activities including: purposes, data categories, recipients, transfers, retention periods, and security measures.",
        relevance: "Must maintain records of all identity data processing activities. Required for demonstrating compliance to regulators.",
        officialLink: "https://gdpr-info.eu/art-30-gdpr/",
        keywords: ["records", "ROPA", "documentation", "processing activities"]
      },
      {
        id: "gdpr-art-32",
        title: "Article 32 - Security of processing",
        summary: "Implement appropriate technical and organizational measures: pseudonymization, encryption, confidentiality, integrity, availability, resilience, and regular testing.",
        relevance: "Identity data requires strong security measures. Encryption, access controls, and security testing are mandatory.",
        officialLink: "https://gdpr-info.eu/art-32-gdpr/",
        keywords: ["security", "encryption", "pseudonymization", "confidentiality", "integrity"]
      },
      {
        id: "gdpr-art-33",
        title: "Article 33 - Notification of breach to supervisory authority",
        summary: "Personal data breaches must be notified to supervisory authority within 72 hours of awareness, unless unlikely to result in risk to individuals.",
        relevance: "Identity data breaches require rapid notification. Have breach response procedures ready for identity system incidents.",
        officialLink: "https://gdpr-info.eu/art-33-gdpr/",
        keywords: ["breach notification", "72 hours", "supervisory authority", "incident response"]
      },
      {
        id: "gdpr-art-35",
        title: "Article 35 - Data protection impact assessment",
        summary: "DPIA required when processing likely results in high risk: systematic evaluation, large-scale special categories, systematic monitoring of public areas.",
        relevance: "Identity verification at scale likely requires DPIA. Biometric processing definitely requires impact assessment.",
        officialLink: "https://gdpr-info.eu/art-35-gdpr/",
        keywords: ["DPIA", "impact assessment", "high risk", "systematic evaluation"]
      }
    ]
  },
  {
    id: "eidas",
    name: "eIDAS 2.0",
    fullName: "Electronic Identification and Trust Services Regulation",
    description: "EU framework for electronic identification and trust services, establishing European Digital Identity Wallets and qualified trust services.",
    officialLink: "https://eur-lex.europa.eu/eli/reg/2024/1183/oj",
    articles: [
      {
        id: "eidas-art-3",
        title: "Article 3 - Definitions",
        summary: "Defines key terms: electronic identification, authentication, trust service, qualified trust service, electronic signature/seal, time stamp, and European Digital Identity Wallet.",
        relevance: "Foundational definitions for all identity services. Understanding these terms is essential for compliance.",
        officialLink: "https://eur-lex.europa.eu/eli/reg/2024/1183/oj#d1e1057-1-1",
        keywords: ["definitions", "electronic identification", "trust service", "wallet", "authentication"]
      },
      {
        id: "eidas-art-5a",
        title: "Article 5a - European Digital Identity Wallets",
        summary: "Member States shall issue European Digital Identity Wallets enabling users to securely store, manage, and share identity data and electronic attestations of attributes.",
        relevance: "Core requirement for digital identity. Wallets must enable secure credential storage and selective disclosure.",
        officialLink: "https://eur-lex.europa.eu/eli/reg/2024/1183/oj#d1e1421-1-1",
        keywords: ["EUDIW", "digital wallet", "identity wallet", "credential storage", "selective disclosure"]
      },
      {
        id: "eidas-art-6",
        title: "Article 6 - Mutual recognition",
        summary: "Electronic identification means issued under notified scheme of one Member State shall be recognized in all other Member States for cross-border authentication.",
        relevance: "Identity credentials from one EU country must be accepted across borders. Critical for pan-European services.",
        officialLink: "https://eur-lex.europa.eu/eli/reg/2024/1183/oj#d1e1582-1-1",
        keywords: ["mutual recognition", "cross-border", "interoperability", "notified scheme"]
      },
      {
        id: "eidas-art-8",
        title: "Article 8 - Assurance levels",
        summary: "Three assurance levels for electronic identification: Low, Substantial, and High. Each level specifies degree of confidence in claimed identity.",
        relevance: "Identity verification must match required assurance level. High-risk services require High assurance identification.",
        officialLink: "https://eur-lex.europa.eu/eli/reg/2024/1183/oj#d1e1695-1-1",
        keywords: ["assurance level", "LoA", "high assurance", "substantial", "identity proofing"]
      },
      {
        id: "eidas-art-24",
        title: "Article 24 - Requirements for qualified trust service providers",
        summary: "QTSPs must: use trustworthy systems, employ qualified personnel, have financial resources, notify breaches, maintain insurance, and undergo regular audits.",
        relevance: "To offer qualified trust services, must meet these stringent operational requirements.",
        officialLink: "https://eur-lex.europa.eu/eli/reg/2024/1183/oj#d1e2712-1-1",
        keywords: ["QTSP", "qualified trust service", "audit", "certification", "requirements"]
      },
      {
        id: "eidas-art-25",
        title: "Article 25 - Legal effects of electronic signatures",
        summary: "Electronic signatures shall not be denied legal effect solely because they are electronic. Qualified electronic signatures have equivalent effect to handwritten signatures.",
        relevance: "Electronic signatures are legally valid. Qualified e-signatures are equivalent to handwritten for all purposes.",
        officialLink: "https://eur-lex.europa.eu/eli/reg/2024/1183/oj#d1e2834-1-1",
        keywords: ["electronic signature", "legal effect", "qualified signature", "handwritten equivalent"]
      },
      {
        id: "eidas-art-45",
        title: "Article 45 - Electronic attestation of attributes",
        summary: "Electronic attestations of attributes issued by qualified trust service providers shall be recognized across Member States as proof of the attributes they contain.",
        relevance: "Verifiable credentials/attestations from QTSPs have legal recognition across EU. Enables trusted attribute sharing.",
        officialLink: "https://eur-lex.europa.eu/eli/reg/2024/1183/oj#d1e4022-1-1",
        keywords: ["attestation", "attributes", "verifiable credentials", "qualified attestation"]
      },
      {
        id: "eidas-annex-vi",
        title: "Annex VI - Requirements for European Digital Identity Wallets",
        summary: "Technical requirements for wallets: secure cryptographic operations, user authentication, selective disclosure, data minimization, transparency, and interoperability standards.",
        relevance: "Technical specifications for implementing compliant digital identity wallets.",
        officialLink: "https://eur-lex.europa.eu/eli/reg/2024/1183/oj#d1e5328-1-1",
        keywords: ["wallet requirements", "technical standards", "cryptographic", "selective disclosure"]
      }
    ]
  },
  {
    id: "aml",
    name: "AML/6AMLD",
    fullName: "Anti-Money Laundering Directive (6th)",
    description: "EU directive combating money laundering and terrorist financing through customer due diligence, suspicious activity reporting, and enhanced measures for high-risk situations.",
    officialLink: "https://eur-lex.europa.eu/eli/dir/2018/843/oj",
    articles: [
      {
        id: "aml-art-8",
        title: "Article 8 - Customer due diligence measures",
        summary: "CDD measures include: identifying the customer, verifying identity, identifying beneficial owners, understanding purpose of business relationship, and ongoing monitoring.",
        relevance: "Core KYC requirements. Must identify and verify all customers before establishing business relationship.",
        officialLink: "https://eur-lex.europa.eu/eli/dir/2018/843/oj#d1e1398-1-1",
        keywords: ["CDD", "customer due diligence", "identity verification", "KYC", "beneficial owner"]
      },
      {
        id: "aml-art-11",
        title: "Article 11 - Application of CDD",
        summary: "CDD required when: establishing business relationship, carrying out occasional transactions above €15,000, suspecting money laundering, or doubting previously obtained information.",
        relevance: "Triggers for when identity verification must be performed. Transaction thresholds and ongoing verification requirements.",
        officialLink: "https://eur-lex.europa.eu/eli/dir/2018/843/oj#d1e1538-1-1",
        keywords: ["CDD application", "transaction threshold", "business relationship", "triggers"]
      },
      {
        id: "aml-art-13",
        title: "Article 13 - Standard CDD measures",
        summary: "Standard CDD includes: identifying customer (name, ID number, date of birth, address), verifying identity using reliable sources, and identifying beneficial owners with >25% ownership.",
        relevance: "Specific data points required for customer identification. Minimum information to collect and verify.",
        officialLink: "https://eur-lex.europa.eu/eli/dir/2018/843/oj#d1e1601-1-1",
        keywords: ["standard CDD", "identification data", "verification", "beneficial ownership"]
      },
      {
        id: "aml-art-15",
        title: "Article 15 - Simplified due diligence",
        summary: "Simplified CDD allowed for lower-risk situations: regulated entities, public administrations, low-value products. Must still monitor for suspicious activity.",
        relevance: "When reduced verification is acceptable. Still requires risk assessment and monitoring.",
        officialLink: "https://eur-lex.europa.eu/eli/dir/2018/843/oj#d1e1761-1-1",
        keywords: ["simplified CDD", "low risk", "reduced verification", "SDD"]
      },
      {
        id: "aml-art-18",
        title: "Article 18 - Enhanced due diligence",
        summary: "EDD required for high-risk situations: complex transactions, PEPs, high-risk countries. Includes obtaining senior management approval and enhanced monitoring.",
        relevance: "When enhanced verification is mandatory. Additional measures for high-risk customers and transactions.",
        officialLink: "https://eur-lex.europa.eu/eli/dir/2018/843/oj#d1e1899-1-1",
        keywords: ["EDD", "enhanced due diligence", "high risk", "PEP", "senior management"]
      },
      {
        id: "aml-art-20",
        title: "Article 20 - Politically Exposed Persons",
        summary: "PEPs and their family/associates require: senior management approval, source of wealth/funds determination, and enhanced ongoing monitoring.",
        relevance: "Specific requirements for PEP customers. Must screen against PEP lists and apply enhanced measures.",
        officialLink: "https://eur-lex.europa.eu/eli/dir/2018/843/oj#d1e2037-1-1",
        keywords: ["PEP", "politically exposed person", "source of wealth", "enhanced monitoring"]
      },
      {
        id: "aml-art-33",
        title: "Article 33 - Suspicious transaction reporting",
        summary: "Obliged entities must promptly report suspicions of money laundering or terrorist financing to the Financial Intelligence Unit (FIU).",
        relevance: "Duty to report suspicious activity. Systems must flag unusual patterns for review and reporting.",
        officialLink: "https://eur-lex.europa.eu/eli/dir/2018/843/oj#d1e2641-1-1",
        keywords: ["STR", "suspicious transaction", "FIU", "reporting", "SAR"]
      },
      {
        id: "aml-art-40",
        title: "Article 40 - Record keeping",
        summary: "Must retain CDD documentation and transaction records for at least 5 years after end of business relationship. Must be available to competent authorities.",
        relevance: "Data retention requirements. Identity records must be kept for minimum 5 years post-relationship.",
        officialLink: "https://eur-lex.europa.eu/eli/dir/2018/843/oj#d1e2837-1-1",
        keywords: ["record keeping", "retention", "5 years", "documentation", "audit trail"]
      },
      {
        id: "aml-art-46",
        title: "Article 46 - Sanctions screening",
        summary: "Member States must ensure obliged entities screen against UN, EU, and national sanctions lists. Transactions with sanctioned parties must be blocked.",
        relevance: "Mandatory sanctions screening. Must check all customers against current sanctions lists.",
        officialLink: "https://eur-lex.europa.eu/eli/dir/2018/843/oj#d1e3114-1-1",
        keywords: ["sanctions", "screening", "OFAC", "UN sanctions", "EU sanctions", "blocked parties"]
      }
    ]
  },
  {
    id: "eu-ai-act",
    name: "EU AI Act",
    fullName: "Artificial Intelligence Act",
    description: "EU regulation establishing harmonized rules for artificial intelligence, with specific requirements for high-risk AI systems including those used for identity verification and biometrics.",
    officialLink: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj",
    articles: [
      {
        id: "ai-art-3",
        title: "Article 3 - Definitions",
        summary: "Defines AI system, provider, deployer, biometric identification, real-time remote biometric identification, and other key terms for the regulation.",
        relevance: "Essential definitions. Identity verification AI likely falls under biometric categorization or emotion recognition definitions.",
        officialLink: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj#d1e1874-1-1",
        keywords: ["AI system", "definitions", "biometric identification", "provider", "deployer"]
      },
      {
        id: "ai-art-5",
        title: "Article 5 - Prohibited AI practices",
        summary: "Prohibits: social scoring, exploitation of vulnerabilities, real-time remote biometric identification in public spaces (with exceptions), emotion inference in workplace/education.",
        relevance: "Certain biometric uses are banned. Real-time public biometric ID restricted. Emotion recognition limited.",
        officialLink: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj#d1e2104-1-1",
        keywords: ["prohibited", "social scoring", "biometric", "emotion recognition", "banned practices"]
      },
      {
        id: "ai-art-6",
        title: "Article 6 - Classification of high-risk AI systems",
        summary: "AI systems are high-risk if: used as safety component of regulated product, OR listed in Annex III (includes biometric identification and critical infrastructure).",
        relevance: "Identity verification AI is explicitly high-risk under Annex III. All high-risk requirements apply.",
        officialLink: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj#d1e2298-1-1",
        keywords: ["high-risk", "classification", "Annex III", "safety component", "regulated product"]
      },
      {
        id: "ai-art-9",
        title: "Article 9 - Risk management system",
        summary: "High-risk AI requires risk management: identify risks, estimate and evaluate risks, adopt risk mitigation measures, test effectiveness, and maintain throughout lifecycle.",
        relevance: "Must implement ongoing risk management for identity verification AI. Document risks and mitigations.",
        officialLink: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj#d1e2576-1-1",
        keywords: ["risk management", "risk assessment", "mitigation", "lifecycle", "continuous"]
      },
      {
        id: "ai-art-10",
        title: "Article 10 - Data and data governance",
        summary: "Training data must be relevant, representative, free of errors, and complete. Data governance must address: design choices, collection, preparation, labeling, and bias examination.",
        relevance: "Training data for identity AI must be properly governed. Bias in identity verification is a key concern.",
        officialLink: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj#d1e2680-1-1",
        keywords: ["data governance", "training data", "bias", "representative", "data quality"]
      },
      {
        id: "ai-art-11",
        title: "Article 11 - Technical documentation",
        summary: "High-risk AI must have technical documentation demonstrating compliance, including: system description, design, development process, monitoring, and conformity assessment info.",
        relevance: "Must document how identity verification AI was built and how it complies with requirements.",
        officialLink: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj#d1e2810-1-1",
        keywords: ["technical documentation", "compliance documentation", "system description", "design"]
      },
      {
        id: "ai-art-12",
        title: "Article 12 - Record-keeping",
        summary: "High-risk AI must automatically record logs enabling monitoring of operation, identification of risks, and investigation of incidents. Logs must be retained.",
        relevance: "All identity verification decisions must be logged. Audit trail for AI decisions is mandatory.",
        officialLink: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj#d1e2891-1-1",
        keywords: ["logging", "record-keeping", "audit trail", "automatic recording", "monitoring"]
      },
      {
        id: "ai-art-13",
        title: "Article 13 - Transparency and information to deployers",
        summary: "High-risk AI must be transparent: clear instructions for use, capabilities, limitations, intended purpose, accuracy metrics, and potential risks.",
        relevance: "Must provide clear documentation about identity AI capabilities and limitations to users/deployers.",
        officialLink: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj#d1e2949-1-1",
        keywords: ["transparency", "instructions", "capabilities", "limitations", "accuracy"]
      },
      {
        id: "ai-art-14",
        title: "Article 14 - Human oversight",
        summary: "High-risk AI must enable human oversight: understand capabilities, monitor operation, interpret outputs, decide when not to use, intervene or stop operation.",
        relevance: "Humans must be able to oversee and override identity verification AI. Cannot be fully automated for high-risk decisions.",
        officialLink: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj#d1e3055-1-1",
        keywords: ["human oversight", "human-in-the-loop", "intervention", "override", "monitoring"]
      },
      {
        id: "ai-art-15",
        title: "Article 15 - Accuracy, robustness and cybersecurity",
        summary: "High-risk AI must achieve appropriate accuracy, be robust against errors and attempts to alter outputs, and implement cybersecurity measures against manipulation.",
        relevance: "Identity verification AI must be accurate, resistant to attacks (adversarial examples, spoofing), and secure.",
        officialLink: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj#d1e3149-1-1",
        keywords: ["accuracy", "robustness", "cybersecurity", "adversarial", "manipulation resistance"]
      },
      {
        id: "ai-art-26",
        title: "Article 26 - Obligations of deployers",
        summary: "Deployers must: use AI according to instructions, ensure human oversight, monitor operation, keep logs, inform affected individuals, and conduct impact assessments where required.",
        relevance: "When using third-party identity AI, deployers have their own compliance obligations.",
        officialLink: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj#d1e3891-1-1",
        keywords: ["deployer obligations", "monitoring", "impact assessment", "instructions for use"]
      },
      {
        id: "ai-art-50",
        title: "Article 50 - Transparency for certain AI systems",
        summary: "Users must be informed when interacting with AI (chatbots), when content is AI-generated (deepfakes), or when biometric categorization/emotion recognition is used.",
        relevance: "Must inform users when AI is used for identity verification. Biometric AI requires transparency notice.",
        officialLink: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj#d1e5199-1-1",
        keywords: ["transparency", "disclosure", "AI interaction", "biometric notice", "user information"]
      },
      {
        id: "ai-annex-iii",
        title: "Annex III - High-risk AI systems (point 1)",
        summary: "Biometric identification and categorization of natural persons is explicitly listed as high-risk. Includes remote biometric identification systems.",
        relevance: "Identity verification using biometrics is definitively high-risk AI. All Chapter 2 requirements apply.",
        officialLink: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj#d1e6278-1-1",
        keywords: ["Annex III", "biometric", "high-risk list", "identification", "categorization"]
      }
    ]
  }
];

// Helper function to search across all regulations
export function searchRegulations(query: string): Article[] {
  const lowerQuery = query.toLowerCase();
  const results: Article[] = [];

  for (const framework of regulations) {
    for (const article of framework.articles) {
      const searchText = `${article.title} ${article.summary} ${article.relevance} ${article.keywords.join(" ")}`.toLowerCase();
      if (searchText.includes(lowerQuery)) {
        results.push({ ...article, id: `${framework.id}:${article.id}` });
      }
    }
  }

  return results;
}

// Helper function to get article by ID
export function getArticle(frameworkId: string, articleId: string): Article | undefined {
  const framework = regulations.find(f => f.id === frameworkId);
  return framework?.articles.find(a => a.id === articleId);
}

// Helper function to get framework by ID
export function getFramework(frameworkId: string): Framework | undefined {
  return regulations.find(f => f.id === frameworkId);
}
