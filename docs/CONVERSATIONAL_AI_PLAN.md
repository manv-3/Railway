# Conversational AI Agent - Hierarchy-Based Read Permission System
**Railway AI Block Planning Platform - Phase 3.5**

## Executive Summary

Design and implementation plan for an intelligent conversational AI agent that provides **read-only access** to the Railway AI Block Planning Platform with **strict hierarchy-based data filtering**. The agent ensures that:

- **Board Executives** see aggregated nationwide data
- **Zonal Heads** see only their zone's data
- **Divisional Controllers** see only their division's data  
- **Station Masters/Field SSEs** see only their station/section's data

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    User (with JWT Token)                         │
│                  tier_role + jurisdiction_id                     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│               Conversational AI Frontend                         │
│  • Chat Interface (React + MUI)                                  │
│  • Query Input Box                                               │
│  • Response Display (Markdown + Charts)                          │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP POST /api/v1/chat/query
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│            Conversational AI Backend Service                     │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 1. Authentication & Authorization Layer                  │   │
│  │    • Extract JWT token                                   │   │
│  │    • Get user's tier_role & jurisdiction_id              │   │
│  │    • Build permission context                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                      │
│                           ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 2. Intent Classification (Gemini/GPT)                    │   │
│  │    • Parse user query                                    │   │
│  │    • Classify intent category:                           │   │
│  │      - Block status query                                │   │
│  │      - Maintenance request summary                       │   │
│  │      - Train impact analysis                             │   │
│  │      - Performance metrics                               │   │
│  │      - Safety compliance audit                           │   │
│  │      - Machine availability                              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                      │
│                           ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 3. Query Generator (SQL Builder)                         │   │
│  │    • Convert intent to database queries                  │   │
│  │    • INJECT hierarchy filters automatically:             │   │
│  │      WHERE division_id = user.jurisdiction_id            │   │
│  │      OR section.division_id = user.jurisdiction_id       │   │
│  │    • Apply tier-specific JOIN strategies                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                      │
│                           ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 4. Data Access Layer (Hierarchy-Filtered)                │   │
│  │    • Execute filtered SQL queries                        │   │
│  │    • Retrieve only authorized data                       │   │
│  │    • No raw database access for users                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                      │
│                           ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 5. Response Synthesis (LLM + Formatting)                 │   │
│  │    • Format data into human-readable response            │   │
│  │    • Generate charts/tables if needed                    │   │
│  │    • Add context-aware suggestions                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Hierarchy-Based Data Access Rules

### 2.1 Data Visibility Matrix

| Entity Type | Board Exec | Zonal Head | Div Controller | Field SSE / Station Master |
|-------------|-----------|-----------|---------------|---------------------------|
| **All Zones** | ✅ Full | ❌ Own zone only | ❌ Own division only | ❌ Own section/station only |
| **All Divisions** | ✅ Full | ✅ Within own zone | ❌ Own division only | ❌ Own section/station only |
| **Maintenance Requests** | ✅ All | ✅ Zone-filtered | ✅ Division-filtered | ✅ Section/station-filtered |
| **Maintenance Blocks** | ✅ All | ✅ Zone-filtered | ✅ Division-filtered | ✅ Section-filtered |
| **Train Schedules** | ✅ All | ✅ Zone-filtered | ✅ Division-filtered | ✅ Station-filtered |
| **Optimization Runs** | ✅ All | ✅ Zone-filtered | ✅ Division-filtered | ❌ Not accessible |
| **Machine Fleet** | ✅ All | ✅ Zone-filtered | ✅ Division-filtered | ✅ Section-filtered |
| **Audit Logs** | ✅ All | ✅ Zone-filtered | ✅ Division-filtered | ❌ Not accessible |
| **Performance Metrics** | ✅ National | ✅ Zonal | ✅ Divisional | ✅ Section/station |

### 2.2 SQL Filter Injection by Role

#### **BOARD_EXEC** (Unrestricted)
```sql
-- No filters applied
SELECT * FROM maintenance_blocks;
```

#### **ZONAL_HEAD** (Zone-scoped)
```sql
-- Filter by zone hierarchy
SELECT * FROM maintenance_blocks mb
JOIN operational_jurisdictions oj ON mb.division_id = oj.id
WHERE oj.parent_id = 'ZONE_NR' OR oj.id = 'ZONE_NR';
```

#### **DIV_CONTROLLER** (Division-scoped)
```sql
-- Filter by exact division
SELECT * FROM maintenance_blocks
WHERE division_id = 'DIV_DLI';
```

#### **FIELD_SSE / STATION_MASTER** (Section/Station-scoped)
```sql
-- Filter by section or station
SELECT mb.* FROM maintenance_blocks mb
JOIN sections s ON mb.section_id = s.id
JOIN stations st ON (s.start_station_code = st.code OR s.end_station_code = st.code)
WHERE st.code = 'GZB' -- station assigned to user
   OR s.id IN (
       SELECT id FROM sections
       WHERE start_station_code = 'GZB' OR end_station_code = 'GZB'
   );
```

---

## 3. Conversational Intent Categories

### 3.1 Supported Query Types

| Intent Category | Example User Queries | Data Sources |
|----------------|---------------------|--------------|
| **Block Status** | "Show me all active blocks today" | `maintenance_blocks` |
| | "What blocks are in SANCTIONED state?" | Filtered by `status`, `tier_role` |
| **Maintenance Requests** | "How many pending TMS requests do I have?" | `maintenance_requests` |
| | "Show critical track maintenance items" | Filtered by `severity`, `department` |
| **Train Impacts** | "Which trains are delayed by today's blocks?" | `train_impacts`, `train_schedules` |
| | "Show me Vande Bharat train disruptions" | Filtered by `train_category` |
| **Performance Metrics** | "What is our block utilization rate?" | Aggregated from `optimization_runs` |
| | "How much asset availability have we gained?" | Calculated metrics |
| **Safety Compliance** | "Show blocks without PTW issued" | `maintenance_blocks` where `ptw_number IS NULL` |
| | "List disconnection memos from yesterday" | `maintenance_blocks` + `audit_logs` |
| **Machine Availability** | "Which tamping machines are available?" | `maintenance_machinery` |
| | "Where is TOWER_WAGON_07 currently?" | Filtered by `operational_status` |
| **Audit Trail** | "Who sanctioned block BLK_DLI_20260908_01?" | `audit_logs` + `users` |
| | "Show all actions by field_sse today" | Filtered by `actor_user_id` |

### 3.2 Intent Classification Prompt Template

```python
SYSTEM_PROMPT = """
You are a Railway Operations AI Assistant for the Indian Railways AI Block Planning Platform.

User tier_role: {tier_role}
User jurisdiction: {jurisdiction_name} ({jurisdiction_id})
User department: {department}

Classify the user's query into one of these intents:
1. BLOCK_STATUS_QUERY
2. MAINTENANCE_REQUEST_QUERY
3. TRAIN_IMPACT_QUERY
4. PERFORMANCE_METRICS
5. SAFETY_COMPLIANCE
6. MACHINE_AVAILABILITY
7. AUDIT_TRAIL
8. GENERAL_HELP

Also extract:
- time_filter (today, yesterday, this_week, custom_date)
- entity_ids (block_id, request_id, train_number, etc.)
- filters (status, severity, department, train_category)

Respond in JSON format.
"""
```

---

## 4. Implementation Modules

### 4.1 Backend API Route (`/api/v1/chat/query`)

**File**: `backend/api/routes/chat.py`

```python
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from database.connection import get_db
from api.routes.auth import get_current_user
from agents.conversational_ai_agent import ConversationalAIAgent

router = APIRouter(prefix="/api/v1/chat", tags=["Conversational AI"])

class ChatQueryRequest(BaseModel):
    query: str
    session_id: Optional[str] = None

class ChatQueryResponse(BaseModel):
    answer: str
    chart_data: Optional[dict] = None
    suggested_queries: list[str] = []
    data_source: str

@router.post("/query", response_model=ChatQueryResponse)
async def chat_query(
    request: ChatQueryRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Process conversational query with hierarchy-based filtering.
    
    Automatically applies data access filters based on:
    - current_user['tier_role']
    - current_user['jurisdiction_id']
    - current_user['department']
    """
    
    agent = ConversationalAIAgent(
        db=db,
        user_context=current_user
    )
    
    response = await agent.process_query(request.query)
    
    return ChatQueryResponse(
        answer=response['answer'],
        chart_data=response.get('chart_data'),
        suggested_queries=response.get('suggestions', []),
        data_source=response.get('data_source', 'Database')
    )
```

### 4.2 Conversational AI Agent Core

**File**: `backend/agents/conversational_ai_agent.py`

```python
import json
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
import google.generativeai as genai

from database.models import (
    MaintenanceBlock, MaintenanceRequest, TrainSchedule,
    OperationalJurisdiction, MaintenanceMachinery, AuditLogRecord
)

class ConversationalAIAgent:
    """
    Conversational AI Agent with Hierarchy-Based Read Permissions
    """
    
    def __init__(self, db: Session, user_context: dict):
        self.db = db
        self.user = user_context
        self.tier_role = user_context['tier_role']
        self.jurisdiction_id = user_context['jurisdiction_id']
        self.department = user_context.get('department')
        
        # Initialize LLM
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        self.model = genai.GenerativeModel('gemini-2.0-flash-exp')
    
    async def process_query(self, query: str) -> Dict[str, Any]:
        """Main query processing pipeline"""
        
        # 1. Classify intent
        intent = await self._classify_intent(query)
        
        # 2. Build hierarchy-filtered query
        sql_query = self._build_filtered_query(intent)
        
        # 3. Execute query
        data = self._execute_query(sql_query)
        
        # 4. Generate response
        answer = await self._generate_response(query, intent, data)
        
        return {
            'answer': answer,
            'chart_data': self._format_chart_data(data, intent),
            'suggestions': self._get_suggested_queries(intent),
            'data_source': f"Filtered by {self.tier_role}"
        }
    
    async def _classify_intent(self, query: str) -> Dict[str, Any]:
        """Use LLM to classify user intent"""
        
        prompt = f"""
        User role: {self.tier_role}
        User jurisdiction: {self.jurisdiction_id}
        
        Classify this query and extract parameters:
        "{query}"
        
        Return JSON with:
        - intent (BLOCK_STATUS_QUERY, MAINTENANCE_REQUEST_QUERY, etc.)
        - time_filter (today, yesterday, this_week, last_month, all_time)
        - filters (status, severity, department, etc.)
        - entity_ids (if specific IDs mentioned)
        """
        
        response = self.model.generate_content(prompt)
        return json.loads(response.text)
    
    def _build_filtered_query(self, intent: Dict[str, Any]) -> Any:
        """Build SQLAlchemy query with automatic hierarchy filtering"""
        
        intent_type = intent['intent']
        
        if intent_type == 'BLOCK_STATUS_QUERY':
            query = self.db.query(MaintenanceBlock)
            query = self._apply_hierarchy_filter_blocks(query)
            
        elif intent_type == 'MAINTENANCE_REQUEST_QUERY':
            query = self.db.query(MaintenanceRequest)
            query = self._apply_hierarchy_filter_requests(query)
            
        elif intent_type == 'TRAIN_IMPACT_QUERY':
            query = self.db.query(TrainSchedule)
            query = self._apply_hierarchy_filter_trains(query)
            
        # Add time filters, status filters, etc.
        query = self._apply_additional_filters(query, intent)
        
        return query
    
    def _apply_hierarchy_filter_blocks(self, query):
        """Apply role-based filter to maintenance_blocks query"""
        
        if self.tier_role == 'BOARD_EXEC':
            # No filter - see everything
            return query
        
        elif self.tier_role == 'ZONAL_HEAD':
            # See all divisions under this zone
            zone_divisions = self.db.query(OperationalJurisdiction.id).filter(
                or_(
                    OperationalJurisdiction.id == self.jurisdiction_id,
                    OperationalJurisdiction.parent_id == self.jurisdiction_id
                )
            ).all()
            div_ids = [d.id for d in zone_divisions]
            return query.filter(MaintenanceBlock.division_id.in_(div_ids))
        
        elif self.tier_role == 'DIV_CONTROLLER':
            # See only own division
            return query.filter(MaintenanceBlock.division_id == self.jurisdiction_id)
        
        elif self.tier_role in ['FIELD_SSE', 'STATION_MASTER']:
            # See only blocks affecting their section/station
            # Implement section-level filtering
            user_sections = self._get_user_sections()
            return query.filter(MaintenanceBlock.section_id.in_(user_sections))
        
        return query
    
    async def _generate_response(
        self, 
        query: str, 
        intent: Dict[str, Any], 
        data: list
    ) -> str:
        """Generate natural language response using LLM"""
        
        data_summary = self._summarize_data(data, intent)
        
        prompt = f"""
        You are a Railway Operations Assistant.
        
        User asked: "{query}"
        User role: {self.tier_role}
        
        Data retrieved (filtered by hierarchy):
        {data_summary}
        
        Generate a concise, professional response in Indian Railways terminology.
        Include numbers, dates, and specific details.
        """
        
        response = self.model.generate_content(prompt)
        return response.text
```

### 4.3 Frontend Chat Component

**File**: `frontend/src/components/ConversationalAI.tsx`

```tsx
import React, { useState } from 'react';
import {
  Box, TextField, Button, Paper, Typography,
  List, ListItem, Chip, CircularProgress
} from '@mui/material';
import { Send, SmartToy } from '@mui/icons-material';
import axios from 'axios';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  chartData?: any;
}

export default function ConversationalAI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post('/api/v1/chat/query', {
        query: input
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const aiMessage: Message = {
        role: 'assistant',
        content: response.data.answer,
        timestamp: new Date(),
        chartData: response.data.chart_data
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Paper sx={{ flex: 1, overflow: 'auto', p: 2, bgcolor: '#f5f5f5' }}>
        <List>
          {messages.map((msg, idx) => (
            <ListItem key={idx} sx={{
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
            }}>
              <Paper sx={{
                p: 2,
                maxWidth: '70%',
                bgcolor: msg.role === 'user' ? '#1976d2' : '#fff',
                color: msg.role === 'user' ? '#fff' : '#000'
              }}>
                <Typography>{msg.content}</Typography>
                {msg.chartData && <Box>📊 Chart placeholder</Box>}
              </Paper>
            </ListItem>
          ))}
        </List>
      </Paper>

      <Box sx={{ p: 2, display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          placeholder="Ask about blocks, requests, trains, or performance..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        />
        <Button
          variant="contained"
          onClick={handleSend}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <Send />}
        >
          Send
        </Button>
      </Box>
    </Box>
  );
}
```

---

## 5. Security & Compliance

### 5.1 Security Measures

1. **JWT Authentication**: All queries require valid JWT token
2. **Automatic Filter Injection**: No raw SQL - all queries filtered by ORM
3. **No Privilege Escalation**: Users cannot access data outside hierarchy
4. **Audit Trail**: All queries logged with user_id and timestamp
5. **Read-Only**: Agent has zero write permissions to database

### 5.2 Data Leak Prevention

```python
# NEVER allow these in user queries
FORBIDDEN_PATTERNS = [
    "DROP", "DELETE", "UPDATE", "INSERT", "ALTER",
    "GRANT", "REVOKE", "EXEC", "EXECUTE",
    "../", "file://", "javascript:"
]

def validate_query(query: str) -> bool:
    """Prevent SQL injection and malicious queries"""
    query_upper = query.upper()
    return not any(pattern in query_upper for pattern in FORBIDDEN_PATTERNS)
```

---

## 6. Example Conversations by Role

### 6.1 Board Executive (Sees Everything)
```
User: "Show me all critical maintenance requests nationwide"
AI: "There are currently 127 critical maintenance requests across 18 divisions:
     - TMS (Track): 52 requests
     - SMMS (Signal): 43 requests
     - TDMS (Electrical): 32 requests
     Top 3 divisions by critical requests: Delhi (23), Mumbai (19), Kanpur (15)"
```

### 6.2 Zonal Head (Sees Only Their Zone)
```
User (Northern Railway GM): "What's our block utilization rate this month?"
AI: "Northern Railway Zone block utilization for September 2026:
     - Total blocks planned: 47
     - Combined super-blocks: 18 (38%)
     - Asset availability gain: 156 hours
     - Average solver time: 12.3 seconds
     Top performing division: Delhi Division (45% bundling rate)"
```

### 6.3 Divisional Controller (Sees Only Their Division)
```
User (Delhi Div Controller): "Which blocks need PTW today?"
AI: "Delhi Division has 3 blocks requiring Permit to Work (PTW) issuance today:
     - BLK_DLI_20260908_01: GZB-MB section, SANCTIONED, awaiting TPC sign-off
     - BLK_DLI_20260908_02: NDLS-GZB section, SANCTIONED, OHE isolation pending
     - BLK_DLI_20260908_05: DLI-GZB yard, DISCONNECTED, PTW to be issued by 14:00"
```

### 6.4 Station Master (Sees Only Their Station)
```
User (Ghaziabad SM): "Are there any blocks affecting Ghaziabad today?"
AI: "2 active blocks affecting Ghaziabad Junction today:
     1. BLK_DLI_20260908_01 (14:00-16:30)
        - Section: GZB-MB Up Line
        - Departments: TMS + SMMS
        - Train impact: 4 freight trains held, 0 passenger disruptions
     
     2. BLK_DLI_20260908_03 (22:00-00:30)
        - Section: GZB Yard Line 2
        - Department: TDMS (OHE maintenance)
        - Train impact: Minimal (night hours)"
```

---

## 7. Implementation Phases

### Phase 1 (Week 1): Core Infrastructure
- ✅ JWT authentication with role extraction
- ✅ Hierarchy filter injection logic
- ✅ Basic intent classification
- ✅ Database query builders

### Phase 2 (Week 2): Query Capabilities
- ✅ All 8 intent types supported
- ✅ Time filters (today, yesterday, week, month)
- ✅ Entity-specific queries (by ID, code, etc.)
- ✅ LLM response generation

### Phase 3 (Week 3): Frontend & UX
- ✅ Chat interface component
- ✅ Suggested queries based on role
- ✅ Chart data rendering
- ✅ Mobile-responsive design

### Phase 4 (Week 4): Advanced Features
- ✅ Multi-turn conversations
- ✅ Context retention in session
- ✅ Export chat to PDF
- ✅ Voice input (optional)

---

## 8. Testing Strategy

### 8.1 Role-Based Access Tests

```python
def test_board_exec_sees_all():
    user = {"tier_role": "BOARD_EXEC", "jurisdiction_id": "BOARD_IR"}
    response = query_ai("Show all blocks", user)
    assert len(response.blocks) > 100  # Nationwide data

def test_zonal_head_restricted():
    user = {"tier_role": "ZONAL_HEAD", "jurisdiction_id": "ZONE_NR"}
    response = query_ai("Show all blocks", user)
    assert all(b.division_id.startswith("DIV_") and b.zone == "ZONE_NR" 
               for b in response.blocks)

def test_station_master_limited():
    user = {"tier_role": "STATION_MASTER", "jurisdiction_id": "DIV_DLI"}
    response = query_ai("Show all blocks", user)
    assert all(b.section_id.contains("GZB") for b in response.blocks)
```

---

## 9. Deployment Checklist

- [ ] Environment variable `GEMINI_API_KEY` configured
- [ ] Rate limiting on `/api/v1/chat/query` (10 req/min per user)
- [ ] Query audit logs enabled
- [ ] Hierarchy filter unit tests (100% coverage)
- [ ] SQL injection prevention verified
- [ ] Frontend authentication flow tested
- [ ] Demo video recorded for all 4 roles
- [ ] Documentation updated

---

## 10. Cost & Performance

### Estimated API Costs (Gemini)
- Average query: 2 API calls (intent classification + response generation)
- 1,000 queries/day = $1.50/day = ~$45/month (using Gemini Flash)

### Performance Targets
- Intent classification: <1 second
- Database query: <500ms
- Response generation: <2 seconds
- **Total query latency: <4 seconds**

---

## Conclusion

This conversational AI agent provides a **natural language interface** to the Railway AI Block Planning Platform while maintaining **strict hierarchy-based data isolation**. The system ensures:

1. **Zero data leakage** between hierarchy levels
2. **Auditable access** (every query logged)
3. **Read-only safety** (no write permissions)
4. **Intelligent responses** (LLM-powered)
5. **Scalable architecture** (handles 1000s of queries/day)

The agent transforms complex railway operations data into **actionable insights** tailored to each user's role and responsibilities.
