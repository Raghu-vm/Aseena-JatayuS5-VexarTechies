# RAY AI Assistant - Complete System Documentation

## System Overview

RAY is now a fully functional AI-powered ticketing and knowledge management system with integrated chatbot capabilities. The system operates without external dependencies by default, with optional n8n webhook support for advanced RAG queries.

## Key Features

### 1. Ticket Management System (RAY Desk)

**Location**: Sidebar → RAY Desk or accessible via `/ray-desk`

**Capabilities**:
- Create tickets with custom titles, descriptions, departments, and priority levels
- View all tickets in a filterable list
- Search tickets by ID or title
- Filter by status (Open, On Hold, In Progress, Closed) and department
- Update ticket status directly from the UI
- Delete tickets
- View detailed ticket information in side panel

**Sample Data**: 12 pre-loaded tickets across different statuses and departments

### 2. Chatbot Ticket Commands

The RAY chatbot can process tickets through natural language commands:

**Create Ticket**:
```
"Create ticket title: Bug in login system department: IT Support priority: high"
```

**Update Ticket Status**:
```
"Update ticket TKT-001 to closed"
"Close ticket TKT-002"
"Put TKT-003 on hold"
"Mark TKT-004 as in progress"
```

**Supported Status Changes**: `open`, `on-hold`, `in-progress`, `closed`

### 3. Employee Information Lookup

The chatbot can provide employee information when asked:

**Examples**:
```
"Tell me about John Smith"
"Who is the DevOps Engineer?"
"Employee in IT Support"
```

**Available Employees**: 7 sample employees with full profiles including:
- Name, email, phone
- Department and job title
- Professional biography

### 4. Knowledge Base & Audit Questions

Optional n8n webhook integration for regulatory and audit questions. If n8n is not available, the chatbot provides helpful fallback guidance.

### 5. UI Enhancements

- **New Chat Button**: Moved to top-right corner of chat area (previously in sidebar)
- **Sidebar Navigation**: Clean, organized with RAY Desk, Chat, Knowledge Base, Dashboard, and Settings
- **RAY Robot Mascot**: Positioned left-aligned in sidebar header with clear branding

## Data Persistence

All ticket data is stored in browser localStorage under the key `ray_tickets`. This persists across page refreshes and browser sessions.

**Initial Load**: On first access, 12 sample tickets are loaded from `/lib/sample-data.ts`

## File Structure

```
components/
  ├── chat-interface.tsx          # Main chat with ticket/employee handling
  ├── ray-desk-page.tsx           # Ticketing system UI
  ├── sidebar.tsx                 # Navigation sidebar
  └── ...
lib/
  ├── ticket-types.ts             # Type definitions
  └── sample-data.ts              # Sample tickets and employees
app/
  └── page.tsx                    # Main app layout with routing
```

## Chat Command Reference

| Command | Format | Example |
|---------|--------|---------|
| Create Ticket | `Create ticket title: [title] department: [dept] priority: [priority]` | `Create ticket title: Server Down department: Infrastructure priority: critical` |
| Update Status | `Update ticket [ID] to [status]` | `Update ticket TKT-001 to closed` |
| Close Ticket | `Close ticket [ID]` | `Close ticket TKT-002` |
| Hold Ticket | `Put ticket [ID] on hold` | `Put TKT-003 on hold` |
| Employee Info | `Tell me about [name]` or `Who is [name]` | `Tell me about Sarah Johnson` |

## Status Indicators

- **Open**: Red badge, AlertCircle icon
- **On Hold**: Yellow badge, Pause icon
- **In Progress**: Blue badge, Clock icon
- **Closed**: Green badge, CheckCircle2 icon

## Priority Levels

- **Low**: Gray
- **Medium**: Blue
- **High**: Orange
- **Critical**: Red

## Integration Points

### Optional: n8n Webhook

If running n8n on `http://localhost:5678/webhook-test/ray-rag-model`:

1. Queries are sent to n8n for RAG processing
2. Responses include sources, confidence scores, and validation status
3. If unavailable, fallback to local ticket/employee handling

**Setup**: No additional configuration needed - the system auto-detects availability

## Future Enhancements

- Real-time ticket notifications
- Advanced search with filters
- User role-based access control
- Ticket assignment workflows
- Integration with external APIs
- Advanced analytics and reporting

## Troubleshooting

**Tickets not persisting?**
- Check browser localStorage is enabled
- Verify browser dev tools → Application → Local Storage

**Ticket commands not working?**
- Ensure query includes all required fields for creation
- Use exact format: `Create ticket title: ... department: ... priority: ...`

**Employee lookup failing?**
- Check name spelling matches sample data
- Try searching by department instead of name
