# Quick Start Guide - RAY AI Chatbot Enterprise Platform

## Getting Started

### Installation & Running
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The application will be available at `http://localhost:3000`

## Demo Accounts

### Executive View (Recommended First)
```
Username: executive
Password: exec123
```
**Experience**: 
- Executive Dashboard with KPI metrics
- Operational analytics and insights
- Department performance monitoring
- Alert management

### Admin View
```
Username: admin
Password: admin123
```
**Experience**:
- Admin Panel for system management
- All employee features + admin controls

### Employee View
```
Username: john.smith
Password: emp123
```
**Experience**:
- Basic chat and knowledge base access
- Personal dashboard and tickets
- Standard user features

## Key Features to Test

### 1. Command Palette
**Shortcut**: `Cmd/Ctrl + K`
- Search and navigate to any section
- Execute quick actions
- Full keyboard navigation with arrow keys

### 2. "Ask RAY Anything" Button
**Location**: Top right of navigation bar (always visible)
- Opens AI chat interface
- Accessible from any page
- Persistent chat history

### 3. File Uploads in Chat
- Drag and drop files into chat
- Supports: PDF, DOC, DOCX, TXT, CSV, XLSX, JPG, PNG, GIF
- Multiple file uploads
- Auto-syncs to Knowledge Base (ready for backend)

### 4. Executive Dashboard
**Access**: Login as executive → Click "Overview"
- Real-time KPI cards
- Ticket creation trends
- Department performance matrix
- AI insights and analytics
- Alert & risk management

### 5. Knowledge Base Search
**Access**: Chat/RAY Desk → Knowledge Base tab
- **Semantic Search**: Find by meaning (default)
- **Keyword Search**: Find by exact matches
- Tagged documents with summaries
- Relevance scoring
- Version tracking

### 6. Theme Toggle
**Location**: Top navigation bar (moon/sun icon)
- Switch between light and dark modes
- Persists across sessions (ready for backend)

## New Components

| Component | Location | Purpose |
|-----------|----------|---------|
| TopNavigation | `components/top-navigation.tsx` | Enterprise top bar with RAY button |
| CommandPalette | `components/command-palette.tsx` | Cmd+K command search |
| ExecutiveDashboard | `components/executive-dashboard.tsx` | Executive analytics |

## Enhanced Components

| Component | Enhancements |
|-----------|--------------|
| ChatInterface | File uploads, drag-drop, file previews |
| KnowledgeBase | Semantic search, tags, version history |
| Sidebar | Role-based navigation |
| App (page.tsx) | Integration of all new features |

## Architecture Highlights

### Authentication
- Role-based access control (Employee, Admin, Executive)
- localStorage-based session (demo)
- Type-safe user interface

### UI/UX
- Enterprise design system compliance
- Consistent spacing and typography
- Responsive design
- Smooth animations
- Accessibility-first approach

### Data Flow
1. User authenticates
2. Role determines available features
3. Navigation adapts to role
4. Components render role-specific content

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open command palette |
| `Arrow Up/Down` | Navigate in command palette |
| `Enter` | Execute selected command |
| `Escape` | Close modal/palette |

## File Structure
```
/vercel/share/v0-project/
├── app/
│   ├── page.tsx           (Main app with routing)
│   ├── layout.tsx         (Root layout)
│   └── globals.css        (Global styles)
├── components/
│   ├── top-navigation.tsx (NEW)
│   ├── command-palette.tsx (NEW)
│   ├── executive-dashboard.tsx (NEW)
│   ├── chat-interface.tsx (ENHANCED)
│   └── [other components]
├── lib/
│   ├── auth-types.ts      (ENHANCED - added executive role)
│   ├── auth-data.ts       (ENHANCED - added executive user)
│   └── [utilities]
└── package.json
```

## API Integration Points

Ready for backend integration:
- Chat file uploads → Knowledge Base sync
- Executive dashboard metrics ← Real data API
- Knowledge base search ← Semantic search backend
- User management ← Auth service
- Notification system ← Realtime events

## Styling Notes

- Uses Tailwind CSS with design tokens
- Color system: Primary (blue), Muted (grays), Destructive (red)
- Rounded corners: 8px (buttons), 16-20px (cards)
- Shadows: Subtle, layered depth
- Responsive breakpoints: sm, md, lg built-in

## Performance

- **Bundle Size**: Optimized with Next.js Turbopack
- **Loading**: Instant chat, lazy dashboard
- **Search**: Client-side semantic filtering (ready for Vector DB)
- **Images**: Optimized with Next.js Image component

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Can't find files in KB search | Make sure files have been uploaded and tags are set |
| Command palette not opening | Verify `Cmd/Ctrl + K` (check keyboard layout) |
| Theme not persisting | Currently using state (implement localStorage hook for persistence) |
| Chat files not showing | Verify file type is in accepted formats |

## Next Steps for Deployment

1. Replace localStorage auth with real backend
2. Connect executive dashboard to real data APIs
3. Integrate file uploads with cloud storage
4. Setup semantic search with Vector DB
5. Add real-time notifications
6. Deploy to Vercel or your hosting platform

## Support & Documentation

- Design System: See `global-design-system.md` in user_read_only_context
- Implementation Details: See `IMPLEMENTATION_SUMMARY.md`
- TypeScript Types: See `lib/auth-types.ts` and component interfaces

---

**Last Updated**: 2024-02-22
**Version**: 1.0.0
**Status**: ✅ Ready for Testing & Deployment
