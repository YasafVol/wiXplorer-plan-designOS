# Guest Discovery
<!-- id: guest-discovery -->

The entry point for everything a prospective guest sees before they decide to book. Guest Discovery covers how Meridian presents its 14 properties to the world — the property pages, the room browsing experience, the travel journal, the venue listings, and the availability search that bridges browsing and booking. This is the highest-traffic zone on the site and the primary driver of booking intent.

## Edit History
- 2026-02-10T09:00:00Z hook — Intent zone created by agent during initial project scaffold
- 2026-02-14T11:20:00Z yasaf@wix.com — Updated description to emphasize booking intent as the outcome

---

## Property Pages
<!-- id: property-pages -->

The core presentation layer for each of Meridian's 14 properties. Each property page is a dynamic route resolved by the hotels router, pre-fetched from the Hotels and Rooms collections, and rendered with property-specific branding via the Property Context. This feature covers everything from the hero section to the room grid to the local experiences sidebar.

### hotels-router
<!-- id: hotels-router -->
<!-- type: router -->

Intercepts all requests to `/hotels/[slug]`. Looks up the property slug in the Hotels collection, pre-fetches room types from the Rooms collection and a live availability summary from AvailabilityCache, and passes the assembled property data to the page before it renders. If the slug does not match any active property record, returns a 404. This is the first thing that runs on every property page load — if it fails, nothing on the page works.

#### Edit History
- 2026-02-10T09:00:00Z hook — Description auto-generated from import graph
- 2026-02-15T10:30:00Z dev@wix.com — Clarified 404 behavior

### hotels-collection
<!-- id: hotels-collection -->
<!-- type: collection -->

The master record for all 14 Meridian properties. Each row is one property with fields for name, slug, region, currency, hero video URL, amenity list, sustainability certifications, GPS coordinates, and the accent color token used for property-specific branding. Managed by the content team through the CMS dashboard. Read by the hotels router, the property context, and the availability search page.

#### Edit History
- 2026-02-10T09:00:00Z hook — Description auto-generated from import graph

### rooms-collection
<!-- id: rooms-collection -->
<!-- type: collection -->

Room types for every property. Each row represents one room category at one property — type name, base rate, capacity, image gallery, features list, and a link to the parent property record. Managed by the content team. Read by the hotels router during page pre-fetch and by the pricing action when calculating live rates.

#### Edit History
- 2026-02-10T09:00:00Z hook — Description auto-generated from import graph

### property-context
<!-- id: property-context -->
<!-- type: context -->

Holds the full resolved property record for the current `/hotels/[slug]` page — name, region, accent color token, amenity list, and current availability summary. Bound in the Editor to every element on the property page that needs to know which property it is rendering: the hero video source, the amenities repeater, the CSS accent color variable, and the availability widget's property ID parameter. The entire property page is driven by this single context object.

#### Edit History
- 2026-02-10T09:00:00Z hook — Description auto-generated from import graph
- 2026-02-16T14:10:00Z yasaf@wix.com — Added note about CSS accent color binding

### seo-function-library
<!-- id: seo-function-library -->
<!-- type: function-library -->

Generates and injects schema.org structured data for all dynamic CMS pages. Bound in the Editor to the page head of property pages, experience pages, journal articles, and shop products. Produces Hotel, LodgingBusiness, Product, and BlogPosting schema types from the resolved CMS record data. Called on every dynamic page load via the Editor's onReady binding. Without this, Meridian's dynamic pages have no structured data for search engines.

#### Edit History
- 2026-02-10T09:00:00Z hook — Description auto-generated from import graph

---

## Availability Search
<!-- id: availability-search -->

The unified search experience at `/booking/search` where guests enter dates, guest count, and optionally a region to find available rooms across all 14 properties. This feature bridges Guest Discovery and Booking Flow — it is the moment a browsing guest becomes a booking guest. The search reads from AvailabilityCache and hands off to the Wix Bookings checkout flow.

### availability-library
<!-- id: availability-library -->
<!-- type: function-library -->

Bound in the Editor to the availability calendar and room grid on property pages and the search results page. Exposes `getRoomAvailabilityStatus()` bound to the color state of each date cell in the calendar, `filterAvailableRooms()` bound to the room repeater's dataset filter, and `getEarliestAvailableDate()` bound to a helper text element below the date picker. Translates raw availability data from AvailabilityCache into display-ready states that the Editor elements can consume directly.

#### Edit History
- 2026-02-10T09:00:00Z hook — Description auto-generated from import graph

---

## Editorial Content
<!-- id: editorial-content -->

Meridian's travel journal — a content marketing layer of articles, destination guides, and property stories authored by the Meridian content team. Each article is a dynamic CMS page with full SEO metadata. Articles are linked contextually from property pages and from the homepage. This feature drives organic search traffic and supports the brand's positioning as a luxury travel authority.

### journal-router
<!-- id: journal-router -->
<!-- type: router -->

Intercepts all requests to `/journal/[slug]`. Resolves the article from the Journal collection, pre-fetches any linked property records for the contextual sidebar, and injects the article's SEO metadata into the page head before rendering. Handles 404 gracefully if the slug does not match an active article.

#### Edit History
- 2026-02-10T09:00:00Z hook — Description auto-generated from import graph

### journal-collection
<!-- id: journal-collection -->
<!-- type: collection -->

All travel journal articles. Fields: title, slug, body (rich text), author, publication date, hero image, property tags (links to Hotels collection), and SEO fields (meta title, meta description, Open Graph image). Managed exclusively by the content team. Read by the journal router and the journal listing page.

#### Edit History
- 2026-02-10T09:00:00Z hook — Description auto-generated from import graph

---

## Venue Discovery
<!-- id: venue-discovery -->

How prospective event clients find and inquire about Meridian's event spaces — ballrooms, outdoor terraces, and private dining rooms across the 14 properties. Each venue has a dedicated page with capacity, layout options, and a Wix Forms inquiry form that routes to the sales team. This feature feeds the Venue CRM in Staff Operations.

### experiences-router
<!-- id: experiences-router -->
<!-- type: router -->

Intercepts requests to `/experiences/[slug]` and `/venues/[slug]`. Resolves the experience or venue record, looks up the linked Wix Bookings service ID for experiences, and pre-fetches available time slots. For venues, pre-fetches the property record for the sidebar and attaches the venue's inquiry form configuration. Redirects to the listing page with a graceful message if the linked Bookings service is inactive.

#### Edit History
- 2026-02-10T09:00:00Z hook — Description auto-generated from import graph
- 2026-02-17T09:45:00Z dev@wix.com — Clarified that this router handles both experiences and venues

### experiences-collection
<!-- id: experiences-collection -->
<!-- type: collection -->

Curated activities and experiences bookable through Wix Bookings. Each row is one experience linked to a property, with a description, images, duration, and a Wix Bookings service ID reference. Managed by the content team. Read by the experiences router.

#### Edit History
- 2026-02-10T09:00:00Z hook — Description auto-generated from import graph

### venues-collection
<!-- id: venues-collection -->
<!-- type: collection -->

Event spaces across all properties. Fields: name, slug, property link, capacity, available layout configurations (banquet, theatre, boardroom), catering availability flag, images, and a description. Managed by the content team. Read by the experiences router and the venue listing page. Each venue record links to a Wix Forms inquiry form configuration.

#### Edit History
- 2026-02-10T09:00:00Z hook — Description auto-generated from import graph
