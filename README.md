# MedTech Ops Assistant

AI-powered operations assistant for MedTech startups. Covers clinical trial management, regulatory strategy, grant writing, project management, stakeholder communications, event planning, and presentations — all with Claude AI integration. 

## Features

| Module | CRUD | AI Tools |
|--------|------|----------|
| **Clinical Trials** | Track trials, phases, sites | Study plan generator, Protocol synopsis drafter |
| **Regulatory** | Track submissions & milestones | Multi-market regulatory strategy, Gap analysis |
| **Grant Writing** | Track proposals & deadlines | Full proposal drafter, Text strengthener |
| **Projects** | Track all company projects | Work breakdown structure, Weekly status reports |
| **Stakeholders** | Manage NHS/MIT/Harvard contacts | Communication drafter, Power/interest mapping |
| **Events** | Track webinars, conferences | Full event planning with run-of-show |
| **Presentations** | — | Slide outlines with speaker notes, Talking points with Q&A prep |

## Quick Start (WSL / Linux / macOS)

### Prerequisites

- Node.js 18+ (`node -v` to check)
- An [Anthropic API key](https://console.anthropic.com/)

### Setup

```bash
# Clone the repo
git clone <your-repo-url>
cd medtech-ops-assistant

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env and add your Anthropic API key
nano .env   # or: code .env

# Start the server
npm start
```

Open **http://localhost:3000** in your browser.

### Development mode (auto-restart on changes)

```bash
npm run dev
```

## Running in WSL (Windows Subsystem for Linux)

If you're on Windows and want to run this in WSL:

```bash
# 1. Open WSL terminal (search "Ubuntu" or "WSL" in Start menu)

# 2. Navigate to your project (Windows drives are at /mnt/c/)
cd /mnt/c/Users/cw444/CascadeProjects/Claude\ 24032026/medtech-ops-assistant

# 3. Make sure Node.js is installed in WSL
node -v
# If not installed:
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 4. Install dependencies (in WSL)
npm install

# 5. Set up your .env
cp .env.example .env
nano .env
# Add: ANTHROPIC_API_KEY=sk-ant-your-key-here

# 6. Run it
npm start

# 7. Open http://localhost:3000 in your Windows browser
```

> **Tip:** WSL and Windows share `localhost`, so you can access the server from your Windows browser directly.

## Project Structure

```
medtech-ops-assistant/
├── public/              # Frontend (vanilla HTML/CSS/JS)
│   ├── index.html
│   ├── style.css
│   └── app.js
├── src/
│   ├── index.js         # Express server
│   ├── config.js        # Environment config
│   ├── data/            # JSON file storage (gitignored)
│   ├── routes/          # API routes per module
│   │   ├── clinical.js
│   │   ├── regulatory.js
│   │   ├── grants.js
│   │   ├── projects.js
│   │   ├── stakeholders.js
│   │   ├── events.js
│   │   └── presentations.js
│   └── services/
│       ├── ai.js        # Claude API wrapper
│       └── store.js     # JSON file-based persistence
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## API Endpoints

Each module has standard CRUD endpoints plus AI-powered generation:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/{module}` | List all items |
| POST | `/api/{module}` | Create item |
| PATCH | `/api/{module}/:id` | Update item |
| DELETE | `/api/{module}/:id` | Delete item |
| POST | `/api/{module}/ai/*` | AI generation |

## Tech Stack

- **Backend:** Node.js, Express
- **Frontend:** Vanilla HTML/CSS/JS (no build step)
- **AI:** Claude API via `@anthropic-ai/sdk`
- **Storage:** JSON files (no database needed)
- **Config:** dotenv

## License

This project is proprietary. You may not use, copy, modify, redistribute, deploy, or install it for commercial or client use without prior written permission.

Commercial licenses are available. For business use, professional installation, or deployment enquiries, contact me
