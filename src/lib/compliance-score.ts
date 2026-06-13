// Compliance score engine: computes a 0-100 DPDP Act 2023 readiness score from
// live platform signals. Add new checks here and they automatically factor into
// the score and the breakdown shown on the Overview dashboard — keep weights
// summing to 100.

export interface ComplianceCheckInput {
  widgetPublished: boolean
  hasConsentRecords: boolean
  purposeGroupsConfigured: boolean
  multiLanguageEnabled: boolean
  withdrawalAvailable: boolean
  vendorRegistryConfigured: boolean
  rightsRequestWorkflowEnabled: boolean
  cookieScanCompleted: boolean
}

export interface ComplianceCheckResult {
  id: string
  label: string
  description: string
  weight: number
  pass: boolean
  status: 'pass' | 'warn'
}

export interface ComplianceScoreResult {
  score: number
  breakdown: ComplianceCheckResult[]
}

export function computeComplianceScore(input: ComplianceCheckInput): ComplianceScoreResult {
  const checks: Omit<ComplianceCheckResult, 'status'>[] = [
    {
      id: 'widget_active',
      label: 'Consent Collection Active',
      description: 'Your consent widget is published and live on your website.',
      weight: 15,
      pass: input.widgetPublished,
    },
    {
      id: 'records_stored',
      label: 'Consent Records Stored',
      description: 'Consent decisions from visitors are being logged for audit.',
      weight: 15,
      pass: input.hasConsentRecords,
    },
    {
      id: 'purposes_configured',
      label: 'Purpose Categories Configured',
      description: 'Data processing purposes are defined in your widget configuration.',
      weight: 15,
      pass: input.purposeGroupsConfigured,
    },
    {
      id: 'multi_language',
      label: 'Multi-Language Enabled',
      description: 'Consent notices are available in multiple Indian languages.',
      weight: 10,
      pass: input.multiLanguageEnabled,
    },
    {
      id: 'withdrawal_available',
      label: 'Consent Withdrawal Available',
      description: 'Users have withdrawn consent at least once, confirming the option works.',
      weight: 10,
      pass: input.withdrawalAvailable,
    },
    {
      id: 'vendor_registry',
      label: 'Vendor Registry Configured',
      description: 'Third-party data processors and integrations are registered.',
      weight: 10,
      pass: input.vendorRegistryConfigured,
    },
    {
      id: 'rights_requests',
      label: 'Rights Request Workflow Enabled',
      description: 'A workflow exists for handling access, correction, deletion and nominee requests.',
      weight: 15,
      pass: input.rightsRequestWorkflowEnabled,
    },
    {
      id: 'cookie_scan',
      label: 'Cookie Scan Completed',
      description: 'Your website has been scanned for cookies and trackers.',
      weight: 10,
      pass: input.cookieScanCompleted,
    },
  ]

  const score = checks.reduce((sum, c) => sum + (c.pass ? c.weight : 0), 0)
  const breakdown: ComplianceCheckResult[] = checks.map((c) => ({
    ...c,
    status: c.pass ? 'pass' : 'warn',
  }))

  return { score, breakdown }
}
