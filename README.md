# Judson-Interns-JHH

Repository for the Judson Internship Project - Summer 2026.

This repository currently hosts the Copper Dome Concierge validation scaffold under `JH-Interns-CopperDome/`.

## Project Overview

The Copper Dome Concierge scaffold is a demo-ready validation prototype for a shared dining concierge experience. It is built as a React PWA frontend, Django REST backend, and PostgreSQL database, with a Docker Compose local development setup.

## Project Goals

- Validate whether patrons engage with a digital concierge.
- Deliver a menu-grounded AI concierge experience.
- Capture event-level engagement data.
- Provide a real-time staff request feed.
- Keep checkout, loyalty, and payments mock/simulated in phase 1.

## Technical Scope

- **Frontend:** React PWA for patron interactions.
- **Backend:** Django REST Framework with Django Channels for real-time updates.
- **Database:** PostgreSQL for menu, requests, and event logging.
- **Local Dev:** Docker Compose for frontend, backend, and database services.

## Repository Structure

```
Judson-Interns-JHH/
├── README.md
└── JH-Interns-CopperDome/
    ├── README.md
    ├── docker-compose.yml
    ├── backend/
    ├── frontend/
    ├── database/
    ├── docs/
    └── scripts/
```

## Notes

- The root README provides a top-level summary of the repository and current scaffold.
- Detailed scaffold instructions are available inside `JH-Interns-CopperDome/README.md`.
- To run the Copper Dome scaffold locally:
  ```bash
  cd JH-Interns-CopperDome
  docker compose up --build
  ```
