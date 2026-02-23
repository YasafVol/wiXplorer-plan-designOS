import { createBrowserRouter } from 'react-router-dom'
import { ProductPage } from '@/components/ProductPage'
import { DataShapePage } from '@/components/DataShapePage'
import { DesignPage } from '@/components/DesignPage'
import { SectionsPage } from '@/components/SectionsPage'
import { SectionPage } from '@/components/SectionPage'
import { ScreenDesignPage, ScreenDesignFullscreen } from '@/components/ScreenDesignPage'
import { ShellDesignPage, ShellDesignFullscreen } from '@/components/ShellDesignPage'
import { ExportPage } from '@/components/ExportPage'
import { ProjectsPage } from '@/components/ProjectsPage'
import { ProjectGraphPage } from '@/components/ProjectGraphPage'
import { ProjectInventoryPage } from '@/components/ProjectInventoryPage'

export const router = createBrowserRouter([
  // wiXplorer — main app
  {
    path: '/',
    element: <ProjectsPage />,
  },
  {
    path: '/projects/:projectId',
    element: <ProjectGraphPage />,
  },
  {
    path: '/projects/:projectId/inventory',
    element: <ProjectInventoryPage />,
  },
  // Design OS — planning tool
  {
    path: '/design-os',
    element: <ProductPage />,
  },
  {
    path: '/design-os/data-shape',
    element: <DataShapePage />,
  },
  {
    path: '/design-os/design',
    element: <DesignPage />,
  },
  {
    path: '/design-os/sections',
    element: <SectionsPage />,
  },
  {
    path: '/design-os/sections/:sectionId',
    element: <SectionPage />,
  },
  {
    path: '/design-os/sections/:sectionId/screen-designs/:screenDesignName',
    element: <ScreenDesignPage />,
  },
  {
    path: '/design-os/sections/:sectionId/screen-designs/:screenDesignName/fullscreen',
    element: <ScreenDesignFullscreen />,
  },
  {
    path: '/design-os/shell/design',
    element: <ShellDesignPage />,
  },
  {
    path: '/design-os/shell/design/fullscreen',
    element: <ShellDesignFullscreen />,
  },
  {
    path: '/design-os/export',
    element: <ExportPage />,
  },
])
