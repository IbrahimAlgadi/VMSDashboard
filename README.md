# CCTV Camera Dashboard

Bootstrap VMS Dashboard for ATM CCTV Monitoring System

## Tech Stack

- **Backend**: Express.js
- **Template Engine**: Nunjucks
- **UI Framework**: Bootstrap 5.3
- **Icons**: Bootstrap Icons
- **Charts**: Apache ECharts (to be added)
- **Maps**: Leaflet (to be added)
- **Testing**: Playwright

## Project Structure

```
├── server.js              # Express server
├── package.json           # Dependencies
├── views/                 # Nunjucks templates
│   ├── layout.njk        # Base layout
│   └── dashboard.njk     # Dashboard page
├── public/                # Static files
│   ├── css/              # Stylesheets
│   ├── js/               # JavaScript files
│   └── images/           # Images
├── data/                  # Mock data (JSON)
├── tests/                 # Playwright tests
└── tasks/                 # Task definitions

```

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

Server will run on http://localhost:3000

### 3. Run Tests

```bash
# Run all tests
npm test

# Run tests with browser visible
npm run test:headed
```

## Available Routes

- `/` - Dashboard (homepage)
- `/nvr-management` - NVR Management
- `/camera-management` - Camera Management
- `/map` - Location Map
- `/compliance` - Compliance Dashboard
- `/security` - Security Monitoring
- `/analytics` - Analytics
- `/alerts` - Alerts Management
- `/reports` - Reports
- `/settings` - Settings
- `/profile` - User Profile
- `/login` - Login Page
- `/styleguide` - Component Style Guide

## Development

### Task Progress

- ✅ Task 01: Foundation (Express + Nunjucks + Base Layout)
- ⏳ Task 02-30: In Progress...

See `tasks/` directory for detailed task definitions.

## License

MIT

