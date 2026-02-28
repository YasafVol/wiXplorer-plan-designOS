# Guest Discovery
<!-- id: guest-discovery -->
Shapes how prospective guests discover hotels, venues, and content before they begin a booking flow.
This intent zone optimizes first impression quality, content relevance, and findability across markets.

## Edit History
- 2026-02-11T09:30:00Z yasaf@wix.com - Initial intent framing
- 2026-02-16T10:20:00Z dev@wix.com - Expanded scope to venue discovery

---

## Property Pages
<!-- id: property-pages -->
Defines primary entry routes for hotel, experience, and journal surfaces. It ensures discovery content
is navigable with clean URL semantics and predictable rendering behavior.

### Hotels Router
<!-- id: hotels-router -->
<!-- type: router -->
Routes hotel detail pages by property slug and hydrates page-level data contracts for rendering.

#### Edit History
- 2026-02-16T10:40:00Z hook - Router inferred from route manifest

### Experiences Router
<!-- id: experiences-router -->
<!-- type: router -->
Routes experience detail pages with venue-aware context so discovery and booking transitions stay coherent.

#### Edit History
- 2026-02-16T10:40:00Z hook - Router inferred from route manifest

### Journal Router
<!-- id: journal-router -->
<!-- type: router -->
Routes editorial content pages that support SEO traffic and upper-funnel demand generation.

#### Edit History
- 2026-02-16T10:40:00Z hook - Router inferred from route manifest

---

## Availability Search
<!-- id: availability-search -->
Powers search-time discovery by combining property and room inventory context. It helps guests move from
browsing to intent with clear filters and accurate stock representation.

### Hotels
<!-- id: hotels-collection -->
<!-- type: collection -->
Stores property-level attributes used for listing, filtering, and discovery card rendering.

#### Edit History
- 2026-02-16T10:42:00Z dev@wix.com - Added filter context

### Rooms
<!-- id: rooms-collection -->
<!-- type: collection -->
Stores room-level attributes that enable availability and occupancy-aware search results.

#### Edit History
- 2026-02-16T10:43:00Z hook - Collection profile generated

### AvailabilityLibrary
<!-- id: availability-library -->
<!-- type: function-library -->
Shared site library that normalizes search parameters and combines data for instant availability output.

#### Edit History
- 2026-02-16T10:58:00Z hook - Utility role inferred from imports

---

## Editorial Content
<!-- id: editorial-content -->
Supports campaign storytelling and destination education that influence high-consideration bookings.
The cluster links content quality to search visibility and assisted conversion.

### JournalPosts
<!-- id: journal-collection -->
<!-- type: collection -->
Stores long-form editorial content and structured metadata for publication and distribution workflows.

#### Edit History
- 2026-02-16T10:48:00Z hook - Collection profile generated

### SeoLibrary
<!-- id: seo-function-library -->
<!-- type: function-library -->
Computes canonical metadata and structured snippets so discovery pages remain competitive in search results.

#### Edit History
- 2026-02-16T10:55:00Z hook - SEO helper detected

### PropertyContext
<!-- id: property-context -->
<!-- type: context -->
Shares currently selected property state across discovery surfaces to keep messaging and content aligned.

#### Edit History
- 2026-02-16T10:57:00Z dev@wix.com - Added cross-surface state language

---

## Venue Discovery
<!-- id: venue-discovery -->
Supports corporate and event-oriented discovery journeys where venue fit and package details matter.
This cluster bridges hospitality inventory and experience-oriented merchandising.

### Experiences
<!-- id: experiences-collection -->
<!-- type: collection -->
Stores curated experiences linked to venues and hotels for cross-sell discovery.

#### Edit History
- 2026-02-16T10:46:00Z dev@wix.com - Added cross-sell context

### Venues
<!-- id: venues-collection -->
<!-- type: collection -->
Stores venue inventory and capacity metadata used by sales and event funnels.

#### Edit History
- 2026-02-16T10:50:00Z hook - Collection profile generated
