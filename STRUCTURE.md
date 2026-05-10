# Project Structure — DockSurgeon

```
docksurgeon/
│
├── README.md
├── ARCHITECTURE.md
├── ROADMAP.md
├── CONTRIBUTING.md
│
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── components.json          ← shadcn/ui config
├── .env.example
├── .gitignore
│
├── Dockerfile               ← production image
├── docker-compose.yml       ← for manual installs
├── install.sh               ← curl | bash install script
│
├── .github/
│   └── workflows/
│       ├── publish.yml      ← build + push to GHCR on main
│       └── ci.yml           ← lint + type check on PRs
│
├── public/
│   ├── favicon.ico
│   └── logo.svg
│
├── src/
│   │
│   ├── middleware.ts         ← auth guard (redirect /login if no session)
│   │
│   ├── app/
│   │   ├── layout.tsx        ← root layout (fonts, theme provider)
│   │   ├── globals.css
│   │   │
│   │   ├── (auth)/           ← unauthenticated pages (no sidebar)
│   │   │   ├── login/
│   │   │   │   └── page.tsx  ← email + password login
│   │   │   └── setup/
│   │   │       └── page.tsx  ← first-run wizard
│   │   │
│   │   ├── (dashboard)/      ← authenticated pages (with sidebar)
│   │   │   ├── layout.tsx    ← sidebar + topbar shell
│   │   │   │
│   │   │   ├── page.tsx              ← /  Overview (disk donut + quick actions)
│   │   │   ├── storage/
│   │   │   │   └── page.tsx          ← /storage  Treemap + breakdown
│   │   │   ├── cleanup/
│   │   │   │   └── page.tsx          ← /cleanup  Cleanup center + preview
│   │   │   ├── images/
│   │   │   │   └── page.tsx          ← /images   Image list + sizes
│   │   │   ├── containers/
│   │   │   │   └── page.tsx          ← /containers  Container list + status
│   │   │   ├── volumes/
│   │   │   │   └── page.tsx          ← /volumes  Volume list + sizes
│   │   │   ├── logs/
│   │   │   │   └── page.tsx          ← /logs  Container log viewer (SSE)
│   │   │   └── settings/
│   │   │       └── page.tsx          ← /settings  Change password, port, etc.
│   │   │
│   │   └── api/
│   │       ├── auth/
│   │       │   └── [...nextauth]/
│   │       │       └── route.ts      ← Auth.js handler
│   │       │
│   │       ├── setup/
│   │       │   ├── status/route.ts   ← GET  is setup complete?
│   │       │   └── complete/route.ts ← POST create first user
│   │       │
│   │       ├── storage/
│   │       │   ├── breakdown/route.ts ← GET full storage breakdown
│   │       │   ├── overlay2/route.ts  ← GET overlay2 directory analysis
│   │       │   └── system/route.ts    ← GET docker system df data
│   │       │
│   │       ├── cleanup/
│   │       │   ├── preview/route.ts   ← POST preview (no deletion)
│   │       │   ├── execute/route.ts   ← POST execute cleanup
│   │       │   └── history/route.ts   ← GET audit log
│   │       │
│   │       ├── images/
│   │       │   ├── route.ts           ← GET list images
│   │       │   └── [id]/route.ts      ← DELETE remove image
│   │       │
│   │       ├── containers/
│   │       │   ├── route.ts           ← GET list containers
│   │       │   └── [id]/
│   │       │       ├── route.ts       ← DELETE remove stopped container
│   │       │       └── logs/route.ts  ← GET stream logs (SSE)
│   │       │
│   │       ├── volumes/
│   │       │   ├── route.ts           ← GET list volumes
│   │       │   └── [id]/route.ts      ← DELETE remove volume
│   │       │
│   │       └── system/
│   │           └── health/route.ts    ← GET CPU, RAM, disk, uptime
│   │
│   ├── components/
│   │   ├── ui/                        ← shadcn/ui primitives (button, card, etc.)
│   │   │
│   │   ├── layout/
│   │   │   ├── sidebar.tsx            ← nav sidebar
│   │   │   ├── topbar.tsx             ← disk usage bar + server info
│   │   │   └── theme-provider.tsx
│   │   │
│   │   ├── storage/
│   │   │   ├── storage-treemap.tsx    ← recharts treemap
│   │   │   ├── storage-donut.tsx      ← overview donut chart
│   │   │   ├── storage-breakdown.tsx  ← categorized list (images/volumes/etc.)
│   │   │   └── overlay2-view.tsx      ← overlay2 directory breakdown
│   │   │
│   │   ├── cleanup/
│   │   │   ├── cleanup-card.tsx       ← per-category cleanup option card
│   │   │   ├── cleanup-preview.tsx    ← preview drawer/modal
│   │   │   ├── cleanup-confirm.tsx    ← confirmation dialog
│   │   │   └── audit-log.tsx          ← history table
│   │   │
│   │   ├── containers/
│   │   │   ├── container-table.tsx
│   │   │   └── container-badge.tsx    ← running/stopped/exited status
│   │   │
│   │   ├── images/
│   │   │   └── image-table.tsx
│   │   │
│   │   ├── volumes/
│   │   │   └── volume-table.tsx
│   │   │
│   │   ├── logs/
│   │   │   ├── log-viewer.tsx         ← SSE log stream display
│   │   │   └── log-search.tsx
│   │   │
│   │   └── system/
│   │       ├── health-cards.tsx       ← CPU/RAM/disk/uptime cards
│   │       └── disk-bar.tsx           ← disk usage progress bar
│   │
│   ├── lib/
│   │   ├── docker.ts                  ← dockerode client singleton
│   │   ├── db.ts                      ← SQLite client + schema init
│   │   ├── auth.ts                    ← Auth.js config + CredentialsProvider
│   │   ├── system.ts                  ← df/du/uptime helpers
│   │   └── utils.ts                   ← formatBytes, cn, etc.
│   │
│   └── types/
│       ├── docker.ts                  ← typed Docker API responses
│       └── storage.ts                 ← storage breakdown types
│
└── scripts/
    └── db-reset.ts                    ← reset DB + clear first-run (dev helper)
```
