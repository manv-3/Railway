# PS 26027: Railway Block Planning System - Architecture Document

## Executive Summary

**Project**: AI-Powered Automatic Block Planning to Maximize Asset Availability for Indian Railways  
**Date**: August 22, 2026  
**Architecture Version**: 1.0  
**Target**: Smart India Hackathon / Production Deployment

### Problem Statement
Indian Railways has multiple departments (Engineering/TMS, Signalling/SMMS, Traction/TDMS) that independently request maintenance blocks. This leads to:
- Excessive downtime (6+ hours instead of optimized 2 hours)
- Poor coordination between departments
- Suboptimal asset availability
- Increased train disruptions

### Solution Overview
An intelligent system that:
1. **Ingests** maintenance requests from all departments
2. **Prioritizes** tasks using ML-based scoring
3. **Optimizes** block schedules using constraint programming
4. **Coordinates** multi-department maintenance into combined blocks
5. **Explains** AI decisions to human operators
6. **Simulates** what-if scenarios for planning

### Key Metrics
- **Asset Availability**: +30-40% improvement
- **Block Reduction**: 40-50% fewer blocks through coordination
- **Optimization Speed**: < 30 seconds for weekly planning
- **Train Impact**: 50% reduction in affected trains

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Web Dashboard│  │ Mobile App   │  │ Admin Panel  │         │
│  │  (React)     │  │  (Optional)  │  │              │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS/WebSocket
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                          │
│  ┌──────────────────────────────────────────────────────┐      │
│  │  FastAPI Gateway (Load Balancer + Auth + CORS)      │      │
│  │  - Authentication & Authorization                     │      │
│  │  - Rate Limiting                                      │      │
│  │  - Request Routing                                    │      │
│  │  - API Documentation (OpenAPI)                        │      │
│  └──────────────────────────────────────────────────────┘      │
└────────────────────────────┬────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ↓                    ↓                    ↓
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   SERVICE    │    │   SERVICE    │    │   SERVICE    │
│     LAYER    │    │     LAYER    │    │     LAYER    │
└──────────────┘    └──────────────┘    └──────────────┘
        │                    │                    │
        ↓                    ↓                    ↓
┌─────────────────────────────────────────────────────────────────┐
│                    CORE BUSINESS LOGIC                          │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │   Data      │  │Optimization │  │Explainability│           │
│  │   Agent     │  │   Agent     │  │   Agent      │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │Coordination │  │ Simulation  │  │ Notification │           │
│  │   Agent     │  │   Agent     │  │   Agent      │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
│                                                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ↓                    ↓                    ↓
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  PostgreSQL  │    │    Redis     │    │  Message     │
│  (Primary)   │    │   (Cache)    │    │  Queue       │
│              │    │              │    │ (RabbitMQ)   │
└──────────────┘    └──────────────┘    └──────────────┘
```

---

## Detailed Component Architecture

### 1. Presentation Layer

#### 1.1 Web Dashboard (React + TypeScript)

**Main Views:**

```
Railway Block Planning Dashboard
├── Home/Overview
│   ├── Active Blocks Summary
│   ├── Pending Requests Count
│   ├── Asset Availability Metrics
│   └── Recent Activities
│
├── Maintenance Requests
│   ├── Request List (filterable)
│   ├── Create New Request
│   ├── Request Details
│   └── Priority Scoring View
│
├── Block Planning
│   ├── Railway Corridor Map
│   ├── Optimization Dashboard
│   ├── Block Timeline (Gantt Chart)
│   ├── Schedule Calendar View
│   └── Multi-department Coordination View
│
├── What-If Simulator
│   ├── Scenario Creator
│   ├── Parameter Modification
│   ├── Comparison Dashboard
│   └── Sensitivity Analysis
│
├── Analytics & Reports
│   ├── Asset Availability Trends
│   ├── Department-wise Statistics
│   ├── Train Impact Analysis
│   └── Optimization Performance
│
└── Administration
    ├── User Management
    ├── System Configuration
    ├── Data Integration Status
    └── Audit Logs
```

**Key Components:**

```typescript
// Component Hierarchy
App
├── AuthProvider
├── Router
│   ├── PublicRoutes
│   │   └── Login
│   └── ProtectedRoutes
│       ├── DashboardLayout
│       │   ├── Sidebar
│       │   ├── Header
│       │   └── MainContent
│       │       ├── OverviewPage
│       │       ├── MaintenanceRequestsPage
│       │       │   ├── RequestListTable
│       │       │   ├── RequestForm
│       │       │   └── PriorityScoreCard
│       │       ├── BlockPlanningPage
│       │       │   ├── CorridorMap (Leaflet)
│       │       │   ├── BlockTimeline (Gantt)
│       │       │   ├── OptimizationPanel
│       │       │   │   ├── OptimizationForm
│       │       │   │   ├── MetricsDashboard
│       │       │   │   └── ExplanationPanel
│       │       │   └── BlockDetailsCard
│       │       ├── WhatIfSimulatorPage
│       │       │   ├── ScenarioBuilder
│       │       │   ├── SimulationRunner
│       │       │   ├── ComparisonView
│       │       │   └── ResultsAnalysis
│       │       └── AnalyticsPage
│       │           ├── Charts (Recharts)
│       │           ├── Metrics
│       │           └── Reports
│       └── AdminRoutes
│           ├── UserManagement
│           └── SystemConfig
└── GlobalProviders
    ├── ThemeProvider
    ├── NotificationProvider
    └── WebSocketProvider
```

**Technology Stack:**
- **Framework**: React 18+ with TypeScript
- **State Management**: Redux Toolkit + RTK Query (for API calls)
- **UI Library**: Material-UI (MUI) or Ant Design
- **Maps**: React-Leaflet (railway corridor visualization)
- **Charts**: Recharts or Apache ECharts
- **Timeline**: react-gantt-timeline or custom implementation
- **Real-time**: Socket.io-client
- **Forms**: React Hook Form + Zod validation
- **Routing**: React Router v6

---

### 2. API Gateway Layer

#### 2.1 FastAPI Gateway

```python
# Main API Structure

railway-ai-backend/
├── api/
│   ├── main.py                    # FastAPI app initialization
│   ├── dependencies.py            # Dependency injection
│   ├── middleware/
│   │   ├── auth.py               # JWT authentication
│   │   ├── cors.py               # CORS configuration
│   │   ├── rate_limit.py         # Rate limiting
│   │   └── logging.py            # Request/response logging
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── auth.py               # Login, logout, refresh token
│   │   ├── maintenance.py        # Maintenance request CRUD
│   │   ├── blocks.py             # Block scheduling operations
│   │   ├── optimization.py       # Optimization endpoints
│   │   ├── simulation.py         # What-if simulation
│   │   ├── analytics.py          # Reports and analytics
│   │   └── system.py             # System health, config
│   └── schemas/
│       ├── maintenance.py        # Pydantic models
│       ├── blocks.py
│       ├── optimization.py
│       └── common.py
```

**Key API Endpoints:**

```
Authentication & User Management
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/refresh
GET    /api/v1/users/me

Maintenance Requests
GET    /api/v1/maintenance/requests
POST   /api/v1/maintenance/requests
GET    /api/v1/maintenance/requests/{id}
PUT    /api/v1/maintenance/requests/{id}
DELETE /api/v1/maintenance/requests/{id}
POST   /api/v1/maintenance/requests/bulk-import
GET    /api/v1/maintenance/requests/priority-score/{id}

Block Planning
GET    /api/v1/blocks
POST   /api/v1/blocks
GET    /api/v1/blocks/{id}
PUT    /api/v1/blocks/{id}
DELETE /api/v1/blocks/{id}
POST   /api/v1/blocks/{id}/approve
POST   /api/v1/blocks/{id}/reject
GET    /api/v1/blocks/calendar

Optimization
POST   /api/v1/optimize/run
GET    /api/v1/optimize/status/{job_id}
POST   /api/v1/optimize/weekly-plan
POST   /api/v1/optimize/monthly-plan
GET    /api/v1/optimize/history

Simulation
POST   /api/v1/simulation/create
GET    /api/v1/simulation/{id}
POST   /api/v1/simulation/{id}/run
GET    /api/v1/simulation/{id}/results
POST   /api/v1/simulation/compare

Explanations
GET    /api/v1/explain/block/{block_id}
GET    /api/v1/explain/optimization/{optimization_id}
GET    /api/v1/explain/priority/{request_id}

Analytics
GET    /api/v1/analytics/dashboard
GET    /api/v1/analytics/asset-availability
GET    /api/v1/analytics/department-stats
GET    /api/v1/analytics/train-impact
POST   /api/v1/analytics/generate-report

System
GET    /api/v1/system/health
GET    /api/v1/system/metrics
GET    /api/v1/system/config
POST   /api/v1/system/data-sync
GET    /api/v1/system/integrations/status

WebSocket
WS     /ws/optimization/{job_id}
WS     /ws/notifications
```

---

### 3. Core Business Logic - Agent Architecture

#### 3.1 Data Agent

**Responsibility**: Data ingestion, validation, transformation, and enrichment

**Components:**
```
DataAgent
├── DataIngestionService
│   ├── TMSConnector (Track Management System)
│   ├── SMMSConnector (Signalling Maintenance)
│   ├── TDMSConnector (Traction Distribution)
│   ├── COAConnector (Control Office Application)
│   └── SyntheticDataGenerator (for development)
│
├── DataValidationService
│   ├── SchemaValidator
│   ├── BusinessRuleValidator
│   └── DataQualityChecker
│
├── DataTransformationService
│   ├── Normalizer
│   ├── Enrichment (add infrastructure data)
│   └── Aggregator
│
└── DataCacheService
    ├── RedisCache
    └── CacheInvalidation
```

**Key Operations:**
1. **Fetch Maintenance Requests**: Poll/webhook from TMS/SMMS/TDMS
2. **Validate Data**: Check completeness, consistency
3. **Enrich**: Add section details, historical data, infrastructure constraints
4. **Cache**: Store frequently accessed data
5. **Notify**: Trigger events for new/updated requests

**Data Models:**
```python
class MaintenanceRequest:
    id: str
    request_id: str
    department: Department (TMS/SMMS/TDMS)
    section_id: str
    asset_type: AssetType
    defect_type: str
    severity: Severity
    description: str
    estimated_duration_minutes: int
    requested_date: datetime
    due_date: datetime
    priority_score: float (calculated)
    status: RequestStatus
    metadata: dict
    
    # Enriched data
    section: Section
    historical_performance: dict
    asset_criticality: float
    failure_probability: float
```

#### 3.2 Optimization Agent

**Responsibility**: Core constraint optimization using OR-Tools CP-SAT

**Architecture:**
```
OptimizationAgent
├── PriorityScoring
│   ├── MLModel (XGBoost)
│   │   ├── AssetCriticalityModel
│   │   ├── SafetyRiskModel
│   │   └── FailureProbabilityModel
│   └── ScoreAggregator
│
├── ConstraintOptimization
│   ├── ProblemFormulator
│   │   ├── VariableCreator
│   │   ├── ConstraintBuilder
│   │   └── ObjectiveDefiner
│   │
│   ├── ORToolsSolver (CP-SAT)
│   │   ├── ModelBuilder
│   │   ├── SolverConfig
│   │   └── SolutionExtractor
│   │
│   └── PostProcessor
│       ├── BlockGrouper (combine overlapping tasks)
│       ├── ConflictResolver
│       └── MetricsCalculator
│
├── WeeklyPlanner
│   └── MultiDayOptimization
│
├── MonthlyPlanner
│   └── StrategicPlanning
│
└── RealtimeReplanner
    └── IncrementalOptimization
```

**Optimization Problem Formulation:**

**Decision Variables:**
- `start[i]`: Start time slot for maintenance request i
- `assigned[i]`: Boolean - is request i scheduled?
- `block[j]`: Boolean - is block j created?

**Constraints:**
1. **No Overlap (Same Section, Same Department)**
   ```
   For requests i, j on same section, same dept:
   start[i] + duration[i] <= start[j] OR
   start[j] + duration[j] <= start[i]
   ```

2. **Available Time Windows**
   ```
   start[i] >= window_start AND
   start[i] + duration[i] <= window_end
   ```

3. **Resource Constraints**
   ```
   For each time slot t, section s:
   sum(resource_usage[i,s,t]) <= section_capacity[s]
   ```

4. **Priority Constraints**
   ```
   If priority[i] > critical_threshold AND due_date[i] < tomorrow:
   assigned[i] = 1 (must schedule)
   ```

5. **Department Coordination**
   ```
   If same section, overlapping time, different depts:
   Can combine into single block (bonus in objective)
   ```

6. **Train Conflict Minimization**
   ```
   For each train t passing section s at time w:
   Minimize overlap with blocks
   ```

**Objectives (Multi-objective):**
```
Maximize:
  1000 * (number of requests scheduled) +
   500 * (priority score coverage) +
   300 * (multi-dept coordination bonus) -
   100 * (total block duration) -
   200 * (number of train conflicts) -
   150 * (delay from due dates)
```

**Algorithm Flow:**
```
1. Receive optimization request
2. Fetch all pending maintenance requests
3. Calculate priority scores (ML model)
4. Fetch train schedules for time period
5. Identify available time windows
6. Formulate CP-SAT problem
7. Run solver (with time limit)
8. Extract solution
9. Group overlapping tasks into combined blocks
10. Calculate metrics
11. Return optimized schedule
```

#### 3.3 Explainability Agent

**Responsibility**: Generate human-readable explanations for AI decisions

**Components:**
```
ExplainabilityAgent
├── BlockExplainer
│   ├── ReasoningEngine
│   │   ├── WhyThisBlock (why created)
│   │   ├── WhyThisTime (timing rationale)
│   │   ├── WhyTheseTasks (task selection)
│   │   └── WhyNotOthers (alternatives rejected)
│   │
│   ├── FactorAnalyzer
│   │   ├── PriorityImpact
│   │   ├── CoordinationBenefit
│   │   ├── TrainImpactAnalysis
│   │   └── TimeWindowFit
│   │
│   └── NaturalLanguageGenerator
│       └── TemplateEngine
│
├── PriorityExplainer
│   ├── SHAPExplainer (for ML model)
│   ├── FeatureImportance
│   └── ScoreBreakdown
│
├── MetricsExplainer
│   ├── AssetAvailabilityCalculator
│   ├── TimeSavingsCalculator
│   └── ImpactAssessment
│
└── VisualizationDataGenerator
    ├── ComparisonData (before/after)
    ├── FlowDiagram
    └── ImpactChart
```

**Explanation Structure:**
```json
{
  "block_id": "BLK_0001",
  "summary": "Recommended because: combines 3 dept tasks, high priority, minimal train impact",
  "confidence": 0.89,
  "factors": [
    {
      "category": "Multi-department Coordination",
      "weight": 0.35,
      "explanation": "Combined Engineering, Signal, and Traction maintenance",
      "benefit": "Saved 2.5 hours of separate blocks",
      "impact": "positive"
    },
    {
      "category": "Priority Coverage",
      "weight": 0.28,
      "explanation": "Average priority score: 87/100",
      "benefit": "Addresses 2 critical and 1 high-priority tasks",
      "impact": "critical"
    },
    {
      "category": "Train Impact",
      "weight": 0.22,
      "explanation": "2 freight trains affected, 0 passenger trains",
      "benefit": "Scheduled during low-traffic window",
      "impact": "low_negative"
    },
    {
      "category": "Time Window Optimization",
      "weight": 0.15,
      "explanation": "Fits within available maintenance window",
      "benefit": "No operational conflicts",
      "impact": "positive"
    }
  ],
  "alternatives_considered": [
    {
      "option": "Separate blocks for each department",
      "rejected_reason": "Would consume 5.5 hours vs 3 hours",
      "score": 0.62
    },
    {
      "option": "Delay to next day",
      "rejected_reason": "Would miss critical priority deadline",
      "score": 0.45
    }
  ],
  "risks": [
    {
      "risk": "Weather dependency",
      "probability": 0.15,
      "mitigation": "Indoor work can proceed if rain occurs"
    }
  ],
  "metrics": {
    "asset_availability_gain": "2.5 hours",
    "coordination_efficiency": "45%",
    "train_impact_score": 12
  }
}
```

#### 3.4 Simulation Agent

**Responsibility**: What-if scenario analysis

**Components:**
```
SimulationAgent
├── ScenarioManager
│   ├── ScenarioCreator
│   ├── ScenarioModifier
│   └── ScenarioVersioning
│
├── SimulationEngine
│   ├── ParameterInjector
│   ├── OptimizationRunner (uses OptimizationAgent)
│   ├── ParallelSimulator (run multiple scenarios)
│   └── ResultCollector
│
├── ComparisonAnalyzer
│   ├── MetricsComparer
│   ├── DifferenceCalculator
│   └── TrendAnalyzer
│
└── SensitivityAnalyzer
    ├── ParameterSweeper
    └── ImpactCalculator
```

**Simulation Types:**
1. **What-if Scenarios**
   - Add emergency maintenance request
   - Remove/delay maintenance request
   - Increase train frequency by X%
   - Change time windows
   - Modify priority thresholds

2. **Sensitivity Analysis**
   - Vary train density (±20%)
   - Vary maintenance duration (±30%)
   - Change optimization weights
   - Test different time windows

3. **Stress Testing**
   - Maximum load scenario
   - Multiple emergencies
   - Resource constraints

**Simulation Workflow:**
```
1. User creates scenario
2. Select base optimization or create new
3. Modify parameters (add/remove requests, change constraints)
4. Run simulation (can run multiple in parallel)
5. Collect results
6. Compare with baseline
7. Generate insights and recommendations
8. Visualize differences
```

#### 3.5 Coordination Agent

**Responsibility**: Orchestrate multi-agent workflows and event handling

**Components:**
```
CoordinationAgent
├── WorkflowOrchestrator
│   ├── RequestRouter
│   ├── TaskScheduler
│   └── WorkflowEngine (state machine)
│
├── EventBus
│   ├── EventPublisher
│   ├── EventSubscriber
│   └── EventStore
│
├── AgentCommunication
│   ├── MessageQueue (RabbitMQ)
│   ├── RequestResponseHandler
│   └── AsyncTaskManager (Celery)
│
└── StateManager
    ├── SystemState
    ├── JobTracker
    └── StatusAggregator
```

**Key Workflows:**

**Workflow 1: Optimization Request**
```
1. User submits optimization request
   → Coordination Agent receives
   
2. Coordination Agent → Data Agent
   "Fetch pending maintenance requests"
   
3. Data Agent → Database
   Retrieves requests, enriches data
   
4. Data Agent → Coordination Agent
   Returns enriched maintenance requests
   
5. Coordination Agent → Optimization Agent
   "Run optimization with these requests"
   
6. Optimization Agent processes
   - Calculate priorities
   - Formulate CP-SAT problem
   - Solve
   - Extract solution
   
7. Optimization Agent → Coordination Agent
   Returns optimized blocks
   
8. Coordination Agent → Explainability Agent
   "Generate explanations for these blocks"
   
9. Explainability Agent → Coordination Agent
   Returns explanations
   
10. Coordination Agent → User
    Returns complete result (blocks + explanations + metrics)
    
11. Coordination Agent → Notification Agent
    Notify relevant department heads
```

**Workflow 2: Maintenance Request Creation**
```
1. User creates maintenance request
   → API Gateway → Coordination Agent
   
2. Coordination Agent → Data Agent
   "Validate and store request"
   
3. Data Agent validates, enriches, saves
   
4. Data Agent → Coordination Agent
   "Request saved, ID = REQ_001"
   
5. Coordination Agent → Optimization Agent
   "Calculate priority score for REQ_001"
   
6. Optimization Agent → ML Model
   Calculate priority
   
7. Optimization Agent → Coordination Agent
   "Priority score = 87.5"
   
8. Coordination Agent → Database
   Update request with priority
   
9. Coordination Agent → User
   Return success + priority score
   
10. If priority > 90 (critical):
    Coordination Agent → Notification Agent
    "Send urgent alert to department head"
```

#### 3.6 Notification Agent

**Responsibility**: Send notifications and alerts

**Components:**
```
NotificationAgent
├── NotificationManager
│   ├── EmailService
│   ├── SMSService (optional)
│   ├── PushNotificationService
│   └── WebSocketService (real-time)
│
├── AlertEngine
│   ├── RuleEvaluator
│   ├── ThresholdMonitor
│   └── EscalationManager
│
└── TemplateEngine
    ├── EmailTemplates
    ├── NotificationTemplates
    └── AlertTemplates
```

**Notification Types:**
1. **Block Approved** → Assigned departments
2. **Critical Maintenance** → Department heads
3. **Optimization Complete** → Requester
4. **Block Starting Soon** → Field workers
5. **Train Conflict Alert** → Control room
6. **System Alerts** → Administrators

---

### 4. Data Layer

#### 4.1 Database Schema (PostgreSQL)

**Core Tables:**

```sql
-- Sections (Railway infrastructure)
CREATE TABLE sections (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    start_station VARCHAR(50),
    end_station VARCHAR(50),
    distance_km DECIMAL(10,2),
    track_type VARCHAR(20), -- single, double, multiple
    max_speed INTEGER,
    electrified BOOLEAN,
    section_geometry GEOMETRY(LINESTRING, 4326), -- PostGIS
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Maintenance Requests
CREATE TABLE maintenance_requests (
    id SERIAL PRIMARY KEY,
    request_id VARCHAR(50) UNIQUE NOT NULL,
    department VARCHAR(20) NOT NULL, -- TMS, SMMS, TDMS
    section_id VARCHAR(50) REFERENCES sections(id),
    asset_type VARCHAR(50),
    asset_id VARCHAR(50),
    defect_type VARCHAR(100),
    severity VARCHAR(20), -- critical, high, medium, low
    description TEXT,
    estimated_duration_minutes INTEGER,
    requested_date TIMESTAMP,
    due_date TIMESTAMP,
    priority_score DECIMAL(5,2),
    status VARCHAR(20), -- pending, scheduled, approved, in_progress, completed, cancelled
    created_by VARCHAR(100),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_maintenance_status ON maintenance_requests(status);
CREATE INDEX idx_maintenance_section ON maintenance_requests(section_id);
CREATE INDEX idx_maintenance_priority ON maintenance_requests(priority_score DESC);

-- Maintenance Blocks
CREATE TABLE maintenance_blocks (
    id SERIAL PRIMARY KEY,
    block_id VARCHAR(50) UNIQUE NOT NULL,
    section_id VARCHAR(50) REFERENCES sections(id),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    total_duration_minutes INTEGER,
    block_type VARCHAR(50), -- single, combined, emergency
    status VARCHAR(20), -- planned, approved, active, completed, cancelled
    is_combined BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(100), -- AI or username
    approved_by VARCHAR(100),
    approved_at TIMESTAMP,
    optimization_id INTEGER REFERENCES optimization_runs(id),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_blocks_time ON maintenance_blocks(start_time, end_time);
CREATE INDEX idx_blocks_section ON maintenance_blocks(section_id);
CREATE INDEX idx_blocks_status ON maintenance_blocks(status);

-- Block-Request Association (many-to-many)
CREATE TABLE block_maintenance_assignments (
    id SERIAL PRIMARY KEY,
    block_id INTEGER REFERENCES maintenance_blocks(id) ON DELETE CASCADE,
    request_id INTEGER REFERENCES maintenance_requests(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(block_id, request_id)
);

-- Optimization Runs (track optimization history)
CREATE TABLE optimization_runs (
    id SERIAL PRIMARY KEY,
    optimization_id VARCHAR(50) UNIQUE,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    total_requests INTEGER,
    scheduled_requests INTEGER,
    total_blocks_created INTEGER,
    combined_blocks INTEGER,
    time_saved_hours DECIMAL(10,2),
    asset_availability_improvement_percent DECIMAL(5,2),
    solver_time_seconds DECIMAL(10,2),
    status VARCHAR(20), -- running, completed, failed
    parameters JSONB,
    metrics JSONB,
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Train Schedules
CREATE TABLE train_schedules (
    id SERIAL PRIMARY KEY,
    train_number VARCHAR(20),
    train_name VARCHAR(100),
    train_type VARCHAR(20), -- passenger, freight, express
    source_station VARCHAR(50),
    destination_station VARCHAR(50),
    scheduled_departure TIMESTAMP,
    scheduled_arrival TIMESTAMP,
    route JSONB, -- Array of {station, scheduled_time, section_id}
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Train Impact (blocks affecting trains)
CREATE TABLE train_impacts (
    id SERIAL PRIMARY KEY,
    block_id INTEGER REFERENCES maintenance_blocks(id),
    train_id INTEGER REFERENCES train_schedules(id),
    impact_type VARCHAR(20), -- delay, reroute, cancel
    estimated_delay_minutes INTEGER,
    severity VARCHAR(20),
    notified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Explanations
CREATE TABLE explanations (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(20), -- block, optimization, priority
    entity_id VARCHAR(50),
    explanation_summary TEXT,
    detailed_factors JSONB,
    confidence DECIMAL(5,2),
    alternatives JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Simulations
CREATE TABLE simulations (
    id SERIAL PRIMARY KEY,
    simulation_id VARCHAR(50) UNIQUE,
    name VARCHAR(100),
    description TEXT,
    base_optimization_id INTEGER REFERENCES optimization_runs(id),
    scenario_modifications JSONB,
    status VARCHAR(20), -- draft, running, completed
    results JSONB,
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    recipient VARCHAR(100),
    notification_type VARCHAR(50),
    title VARCHAR(200),
    message TEXT,
    related_entity_type VARCHAR(50),
    related_entity_id VARCHAR(50),
    read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    full_name VARCHAR(200),
    role VARCHAR(50), -- admin, planner, department_head, viewer
    department VARCHAR(20),
    active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100),
    entity_type VARCHAR(50),
    entity_id VARCHAR(50),
    changes JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_time ON audit_logs(created_at);
```

#### 4.2 Redis Cache Structure

```
Cache Keys:

# Maintenance requests (by status)
maintenance:pending -> List of pending request IDs
maintenance:request:{id} -> Full request object (TTL: 1 hour)

# Sections
section:{id} -> Section details (TTL: 24 hours)
sections:all -> List of all sections (TTL: 24 hours)

# Blocks
block:{id} -> Block details (TTL: 1 hour)
blocks:active -> List of active block IDs
blocks:upcoming -> Sorted set by start_time

# Optimization cache
optimization:result:{id} -> Cached optimization result (TTL: 6 hours)
optimization:in_progress -> Set of running optimization job IDs

# Priority scores (ML model cache)
priority:model:version -> Current model version
priority:score:{request_id} -> Cached priority score (TTL: 1 hour)

# Train schedules
train:schedule:{date} -> Train schedules for specific date (TTL: 12 hours)

# Session/Auth
session:{token} -> User session data (TTL: as configured)
user:{id}:permissions -> User permissions (TTL: 1 hour)
```

---

### 5. Integration Layer

#### 5.1 External System Integration

**TMS Integration (Track Management System)**
```python
class TMSConnector:
    """
    Integration with Track Management System
    Could be REST API, SOAP, or database sync
    """
    
    def fetch_maintenance_requests(
        self, 
        since: datetime,
        department: str = "TMS"
    ) -> List[MaintenanceRequest]:
        # Poll TMS API or database
        pass
    
    def update_request_status(
        self,
        request_id: str,
        status: str,
        block_id: Optional[str] = None
    ):
        # Update TMS with scheduling decision
        pass
```

**SMMS Integration (Signalling Maintenance)**
```python
class SMMSConnector:
    """Similar to TMS but for signalling equipment"""
    pass
```

**TDMS Integration (Traction Distribution)**
```python
class TDMSConnector:
    """Similar to TMS but for electrical/traction"""
    pass
```

**COA Integration (Control Office Application)**
```python
class COAConnector:
    """
    Integration with Control Office Application
    - Fetch train schedules
    - Send block notifications
    - Update operational status
    """
    
    def fetch_train_schedules(
        self,
        start_date: datetime,
        end_date: datetime,
        sections: List[str]
    ) -> List[TrainSchedule]:
        pass
    
    def notify_block_scheduled(
        self,
        block: MaintenanceBlock
    ):
        # Send block information to COA
        pass
```

**Integration Patterns:**
1. **REST API**: Standard HTTP API calls
2. **Database Sync**: Direct database read (read-only)
3. **Message Queue**: Async event-based
4. **File Transfer**: CSV/XML batch import
5. **Webhook**: Push notifications from source systems

For **development/demo**, we'll use:
- **Synthetic data generators** that mimic TMS/SMMS/TDMS
- **Mock APIs** for COA integration
- **Database seeding** with realistic data

---

## Technology Stack Summary

### Backend
```yaml
Language: Python 3.10+
Framework: FastAPI 0.100+
ASGI Server: Uvicorn with Gunicorn

Core Libraries:
  - or-tools: 9.7+ (Constraint optimization)
  - xgboost: 2.0+ (Priority scoring ML)
  - scikit-learn: 1.3+ (ML utilities)
  - sqlalchemy: 2.0+ (ORM)
  - alembic: 1.12+ (Database migrations)
  - pydantic: 2.0+ (Data validation)
  - celery: 5.3+ (Async tasks)
  - redis: 5.0+ (Cache & message broker)
  - pika: 1.3+ (RabbitMQ client)
  - jwt: 2.8+ (Authentication)
  - httpx: 0.24+ (HTTP client)
  - pandas: 2.0+ (Data processing)
  - numpy: 1.24+
  - psycopg2: 2.9+ (PostgreSQL driver)
  
Testing:
  - pytest: 7.4+
  - pytest-asyncio
  - pytest-cov
  - faker: (Test data generation)
```

### Frontend
```yaml
Language: TypeScript 5.0+
Framework: React 18.2+
Build Tool: Vite 4.4+

Core Libraries:
  - @reduxjs/toolkit: 1.9+ (State management)
  - react-router-dom: 6.15+ (Routing)
  - @mui/material: 5.14+ (UI components)
  - react-leaflet: 4.2+ (Maps)
  - recharts: 2.8+ (Charts)
  - react-hook-form: 7.45+ (Forms)
  - zod: 3.22+ (Validation)
  - socket.io-client: 4.7+ (WebSocket)
  - axios: 1.5+ (HTTP client)
  - date-fns: 2.30+ (Date utilities)
  - @tanstack/react-table: 8.10+ (Tables)
  
Testing:
  - vitest
  - @testing-library/react
  - @testing-library/user-event
```

### Database & Cache
```yaml
Primary Database: PostgreSQL 14+ with PostGIS
Cache: Redis 7+
Message Queue: RabbitMQ 3.12+
```

### DevOps
```yaml
Containerization: Docker, Docker Compose
CI/CD: GitHub Actions
Monitoring: Prometheus + Grafana
Logging: ELK Stack (Elasticsearch, Logstash, Kibana)
```

---

## Deployment Architecture

### Development Environment
```
Docker Compose Setup:
  - postgres (with PostGIS)
  - redis
  - rabbitmq
  - backend (hot reload)
  - celery worker
  - frontend (dev server)
  - pgadmin (database management)
  - redis-commander (cache inspection)
```

### Production Environment (AWS Example)
```
Application Layer:
  - ECS/EKS for container orchestration
  - Application Load Balancer
  - Auto-scaling groups

Data Layer:
  - RDS PostgreSQL (Multi-AZ)
  - ElastiCache Redis (Cluster mode)
  - Amazon MQ (RabbitMQ)

Storage:
  - S3 for backups, reports, logs

Monitoring:
  - CloudWatch
  - X-Ray (tracing)

Security:
  - VPC with private subnets
  - Security groups
  - Secrets Manager
  - WAF
```

---

## Security Architecture

### Authentication & Authorization
```
Authentication:
  - JWT tokens (access + refresh)
  - Token expiry: 15 min (access), 7 days (refresh)
  - Password hashing: bcrypt
  
Authorization:
  - Role-Based Access Control (RBAC)
  - Roles: Admin, Planner, Department Head, Viewer
  - Permission checking at API and UI level
  
Roles & Permissions:
  Admin:
    - All permissions
    - User management
    - System configuration
    
  Planner:
    - Create/edit maintenance requests
    - Run optimizations
    - Approve blocks
    - Run simulations
    
  Department Head:
    - View department-specific requests
    - Create maintenance requests
    - Approve block assignments
    
  Viewer:
    - Read-only access
    - View schedules and reports
```

### Data Security
```
- Encryption at rest (database)
- Encryption in transit (HTTPS/TLS)
- SQL injection prevention (parameterized queries)
- XSS prevention (input sanitization)
- CSRF protection
- Rate limiting
- API key management for integrations
```

---

## Performance Considerations

### Optimization Performance
```
Target Metrics:
  - Weekly optimization (50-100 requests): < 30 seconds
  - Daily optimization (10-20 requests): < 10 seconds
  - Real-time replan (emergency): < 5 seconds

Strategies:
  - Time-boxing solver (max time limits)
  - Warm starts (use previous solution)
  - Parallel simulation execution
  - Caching of static data (sections, train schedules)
```

### API Performance
```
Target Metrics:
  - API response time: < 200ms (p95)
  - Database query time: < 50ms (p95)
  - Cache hit rate: > 80%

Strategies:
  - Database indexing (see schema)
  - Redis caching
  - Query optimization
  - Pagination for large datasets
  - Connection pooling
```

### Frontend Performance
```
Target Metrics:
  - First Contentful Paint: < 1.5s
  - Time to Interactive: < 3s
  - Lighthouse score: > 90

Strategies:
  - Code splitting
  - Lazy loading
  - Memoization
  - Virtual scrolling (large tables)
  - WebSocket for real-time updates (not polling)
```

---

## Monitoring & Observability

### Application Metrics
```
Key Metrics:
  - Optimization success rate
  - Optimization time (avg, p95, p99)
  - API response times
  - Error rates
  - Cache hit rates
  - Active users
  - WebSocket connections

Tools:
  - Prometheus (metrics collection)
  - Grafana (visualization)
  - Custom dashboards
```

### Business Metrics
```
Key Metrics:
  - Total maintenance requests (daily, weekly)
  - Scheduling rate (% of requests scheduled)
  - Asset availability improvement
  - Time saved through coordination
  - Number of combined blocks
  - Train impact (affected trains per block)
  - Department utilization

Dashboards:
  - Real-time operations dashboard
  - Historical trends
  - Department-wise analytics
```

### Logging
```
Log Levels:
  - DEBUG: Detailed diagnostic info
  - INFO: General information
  - WARNING: Warning messages
  - ERROR: Error events
  - CRITICAL: Critical issues

Structured Logging:
  - JSON format
  - Correlation IDs (trace requests)
  - Context information (user, entity)

Log Storage:
  - ELK Stack or CloudWatch
  - Retention: 30 days
  - Searchable and filterable
```

---

## Scalability Considerations

### Horizontal Scaling
```
Stateless Services:
  - API Gateway: Can scale horizontally
  - Optimization Agent: Can run multiple workers
  - Celery workers: Distributed task execution

Database:
  - Read replicas for analytics
  - Connection pooling
  - Query optimization

Caching:
  - Redis cluster mode
  - Distributed caching
```

### Load Distribution
```
- Load balancer for API requests
- Message queue for async tasks
- Background workers for long-running jobs
- Rate limiting per user/API key
```

---

This architecture provides a solid foundation for building PS 26027. Next, let's create the detailed phase-wise implementation plan!
