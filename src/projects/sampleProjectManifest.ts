import smallMeta from '@/../sample-projects/small-site/project.meta.json'
import hotelMeta from '@/../sample-projects/hotel-meridian/project.meta.json'
import smallGraphData from '@/../product/sections/project-graph/data.json'
import hotelGraphData from '@/../product/sections/project-graph/data.code-large-complicated.json'
import sharedIntelligenceIndexRaw from '@/features/project-intelligence/data/project-intelligence.json?raw'
import bookingFlowMarkdown from '@/features/project-intelligence/data/booking-flow.md?raw'
import guestDiscoveryMarkdown from '@/features/project-intelligence/data/guest-discovery.md?raw'
import loyaltyProgramMarkdown from '@/features/project-intelligence/data/loyalty-program.md?raw'
import pmsIntegrationMarkdown from '@/features/project-intelligence/data/pms-integration.md?raw'
import retailMarkdown from '@/features/project-intelligence/data/retail.md?raw'
import staffOperationsMarkdown from '@/features/project-intelligence/data/staff-operations.md?raw'

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

const SHARED_INTELLIGENCE_DOCS: Record<string, string> = {
  'booking-flow.md': bookingFlowMarkdown,
  'guest-discovery.md': guestDiscoveryMarkdown,
  'loyalty-program.md': loyaltyProgramMarkdown,
  'pms-integration.md': pmsIntegrationMarkdown,
  'retail.md': retailMarkdown,
  'staff-operations.md': staffOperationsMarkdown,
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
    intelligenceIndexRaw: sharedIntelligenceIndexRaw,
    intelligenceDocsRaw: SHARED_INTELLIGENCE_DOCS,
  },
  {
    id: hotelMeta.id,
    name: hotelMeta.name,
    description: hotelMeta.description,
    domain: hotelMeta.domain,
    views: hotelMeta.views,
    graphData: hotelGraphData as ProjectGraphPayload,
    codeNavigationData: hotelGraphData as ProjectGraphPayload,
    intelligenceIndexRaw: sharedIntelligenceIndexRaw,
    intelligenceDocsRaw: SHARED_INTELLIGENCE_DOCS,
  },
]

export function getSampleProjectManifestEntry(projectId: string): SampleProjectManifestEntry | undefined {
  return SAMPLE_PROJECT_MANIFEST.find((entry) => entry.id === projectId)
}
