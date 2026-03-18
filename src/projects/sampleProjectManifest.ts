import smallMeta from '@/../sample-projects/small-site/project.meta.json'
import hotelMeta from '@/../sample-projects/hotel-meridian/project.meta.json'
import smallGraphData from '@/../product/sections/project-graph/data.json'
import hotelGraphData from '@/../product/sections/project-graph/data.code-large-complicated.json'
import smallIntelligenceIndexRaw from '@/../sample-projects/small-site/intelligence/project-intelligence.json?raw'
import smallBookingFlowMarkdown from '@/../sample-projects/small-site/intelligence/booking-flow.md?raw'
import smallGuestDiscoveryMarkdown from '@/../sample-projects/small-site/intelligence/guest-discovery.md?raw'
import smallLoyaltyProgramMarkdown from '@/../sample-projects/small-site/intelligence/loyalty-program.md?raw'
import smallPmsIntegrationMarkdown from '@/../sample-projects/small-site/intelligence/pms-integration.md?raw'
import smallRetailMarkdown from '@/../sample-projects/small-site/intelligence/retail.md?raw'
import smallStaffOperationsMarkdown from '@/../sample-projects/small-site/intelligence/staff-operations.md?raw'
import hotelIntelligenceIndexRaw from '@/../sample-projects/hotel-meridian/intelligence/project-intelligence.json?raw'
import hotelBookingFlowMarkdown from '@/../sample-projects/hotel-meridian/intelligence/booking-flow.md?raw'
import hotelGuestDiscoveryMarkdown from '@/../sample-projects/hotel-meridian/intelligence/guest-discovery.md?raw'
import hotelLoyaltyProgramMarkdown from '@/../sample-projects/hotel-meridian/intelligence/loyalty-program.md?raw'
import hotelPmsIntegrationMarkdown from '@/../sample-projects/hotel-meridian/intelligence/pms-integration.md?raw'
import hotelRetailMarkdown from '@/../sample-projects/hotel-meridian/intelligence/retail.md?raw'
import hotelStaffOperationsMarkdown from '@/../sample-projects/hotel-meridian/intelligence/staff-operations.md?raw'

export interface ProjectViewCapabilities {
  graph: boolean
  codeNavigation: boolean
  intelligence: boolean
}

export interface ProjectGraphPayload {
  project: { meta?: { domain?: string } }
  nodes: Array<{ type?: string }>
  edges: unknown[]
  alerts?: unknown[]
  layerFilters?: unknown[]
}

export interface SampleProjectManifestEntry {
  id: string
  name: string
  description: string
  domain: string
  views: ProjectViewCapabilities
  graphData: ProjectGraphPayload
  codeNavigationData: ProjectGraphPayload
  intelligenceIndexRaw: string
  intelligenceDocsRaw: Record<string, string>
}

const SMALL_SITE_INTELLIGENCE_DOCS: Record<string, string> = {
  'booking-flow.md': smallBookingFlowMarkdown,
  'guest-discovery.md': smallGuestDiscoveryMarkdown,
  'loyalty-program.md': smallLoyaltyProgramMarkdown,
  'pms-integration.md': smallPmsIntegrationMarkdown,
  'retail.md': smallRetailMarkdown,
  'staff-operations.md': smallStaffOperationsMarkdown,
}

const HOTEL_INTELLIGENCE_DOCS: Record<string, string> = {
  'booking-flow.md': hotelBookingFlowMarkdown,
  'guest-discovery.md': hotelGuestDiscoveryMarkdown,
  'loyalty-program.md': hotelLoyaltyProgramMarkdown,
  'pms-integration.md': hotelPmsIntegrationMarkdown,
  'retail.md': hotelRetailMarkdown,
  'staff-operations.md': hotelStaffOperationsMarkdown,
}

export const SAMPLE_PROJECT_MANIFEST: SampleProjectManifestEntry[] = [
  {
    id: smallMeta.id,
    name: smallMeta.name,
    description: smallMeta.description,
    domain: smallMeta.domain,
    views: smallMeta.views,
    graphData: smallGraphData as ProjectGraphPayload,
    // Temporary seed payload until dedicated small-site code-navigation data lands.
    codeNavigationData: hotelGraphData as ProjectGraphPayload,
    intelligenceIndexRaw: smallIntelligenceIndexRaw,
    intelligenceDocsRaw: SMALL_SITE_INTELLIGENCE_DOCS,
  },
  {
    id: hotelMeta.id,
    name: hotelMeta.name,
    description: hotelMeta.description,
    domain: hotelMeta.domain,
    views: hotelMeta.views,
    graphData: hotelGraphData as ProjectGraphPayload,
    codeNavigationData: hotelGraphData as ProjectGraphPayload,
    intelligenceIndexRaw: hotelIntelligenceIndexRaw,
    intelligenceDocsRaw: HOTEL_INTELLIGENCE_DOCS,
  },
]

export function getSampleProjectManifestEntry(projectId: string): SampleProjectManifestEntry | undefined {
  return SAMPLE_PROJECT_MANIFEST.find((entry) => entry.id === projectId)
}
