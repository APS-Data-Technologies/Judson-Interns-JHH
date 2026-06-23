# Copper Dome Concierge Project Scope Summary

## Project Purpose

Copper Dome Concierge is a validation prototype for a shared dining concierge experience. The goal is to confirm whether patrons engage with a digital concierge, use AI recommendations, and change behavior before investing in a full production build.

## What is in scope

- Patron-facing React PWA for menu browsing, concierge chat, and service requests.
- Django REST backend with event logging and API endpoints.
- PostgreSQL data storage for menu, requests, and instrumentation.
- Server-side Claude API proxy for grounded AI concierge responses.
- Real-time staff feed via Django Channels.
- Simulated checkout, mock loyalty display, and no real payment processing in Phase 1.
- Event-level analytics for engagement metrics and trial validation.

## Key Features

### Patron PWA

- QR-to-table entry
- Unified three-kitchen menu browse
- Add-to-cart and mock checkout flow
- Display-only loyalty balance

### AI Concierge

- Grounded in menu data
- Recommendations, pairings, and dietary guidance
- Server-side Claude API integration only

### Service Requests

- Request actions such as call server, water, check, and surprise me
- Real-time posting to staff/floor view

### Staff / Floor View

- Live request feed
- Table status and request handling support

### Instrumentation & Analytics

- Event logging for menu views, concierge interactions, AI queries, request types, and mock checkout
- Analytics dashboard for engagement metrics

## Milestones

### Onboarding Week (Jun 18 - Jun 24)

- Confirm scope, team roles, and high-level architecture
- Lock event schema and UX flows
- Set up repo, branching, and environment plan
- Prepare backlog and sprint plan

### Milestone 1: Foundation & Patron PWA (Jun 25 - Jul 8)

- Backend models for menu, venue, kitchen, and events
- Event logging endpoint
- Patron PWA shell with QR entry, menu browse, cart, and mock checkout
- Initial installable PWA experience

### Milestone 2: Concierge, Real-Time & Analytics (Jul 9 - Jul 22)

- Server-side Claude proxy with menu grounding
- Django Channels staff feed and live request updates
- Full instrumentation for all event types
- Analytics view and dashboard support

### Live Trial (Jul 23 - Jul 31)

- Supervised trial run in one venue
- Real patron opt-in and event capture
- Staff response validation
- Small, supervised rollout to avoid impact on live service

### Final Wrap-Up (Aug 1 - Aug 7)

- Trial data analysis
- Findings memo and proceed/do-not-proceed recommendation
- Documentation and presentation materials
- Final demo and retrospective

## Success Criteria

- Menu-grounded AI concierge is more useful than menu-only browsing
- Service requests reach staff feed within ~2 seconds
- All defined event types fire correctly end to end
- Trial produces engagement data and a clear recommendation
