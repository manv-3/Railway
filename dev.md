# Railway AI Analysis - Development Guide

## Development Environment Setup

### Prerequisites
- Python 3.10 or higher
- Node.js 18+ and npm/yarn
- Docker and Docker Compose
- Git
- PostgreSQL 14+ (or use Docker)
- Redis 7+ (or use Docker)

### Initial Setup

#### 1. Clone Repository
```bash
git clone <repository-url>
cd railway-ai-system
```

#### 2. Backend Setup (Python)
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Install development dependencies
pip install -r requirements-dev.txt
```

#### 3. Frontend Setup (React)
```bash
cd frontend
npm install
# or
yarn install
```

#### 4. Database Setup
```bash
# Using Docker Compose (recommended)
docker-compose up -d postgres redis

# Or install locally and run migrations
python manage.py migrate
```

#### 5. Environment Configuration
```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your configuration
# DB_HOST, DB_PORT, REDIS_URL, etc.
```

---

## Project Structure

```
railway-ai-system/
├── backend/
│   ├── api/                      # FastAPI application
│   │   ├── main.py              # Application entry point
│   │   ├── routes/              # API route handlers
│   │   │   ├── block_planning.py
│   │   │   ├── eta_prediction.py
│   │   │   └── simulation.py
│   │   ├── models/              # Pydantic models
│   │   ├── services/            # Business logic
│   │   └── middleware/          # Auth, CORS, etc.
│   ├── agents/                   # Multi-agent system
│   │   ├── data_agent.py
│   │   ├── optimization_agent.py
│   │   ├── prediction_agent.py
│   │   ├── coordination_agent.py
│   │   ├── explainability_agent.py
│   │   └── simulation_agent.py
│   ├── ml/                       # Machine learning models
│   │   ├── priority_scorer.py   # Maintenance priority scoring
│   │   ├── eta_predictor.py     # ETA prediction models
│   │   ├── feature_engineering.py
│   │   └── model_registry.py
│   ├── optimization/            # Constraint optimization
│   │   ├── block_scheduler.py   # OR-Tools implementation
│   │   ├── constraints.py       # Constraint definitions
│   │   └── objectives.py        # Optimization objectives
│   ├── data/                    # Data layer
│   │   ├── models.py           # SQLAlchemy ORM models
│   │   ├── repositories.py     # Data access layer
│   │   └── generators/         # Synthetic data generators
│   │       ├── tms_generator.py
│   │       ├── smms_generator.py
│   │       ├── tdms_generator.py
│   │       └── coa_generator.py
│   ├── utils/
│   │   ├── logger.py
│   │   ├── config.py
│   │   └── validators.py
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── common/         # Reusable components
│   │   │   ├── block-planning/ # PS 26027 components
│   │   │   │   ├── CorridorMap.tsx
│   │   │   │   ├── MaintenanceList.tsx
│   │   │   │   ├── BlockTimeline.tsx
│   │   │   │   ├── OptimizationDashboard.tsx
│   │   │   │   └── WhatIfSimulator.tsx
│   │   │   └── eta-prediction/  # PS 26028 components
│   │   │       ├── TrainMap.tsx
│   │   │       ├── ETADisplay.tsx
│   │   │       ├── PredictionTimeline.tsx
│   │   │       └── ConfidenceIndicator.tsx
│   │   ├── pages/              # Page components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── services/           # API client services
│   │   ├── store/              # State management
│   │   ├── utils/
│   │   └── types/              # TypeScript type definitions
│   ├── public/
│   ├── package.json
│   └── tsconfig.json
├── infrastructure/
│   ├── docker/
│   │   ├── Dockerfile.backend
│   │   ├── Dockerfile.frontend
│   │   └── docker-compose.yml
│   ├── kubernetes/             # K8s manifests (optional)
│   └── terraform/              # Infrastructure as code (optional)
├── docs/
│   ├── api/                    # API documentation
│   ├── architecture/           # Architecture diagrams
│   ├── user-guides/           # User manuals
│   └── development/           # Developer guides
├── scripts/
│   ├── generate_data.py       # Synthetic data generation
│   ├── train_models.py        # ML model training
│   ├── run_tests.sh           # Test execution
│   └── deploy.sh              # Deployment script
├── .github/
│   └── workflows/             # GitHub Actions CI/CD
├── .env.example
├── .gitignore
├── README.md
├── context.md                 # This file
├── agent.md                   # Agent architecture
└── dev.md                     # Development guide
```

---

## Core Components Implementation

### 1. Data Models (SQLAlchemy)

#### database/models.py
```python
from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class MaintenanceRequest(Base):
    __tablename__ = 'maintenance_requests'
    
    id = Column(Integer, primary_key=True)
    request_id = Column(String(50), unique=True, nullable=False)
    department = Column(String(20))  # TMS, SMMS, TDMS
    section_id = Column(String(50), ForeignKey('sections.id'))
    asset_type = Column(String(50))  # track, signal, ohe
    defect_type = Column(String(100))
    severity = Column(String(20))  # critical, high, medium, low
    priority_score = Column(Float)
    estimated_duration_minutes = Column(Integer)
    requested_date = Column(DateTime)
    due_date = Column(DateTime)
    status = Column(String(20))  # pending, scheduled, completed, cancelled
    metadata = Column(JSON)
    
    section = relationship("Section")
    assigned_blocks = relationship("MaintenanceBlock", back_populates="maintenance")

class Section(Base):
    __tablename__ = 'sections'
    
    id = Column(String(50), primary_key=True)
    name = Column(String(100))
    start_station = Column(String(50))
    end_station = Column(String(50))
    distance_km = Column(Float)
    track_type = Column(String(20))  # single, double, multiple
    electrified = Column(Boolean)
    max_speed = Column(Integer)
    metadata = Column(JSON)

class MaintenanceBlock(Base):
    __tablename__ = 'maintenance_blocks'
    
    id = Column(Integer, primary_key=True)
    block_id = Column(String(50), unique=True)
    section_id = Column(String(50), ForeignKey('sections.id'))
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    block_type = Column(String(50))  # engineering, signal, power, combined
    status = Column(String(20))  # planned, approved, active, completed
    created_by = Column(String(50))  # AI or human
    approved_by = Column(String(50))
    metadata = Column(JSON)
    
    section = relationship("Section")
    maintenance = relationship("MaintenanceRequest", back_populates="assigned_blocks")
    affected_trains = relationship("TrainImpact")

class Train(Base):
    __tablename__ = 'trains'
    
    id = Column(Integer, primary_key=True)
    train_number = Column(String(20), unique=True)
    train_name = Column(String(100))
    train_type = Column(String(20))  # passenger, freight, express
    source_station = Column(String(50))
    destination_station = Column(String(50))
    scheduled_departure = Column(DateTime)
    scheduled_arrival = Column(DateTime)
    route = Column(JSON)  # List of stations with scheduled times

class TrainMovement(Base):
    __tablename__ = 'train_movements'
    
    id = Column(Integer, primary_key=True)
    train_id = Column(Integer, ForeignKey('trains.id'))
    timestamp = Column(DateTime, nullable=False)
    current_station = Column(String(50))
    current_section = Column(String(50))
    latitude = Column(Float)
    longitude = Column(Float)
    speed = Column(Float)
    delay_minutes = Column(Integer)
    status = Column(String(20))  # on_time, delayed, cancelled
    
    train = relationship("Train")
    predictions = relationship("ETAPrediction")

class ETAPrediction(Base):
    __tablename__ = 'eta_predictions'
    
    id = Column(Integer, primary_key=True)
    movement_id = Column(Integer, ForeignKey('train_movements.id'))
    station = Column(String(50))
    scheduled_arrival = Column(DateTime)
    predicted_arrival = Column(DateTime)
    confidence_lower = Column(DateTime)  # Lower bound of confidence interval
    confidence_upper = Column(DateTime)  # Upper bound
    prediction_timestamp = Column(DateTime)
    model_version = Column(String(20))
    features_used = Column(JSON)
    
    movement = relationship("TrainMovement")

class TrainImpact(Base):
    __tablename__ = 'train_impacts'
    
    id = Column(Integer, primary_key=True)
    block_id = Column(Integer, ForeignKey('maintenance_blocks.id'))
    train_id = Column(Integer, ForeignKey('trains.id'))
    impact_type = Column(String(20))  # delay, reroute, cancel
    estimated_delay_minutes = Column(Integer)
    
    block = relationship("MaintenanceBlock")
    train = relationship("Train")
```

### 2. Optimization Engine (OR-Tools CP-SAT)

#### optimization/block_scheduler.py
```python
from ortools.sat.python import cp_model
from datetime import datetime, timedelta
from typing import List, Dict, Tuple
import logging

logger = logging.getLogger(__name__)

class BlockScheduler:
    def __init__(self, maintenance_requests: List[Dict], 
                 train_schedule: List[Dict],
                 available_windows: List[Tuple[datetime, datetime]]):
        self.requests = maintenance_requests
        self.trains = train_schedule
        self.windows = available_windows
        self.model = cp_model.CpModel()
        
    def create_optimization_problem(self):
        """Create CP-SAT optimization problem"""
        # Decision variables
        self.block_vars = {}
        self.start_times = {}
        self.end_times = {}
        self.assigned = {}
        
        # Time discretization (15-minute intervals)
        time_slots = self._discretize_time()
        
        # Create variables for each maintenance request
        for req in self.requests:
            req_id = req['id']
            duration_slots = req['duration_minutes'] // 15
            
            # Start time variable
            self.start_times[req_id] = self.model.NewIntVar(
                0, len(time_slots) - duration_slots, f'start_{req_id}'
            )
            
            # Assignment variable (is this request scheduled?)
            self.assigned[req_id] = self.model.NewBoolVar(f'assigned_{req_id}')
        
        # Add constraints
        self._add_constraints()
        
        # Define objectives
        self._define_objectives()
        
    def _add_constraints(self):
        """Add scheduling constraints"""
        # 1. No overlap within same section
        for section_id in self._get_unique_sections():
            requests_in_section = [r for r in self.requests if r['section_id'] == section_id]
            for i, req1 in enumerate(requests_in_section):
                for req2 in requests_in_section[i+1:]:
                    self._add_no_overlap_constraint(req1['id'], req2['id'])
        
        # 2. Respect available windows
        for req in self.requests:
            self._add_window_constraint(req['id'])
        
        # 3. Minimize train conflicts
        for req in self.requests:
            self._add_train_conflict_constraint(req['id'])
        
        # 4. Department coordination (bonus for same section/time)
        self._add_coordination_bonus()
    
    def _add_no_overlap_constraint(self, req1_id: str, req2_id: str):
        """Ensure two maintenance tasks don't overlap"""
        req1 = next(r for r in self.requests if r['id'] == req1_id)
        req2 = next(r for r in self.requests if r['id'] == req2_id)
        
        duration1 = req1['duration_minutes'] // 15
        duration2 = req2['duration_minutes'] // 15
        
        # Either req1 ends before req2 starts OR req2 ends before req1 starts
        end1_before_start2 = self.model.NewBoolVar(f'{req1_id}_before_{req2_id}')
        
        self.model.Add(
            self.start_times[req1_id] + duration1 <= self.start_times[req2_id]
        ).OnlyEnforceIf(end1_before_start2)
        
        self.model.Add(
            self.start_times[req2_id] + duration2 <= self.start_times[req1_id]
        ).OnlyEnforceIf(end1_before_start2.Not())
    
    def _define_objectives(self):
        """Multi-objective optimization"""
        # Objective 1: Maximize scheduled maintenance (weight: 1000)
        total_scheduled = sum(self.assigned[r['id']] for r in self.requests)
        
        # Objective 2: Minimize total block time (weight: 100)
        # This encourages combining maintenance tasks
        total_block_time = sum(
            self.assigned[r['id']] * (r['duration_minutes'] // 15) 
            for r in self.requests
        )
        
        # Objective 3: Prioritize high-priority maintenance (weight: 500)
        priority_coverage = sum(
            self.assigned[r['id']] * int(r['priority_score'])
            for r in self.requests
        )
        
        # Objective 4: Minimize train impacts (weight: 300)
        train_conflicts = self._calculate_train_conflicts()
        
        # Combined objective
        self.model.Maximize(
            1000 * total_scheduled +
            500 * priority_coverage -
            100 * total_block_time -
            300 * train_conflicts
        )
    
    def solve(self, time_limit_seconds: int = 30) -> Dict:
        """Solve the optimization problem"""
        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = time_limit_seconds
        solver.parameters.log_search_progress = True
        
        logger.info("Starting optimization...")
        status = solver.Solve(self.model)
        
        if status in [cp_model.OPTIMAL, cp_model.FEASIBLE]:
            solution = self._extract_solution(solver)
            return {
                'status': 'success',
                'solution': solution,
                'metrics': self._calculate_metrics(solution),
                'solver_time': solver.WallTime()
            }
        else:
            return {
                'status': 'failed',
                'reason': self._get_status_string(status)
            }
    
    def _extract_solution(self, solver) -> List[Dict]:
        """Extract scheduled blocks from solution"""
        blocks = []
        time_slots = self._discretize_time()
        
        for req in self.requests:
            if solver.Value(self.assigned[req['id']]):
                start_slot = solver.Value(self.start_times[req['id']])
                start_time = time_slots[start_slot]
                end_time = start_time + timedelta(minutes=req['duration_minutes'])
                
                blocks.append({
                    'maintenance_request_id': req['id'],
                    'section_id': req['section_id'],
                    'department': req['department'],
                    'start_time': start_time,
                    'end_time': end_time,
                    'duration_minutes': req['duration_minutes'],
                    'priority_score': req['priority_score']
                })
        
        # Group overlapping blocks on same section (combined blocks)
        return self._group_blocks(blocks)
    
    def _group_blocks(self, blocks: List[Dict]) -> List[Dict]:
        """Group maintenance tasks that can be performed simultaneously"""
        grouped = []
        processed = set()
        
        for i, block in enumerate(blocks):
            if i in processed:
                continue
            
            group = [block]
            section = block['section_id']
            start = block['start_time']
            end = block['end_time']
            
            # Find other blocks on same section with time overlap
            for j, other in enumerate(blocks[i+1:], start=i+1):
                if j in processed:
                    continue
                    
                if (other['section_id'] == section and 
                    self._time_overlaps(start, end, other['start_time'], other['end_time'])):
                    group.append(other)
                    processed.add(j)
                    # Extend time window
                    start = min(start, other['start_time'])
                    end = max(end, other['end_time'])
            
            grouped.append({
                'block_id': f"BLK_{len(grouped)+1:04d}",
                'section_id': section,
                'start_time': start,
                'end_time': end,
                'total_duration_minutes': int((end - start).total_seconds() / 60),
                'maintenance_tasks': group,
                'departments': list(set(t['department'] for t in group)),
                'is_combined': len(group) > 1
            })
            
            processed.add(i)
        
        return grouped
    
    def _calculate_metrics(self, solution: List[Dict]) -> Dict:
        """Calculate optimization metrics"""
        total_requests = len(self.requests)
        scheduled_requests = sum(len(block['maintenance_tasks']) for block in solution)
        
        # Calculate asset availability improvement
        separate_duration = sum(r['duration_minutes'] for r in self.requests)
        combined_duration = sum(block['total_duration_minutes'] for block in solution)
        
        # Calculate train impacts
        train_conflicts = self._count_train_conflicts(solution)
        
        return {
            'total_maintenance_requests': total_requests,
            'scheduled_requests': scheduled_requests,
            'scheduling_rate': scheduled_requests / total_requests,
            'total_blocks_created': len(solution),
            'combined_blocks': sum(1 for b in solution if b['is_combined']),
            'separate_maintenance_hours': separate_duration / 60,
            'optimized_block_hours': combined_duration / 60,
            'time_saved_hours': (separate_duration - combined_duration) / 60,
            'asset_availability_improvement_percent': 
                ((separate_duration - combined_duration) / separate_duration * 100),
            'train_conflicts': train_conflicts,
            'high_priority_coverage': self._calculate_priority_coverage(solution)
        }
    
    def _discretize_time(self) -> List[datetime]:
        """Create 15-minute time slots"""
        # Implementation details
        pass
    
    def _time_overlaps(self, start1, end1, start2, end2) -> bool:
        """Check if two time windows overlap"""
        return start1 < end2 and start2 < end1
    
    # Additional helper methods...
```

### 3. ETA Prediction Model

#### ml/eta_predictor.py
```python
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error
import xgboost as xgb
import joblib
from typing import Dict, List, Tuple
import logging

logger = logging.getLogger(__name__)

class ETAPredictor:
    def __init__(self, model_type='xgboost'):
        self.model_type = model_type
        self.model = None
        self.feature_names = []
        
    def prepare_features(self, train_data: pd.DataFrame) -> pd.DataFrame:
        """Feature engineering for ETA prediction"""
        features = train_data.copy()
        
        # Time-based features
        features['hour'] = pd.to_datetime(features['timestamp']).dt.hour
        features['day_of_week'] = pd.to_datetime(features['timestamp']).dt.dayofweek
        features['is_weekend'] = features['day_of_week'].isin([5, 6]).astype(int)
        features['is_peak_hour'] = features['hour'].isin([7, 8, 9, 17, 18, 19]).astype(int)
        
        # Current delay features
        features['current_delay_minutes'] = features['current_delay_minutes'].fillna(0)
        features['delay_squared'] = features['current_delay_minutes'] ** 2
        
        # Distance features
        features['remaining_distance_km'] = features['remaining_distance_km'].fillna(0)
        features['distance_to_delay_ratio'] = features['remaining_distance_km'] / (features['current_delay_minutes'] + 1)
        
        # Historical performance features (requires aggregation)
        features = self._add_historical_features(features)
        
        # Train-specific features
        features['is_passenger'] = (features['train_type'] == 'passenger').astype(int)
        features['is_express'] = (features['train_type'] == 'express').astype(int)
        features['is_freight'] = (features['train_type'] == 'freight').astype(int)
        
        # Section characteristics
        features = self._add_section_features(features)
        
        # Network context features
        features = self._add_network_features(features)
        
        # Weather features (if available)
        if 'weather_condition' in features.columns:
            features = pd.get_dummies(features, columns=['weather_condition'], prefix='weather')
        
        self.feature_names = [col for col in features.columns if col not in [
            'actual_arrival_time', 'timestamp', 'train_id', 'station'
        ]]
        
        return features[self.feature_names]
    
    def _add_historical_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add historical performance patterns"""
        # Average delay for this train on this section historically
        df['avg_section_delay'] = df.groupby(['train_number', 'section_id'])['current_delay_minutes'].transform('mean')
        
        # Average delay for this section at this time of day
        df['avg_time_delay'] = df.groupby(['section_id', 'hour'])['current_delay_minutes'].transform('mean')
        
        # Day-of-week patterns
        df['avg_dow_delay'] = df.groupby(['section_id', 'day_of_week'])['current_delay_minutes'].transform('mean')
        
        return df
    
    def _add_section_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add section-specific characteristics"""
        # These would come from infrastructure database
        # Simplified example:
        df['section_speed_limit'] = df['section_id'].map(self._get_section_speeds())
        df['section_is_single_track'] = df['section_id'].map(self._get_track_types())
        df['section_has_restrictions'] = df['section_id'].map(self._get_restrictions())
        
        return df
    
    def _add_network_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add network context features"""
        # Traffic density: number of trains in same corridor
        df['traffic_density'] = df.groupby(['section_id', 'hour'])['train_id'].transform('count')
        
        # Preceding train delay (if available)
        df['preceding_train_delay'] = 0  # Simplified - would need temporal join
        
        return df
    
    def train(self, X: pd.DataFrame, y: pd.Series, test_size=0.2) -> Dict:
        """Train the ETA prediction model"""
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42
        )
        
        if self.model_type == 'xgboost':
            self.model = xgb.XGBRegressor(
                n_estimators=200,
                max_depth=8,
                learning_rate=0.1,
                subsample=0.8,
                colsample_bytree=0.8,
                random_state=42,
                n_jobs=-1
            )
        elif self.model_type == 'gbm':
            self.model = GradientBoostingRegressor(
                n_estimators=200,
                max_depth=6,
                learning_rate=0.1,
                random_state=42
            )
        
        logger.info(f"Training {self.model_type} model...")
        self.model.fit(X_train, y_train)
        
        # Evaluate
        train_pred = self.model.predict(X_train)
        test_pred = self.model.predict(X_test)
        
        metrics = {
            'train_mae': mean_absolute_error(y_train, train_pred),
            'test_mae': mean_absolute_error(y_test, test_pred),
            'train_rmse': np.sqrt(mean_squared_error(y_train, train_pred)),
            'test_rmse': np.sqrt(mean_squared_error(y_test, test_pred)),
            'feature_importance': self._get_feature_importance()
        }
        
        logger.info(f"Model trained. Test MAE: {metrics['test_mae']:.2f} minutes")
        
        return metrics
    
    def predict(self, X: pd.DataFrame) -> np.ndarray:
        """Predict ETA delay"""
        if self.model is None:
            raise ValueError("Model not trained yet")
        
        return self.model.predict(X)
    
    def predict_with_confidence(self, X: pd.DataFrame, confidence=0.9) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """Predict with confidence intervals"""
        predictions = self.predict(X)
        
        # Simple confidence intervals based on historical error distribution
        # More sophisticated: use quantile regression or ensemble uncertainty
        error_std = self._estimate_prediction_uncertainty(X)
        z_score = 1.645 if confidence == 0.9 else 1.96  # 90% or 95%
        
        lower = predictions - z_score * error_std
        upper = predictions + z_score * error_std
        
        return predictions, lower, upper
    
    def _get_feature_importance(self) -> Dict:
        """Get feature importance scores"""
        if hasattr(self.model, 'feature_importances_'):
            importances = self.model.feature_importances_
            return dict(zip(self.feature_names, importances))
        return {}
    
    def _estimate_prediction_uncertainty(self, X: pd.DataFrame) -> np.ndarray:
        """Estimate prediction uncertainty"""
        # Simplified - could use quantile regression, dropout, or ensemble methods
        base_uncertainty = 5.0  # Base 5 minutes uncertainty
        
        # Increase uncertainty for longer predictions
        distance_factor = X['remaining_distance_km'] / 100
        
        # Increase uncertainty for unusual conditions
        delay_factor = X['current_delay_minutes'] / 60
        
        return base_uncertainty * (1 + distance_factor + delay_factor)
    
    def save_model(self, path: str):
        """Save model to disk"""
        joblib.dump({
            'model': self.model,
            'feature_names': self.feature_names,
            'model_type': self.model_type
        }, path)
        logger.info(f"Model saved to {path}")
    
    def load_model(self, path: str):
        """Load model from disk"""
        data = joblib.load(path)
        self.model = data['model']
        self.feature_names = data['feature_names']
        self.model_type = data['model_type']
        logger.info(f"Model loaded from {path}")
    
    # Additional helper methods...
    def _get_section_speeds(self) -> Dict:
        # Return mapping of section_id to speed limits
        pass
    
    def _get_track_types(self) -> Dict:
        # Return mapping of section_id to track type
        pass
    
    def _get_restrictions(self) -> Dict:
        # Return mapping of section_id to restrictions
        pass
```

### 4. Explainability Agent

#### agents/explainability_agent.py
```python
from typing import Dict, List
import shap
import numpy as np

class ExplainabilityAgent:
    def __init__(self):
        self.explainers = {}
    
    def explain_block_decision(self, block: Dict, all_requests: List[Dict], 
                               optimization_result: Dict) -> Dict:
        """Generate human-readable explanation for block scheduling decision"""
        
        explanations = []
        
        # 1. Why was this block created?
        if block['is_combined']:
            explanations.append({
                'factor': 'Multi-department Coordination',
                'description': f"Combined {len(block['maintenance_tasks'])} maintenance tasks from "
                              f"{', '.join(block['departments'])} departments",
                'impact': 'Positive',
                'benefit': f"Saved {self._calculate_time_saved(block)} hours of separate blocks"
            })
        
        # 2. Priority factors
        avg_priority = np.mean([task['priority_score'] for task in block['maintenance_tasks']])
        if avg_priority > 80:
            explanations.append({
                'factor': 'High Priority Maintenance',
                'description': f"Average priority score: {avg_priority:.1f}/100",
                'impact': 'Critical',
                'benefit': 'Addresses safety-critical or urgent maintenance needs'
            })
        
        # 3. Train impact analysis
        train_conflicts = self._analyze_train_conflicts(block)
        explanations.append({
            'factor': 'Train Impact',
            'description': f"{train_conflicts['affected_trains']} trains affected",
            'impact': 'Low' if train_conflicts['affected_trains'] < 3 else 'Medium',
            'benefit': f"{train_conflicts['passenger_trains']} passenger, "
                      f"{train_conflicts['freight_trains']} freight"
        })
        
        # 4. Time window utilization
        explanations.append({
            'factor': 'Optimal Time Window',
            'description': f"Scheduled during low-traffic period",
            'impact': 'Positive',
            'benefit': 'Minimizes operational disruption'
        })
        
        # 5. Asset availability
        availability_gain = self._calculate_availability_gain(block, optimization_result)
        explanations.append({
            'factor': 'Asset Availability',
            'description': f"Increases available operational time",
            'impact': 'Positive',
            'benefit': f"+{availability_gain:.1f} hours gained"
        })
        
        return {
            'block_id': block['block_id'],
            'explanation_summary': self._generate_summary(explanations),
            'detailed_factors': explanations,
            'confidence': self._calculate_confidence(block),
            'alternatives_considered': self._describe_alternatives(block, all_requests)
        }
    
    def explain_eta_prediction(self, prediction: Dict, features: Dict, 
                                model) -> Dict:
        """Explain ETA prediction using SHAP or similar"""
        
        # Use SHAP for ML model explanation
        if model and hasattr(model, 'predict'):
            shap_values = self._calculate_shap_values(features, model)
            top_factors = self._get_top_contributing_factors(shap_values, features)
        else:
            top_factors = []
        
        explanations = []
        
        # Current delay contribution
        if features.get('current_delay_minutes', 0) > 0:
            explanations.append({
                'factor': 'Current Delay',
                'value': f"{features['current_delay_minutes']} minutes",
                'contribution': 'Major contributor to predicted delay',
                'impact': 'Negative'
            })
        
        # Historical patterns
        if features.get('avg_section_delay', 0) > 10:
            explanations.append({
                'factor': 'Historical Section Performance',
                'value': f"Average {features['avg_section_delay']:.0f} min delay",
                'contribution': 'This section typically experiences delays',
                'impact': 'Negative'
            })
        
        # Traffic density
        if features.get('traffic_density', 0) > 5:
            explanations.append({
                'factor': 'High Traffic Density',
                'value': f"{features['traffic_density']} trains in corridor",
                'contribution': 'Congestion may cause additional delays',
                'impact': 'Negative'
            })
        
        # Weather conditions
        if features.get('weather_rain', 0) == 1:
            explanations.append({
                'factor': 'Weather Conditions',
                'value': 'Rain detected',
                'contribution': 'May require speed restrictions',
                'impact': 'Negative'
            })
        
        # Maintenance blocks
        if features.get('maintenance_blocks_ahead', 0) > 0:
            explanations.append({
                'factor': 'Scheduled Maintenance',
                'value': f"{features['maintenance_blocks_ahead']} blocks ahead",
                'contribution': 'May cause additional waiting time',
                'impact': 'Negative'
            })
        
        return {
            'predicted_delay_minutes': prediction['delay_minutes'],
            'confidence_range': f"±{prediction.get('uncertainty', 0):.0f} minutes",
            'main_contributing_factors': explanations,
            'shap_values': top_factors,
            'recommendation': self._generate_eta_recommendation(prediction, explanations)
        }
    
    def _calculate_shap_values(self, features: Dict, model) -> Dict:
        """Calculate SHAP values for feature importance"""
        try:
            explainer = shap.TreeExplainer(model)
            shap_values = explainer.shap_values(features)
            return shap_values
        except Exception as e:
            return {}
    
    def _generate_summary(self, explanations: List[Dict]) -> str:
        """Generate concise summary explanation"""
        positive_factors = [e for e in explanations if e['impact'] == 'Positive']
        critical_factors = [e for e in explanations if e['impact'] == 'Critical']
        
        summary = f"Recommended because: "
        reasons = []
        
        if critical_factors:
            reasons.append("addresses critical maintenance needs")
        if any(e['factor'] == 'Multi-department Coordination' for e in explanations):
            reasons.append("coordinates multiple departments efficiently")
        if any(e['factor'] == 'Train Impact' and e['impact'] == 'Low' for e in explanations):
            reasons.append("minimizes train disruptions")
        
        return summary + ", ".join(reasons) + "."
    
    def _calculate_confidence(self, block: Dict) -> float:
        """Calculate confidence score for block recommendation"""
        # Based on various factors
        base_confidence = 0.7
        
        # Higher confidence if combining multiple tasks
        if block['is_combined']:
            base_confidence += 0.1
        
        # Higher confidence if high priority
        avg_priority = np.mean([task['priority_score'] for task in block['maintenance_tasks']])
        if avg_priority > 80:
            base_confidence += 0.1
        
        # Lower confidence if many train conflicts
        # (would need actual implementation)
        
        return min(base_confidence, 0.95)
    
    # Additional helper methods...
```

### 5. API Routes (FastAPI)

#### api/routes/block_planning.py
```python
from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import logging

from agents.optimization_agent import OptimizationAgent
from agents.explainability_agent import ExplainabilityAgent
from data.repositories import MaintenanceRepository, BlockRepository
from utils.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/block-planning", tags=["Block Planning"])

class MaintenanceRequestCreate(BaseModel):
    department: str
    section_id: str
    asset_type: str
    defect_type: str
    severity: str
    estimated_duration_minutes: int
    due_date: datetime
    metadata: Optional[dict] = {}

class OptimizationRequest(BaseModel):
    start_date: datetime
    end_date: datetime
    section_ids: Optional[List[str]] = None
    departments: Optional[List[str]] = None
    min_priority: Optional[float] = 0
    max_time_seconds: Optional[int] = 30

@router.post("/maintenance-requests")
async def create_maintenance_request(
    request: MaintenanceRequestCreate,
    user = Depends(get_current_user)
):
    """Create a new maintenance request"""
    try:
        repo = MaintenanceRepository()
        maintenance_req = repo.create(request.dict())
        
        logger.info(f"Created maintenance request {maintenance_req['id']} by {user['username']}")
        
        return {
            "status": "success",
            "maintenance_request": maintenance_req
        }
    except Exception as e:
        logger.error(f"Error creating maintenance request: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/optimize")
async def optimize_blocks(
    request: OptimizationRequest,
    background_tasks: BackgroundTasks,
    user = Depends(get_current_user)
):
    """Run block optimization"""
    try:
        # Get pending maintenance requests
        repo = MaintenanceRepository()
        maintenance_requests = repo.get_pending_requests(
            start_date=request.start_date,
            end_date=request.end_date,
            section_ids=request.section_ids,
            departments=request.departments,
            min_priority=request.min_priority
        )
        
        if not maintenance_requests:
            return {
                "status": "success",
                "message": "No pending maintenance requests to schedule",
                "blocks": []
            }
        
        # Run optimization
        optimization_agent = OptimizationAgent()
        result = optimization_agent.optimize(
            maintenance_requests=maintenance_requests,
            max_time_seconds=request.max_time_seconds
        )
        
        if result['status'] == 'success':
            # Generate explanations
            explainability_agent = ExplainabilityAgent()
            explanations = [
                explainability_agent.explain_block_decision(
                    block, maintenance_requests, result
                )
                for block in result['solution']
            ]
            
            # Save results
            block_repo = BlockRepository()
            saved_blocks = block_repo.save_optimized_blocks(
                result['solution'], 
                created_by=user['username']
            )
            
            logger.info(f"Optimization completed. Created {len(saved_blocks)} blocks")
            
            return {
                "status": "success",
                "blocks": saved_blocks,
                "metrics": result['metrics'],
                "explanations": explanations,
                "solver_time_seconds": result['solver_time']
            }
        else:
            raise HTTPException(status_code=500, detail=result['reason'])
            
    except Exception as e:
        logger.error(f"Error in optimization: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/blocks")
async def get_blocks(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    section_id: Optional[str] = None,
    status: Optional[str] = None
):
    """Get scheduled blocks"""
    try:
        repo = BlockRepository()
        blocks = repo.get_blocks(
            start_date=start_date,
            end_date=end_date,
            section_id=section_id,
            status=status
        )
        
        return {
            "status": "success",
            "blocks": blocks,
            "count": len(blocks)
        }
    except Exception as e:
        logger.error(f"Error fetching blocks: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/blocks/{block_id}/approve")
async def approve_block(
    block_id: str,
    user = Depends(get_current_user)
):
    """Approve a planned maintenance block"""
    try:
        repo = BlockRepository()
        block = repo.approve_block(block_id, approved_by=user['username'])
        
        logger.info(f"Block {block_id} approved by {user['username']}")
        
        return {
            "status": "success",
            "block": block
        }
    except Exception as e:
        logger.error(f"Error approving block: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/what-if-simulation")
async def run_simulation(
    request: OptimizationRequest,
    scenario_modifications: dict
):
    """Run what-if simulation with modified parameters"""
    try:
        from agents.simulation_agent import SimulationAgent
        
        simulation_agent = SimulationAgent()
        result = simulation_agent.run_scenario(
            base_request=request,
            modifications=scenario_modifications
        )
        
        return {
            "status": "success",
            "simulation_result": result
        }
    except Exception as e:
        logger.error(f"Error in simulation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
```

---

## Frontend Components

### React Component Example - Corridor Map

```typescript
// frontend/src/components/block-planning/CorridorMap.tsx

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import { Block, Section, MaintenanceRequest } from '../../types';
import { getColorForDepartment } from '../../utils/colors';

interface CorridorMapProps {
  sections: Section[];
  blocks: Block[];
  selectedBlock?: Block | null;
  onBlockClick?: (block: Block) => void;
}

export const CorridorMap: React.FC<CorridorMapProps> = ({
  sections,
  blocks,
  selectedBlock,
  onBlockClick
}) => {
  const [map, setMap] = useState<any>(null);
  
  // Center map on railway corridor
  const center = sections.length > 0 
    ? [sections[0].start_lat, sections[0].start_lon]
    : [28.6139, 77.2090]; // Default: New Delhi
  
  useEffect(() => {
    if (map && selectedBlock) {
      // Pan to selected block
      const section = sections.find(s => s.id === selectedBlock.section_id);
      if (section) {
        map.flyTo([section.start_lat, section.start_lon], 12);
      }
    }
  }, [selectedBlock, map, sections]);
  
  return (
    <MapContainer
      center={center as [number, number]}
      zoom={10}
      style={{ height: '600px', width: '100%' }}
      whenCreated={setMap}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      
      {/* Draw railway sections */}
      {sections.map(section => (
        <Polyline
          key={section.id}
          positions={[
            [section.start_lat, section.start_lon],
            [section.end_lat, section.end_lon]
          ]}
          color="#333"
          weight={3}
        />
      ))}
      
      {/* Draw maintenance blocks */}
      {blocks.map(block => {
        const section = sections.find(s => s.id === block.section_id);
        if (!section) return null;
        
        const isSelected = selectedBlock?.block_id === block.block_id;
        const color = block.is_combined ? '#FF5722' : getColorForDepartment(block.departments[0]);
        
        return (
          <Marker
            key={block.block_id}
            position={[
              (section.start_lat + section.end_lat) / 2,
              (section.start_lon + section.end_lon) / 2
            ]}
            eventHandlers={{
              click: () => onBlockClick?.(block)
            }}
          >
            <Popup>
              <div>
                <h3>{block.block_id}</h3>
                <p><strong>Section:</strong> {section.name}</p>
                <p><strong>Duration:</strong> {block.total_duration_minutes} min</p>
                <p><strong>Departments:</strong> {block.departments.join(', ')}</p>
                <p><strong>Tasks:</strong> {block.maintenance_tasks.length}</p>
                {block.is_combined && (
                  <p style={{ color: '#FF5722', fontWeight: 'bold' }}>
                    ✓ Combined Block
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};
```

---

## Testing Strategy

### Unit Tests Example

```python
# backend/tests/unit/test_block_scheduler.py

import pytest
from datetime import datetime, timedelta
from optimization.block_scheduler import BlockScheduler

class TestBlockScheduler:
    
    def test_simple_scheduling(self):
        """Test basic block scheduling"""
        requests = [
            {
                'id': 'REQ001',
                'section_id': 'SEC001',
                'department': 'TMS',
                'duration_minutes': 120,
                'priority_score': 85,
                'due_date': datetime.now() + timedelta(days=1)
            }
        ]
        
        scheduler = BlockScheduler(
            maintenance_requests=requests,
            train_schedule=[],
            available_windows=[(
                datetime.now(),
                datetime.now() + timedelta(hours=4)
            )]
        )
        
        scheduler.create_optimization_problem()
        result = scheduler.solve(time_limit_seconds=10)
        
        assert result['status'] == 'success'
        assert len(result['solution']) > 0
        assert result['solution'][0]['maintenance_request_id'] == 'REQ001'
    
    def test_multi_department_coordination(self):
        """Test combining maintenance from multiple departments"""
        requests = [
            {
                'id': 'REQ001',
                'section_id': 'SEC001',
                'department': 'TMS',
                'duration_minutes': 120,
                'priority_score': 85
            },
            {
                'id': 'REQ002',
                'section_id': 'SEC001',
                'department': 'SMMS',
                'duration_minutes': 90,
                'priority_score': 80
            },
            {
                'id': 'REQ003',
                'section_id': 'SEC001',
                'department': 'TDMS',
                'duration_minutes': 60,
                'priority_score': 75
            }
        ]
        
        scheduler = BlockScheduler(
            maintenance_requests=requests,
            train_schedule=[],
            available_windows=[(
                datetime.now(),
                datetime.now() + timedelta(hours=6)
            )]
        )
        
        scheduler.create_optimization_problem()
        result = scheduler.solve()
        
        # Should create a combined block
        assert result['status'] == 'success'
        combined_blocks = [b for b in result['solution'] if b['is_combined']]
        assert len(combined_blocks) > 0
        assert len(combined_blocks[0]['maintenance_tasks']) >= 2
        assert len(combined_blocks[0]['departments']) >= 2
    
    def test_no_overlap_constraint(self):
        """Test that maintenance tasks don't overlap incorrectly"""
        requests = [
            {
                'id': 'REQ001',
                'section_id': 'SEC001',
                'department': 'TMS',
                'duration_minutes': 120,
                'priority_score': 85
            },
            {
                'id': 'REQ002',
                'section_id': 'SEC001',
                'department': 'TMS',  # Same department, same section
                'duration_minutes': 90,
                'priority_score': 80
            }
        ]
        
        scheduler = BlockScheduler(
            maintenance_requests=requests,
            train_schedule=[],
            available_windows=[(
                datetime.now(),
                datetime.now() + timedelta(hours=6)
            )]
        )
        
        scheduler.create_optimization_problem()
        result = scheduler.solve()
        
        # Should not overlap (different departments can combine, same cannot)
        blocks = result['solution']
        if len(blocks) == 2:
            block1 = blocks[0]
            block2 = blocks[1]
            # Either block1 ends before block2 starts or vice versa
            assert (block1['end_time'] <= block2['start_time'] or
                    block2['end_time'] <= block1['start_time'])
```

### Integration Tests Example

```python
# backend/tests/integration/test_api_block_planning.py

import pytest
from fastapi.testclient import TestClient
from api.main import app
from datetime import datetime, timedelta

client = TestClient(app)

class TestBlockPlanningAPI:
    
    def test_create_maintenance_request(self, auth_headers):
        """Test creating maintenance request via API"""
        request_data = {
            "department": "TMS",
            "section_id": "SEC001",
            "asset_type": "track",
            "defect_type": "rail_crack",
            "severity": "high",
            "estimated_duration_minutes": 120,
            "due_date": (datetime.now() + timedelta(days=2)).isoformat()
        }
        
        response = client.post(
            "/api/block-planning/maintenance-requests",
            json=request_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "maintenance_request" in data
        assert data["maintenance_request"]["department"] == "TMS"
    
    def test_optimize_blocks(self, auth_headers, sample_maintenance_requests):
        """Test block optimization endpoint"""
        optimization_request = {
            "start_date": datetime.now().isoformat(),
            "end_date": (datetime.now() + timedelta(days=7)).isoformat(),
            "max_time_seconds": 15
        }
        
        response = client.post(
            "/api/block-planning/optimize",
            json=optimization_request,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "blocks" in data
        assert "metrics" in data
        assert "explanations" in data
        assert len(data["blocks"]) > 0
    
    def test_get_blocks(self, auth_headers):
        """Test fetching scheduled blocks"""
        response = client.get(
            "/api/block-planning/blocks",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "blocks" in data
        assert "count" in data
```

---

## Deployment

### Docker Compose Configuration

```yaml
# docker-compose.yml

version: '3.8'

services:
  postgres:
    image: postgis/postgis:14-3.2
    environment:
      POSTGRES_DB: railway_ai
      POSTGRES_USER: railway
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - railway-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - railway-network

  backend:
    build:
      context: ./backend
      dockerfile: ../infrastructure/docker/Dockerfile.backend
    environment:
      DATABASE_URL: postgresql://railway:${DB_PASSWORD}@postgres:5432/railway_ai
      REDIS_URL: redis://redis:6379
      SECRET_KEY: ${SECRET_KEY}
    ports:
      - "8000:8000"
    depends_on:
      - postgres
      - redis
    volumes:
      - ./backend:/app
    networks:
      - railway-network
    command: uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload

  celery_worker:
    build:
      context: ./backend
      dockerfile: ../infrastructure/docker/Dockerfile.backend
    environment:
      DATABASE_URL: postgresql://railway:${DB_PASSWORD}@postgres:5432/railway_ai
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis
    networks:
      - railway-network
    command: celery -A tasks.celery_app worker --loglevel=info

  frontend:
    build:
      context: ./frontend
      dockerfile: ../infrastructure/docker/Dockerfile.frontend
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    networks:
      - railway-network
    environment:
      REACT_APP_API_URL: http://localhost:8000
    command: npm start

volumes:
  postgres_data:
  redis_data:

networks:
  railway-network:
    driver: bridge
```

---

## Additional Resources

### Recommended Reading
1. **OR-Tools Documentation**: https://developers.google.com/optimization
2. **Railway Operations**: Study COA, TMS, SMMS, TDMS systems
3. **Constraint Programming**: CP-SAT solver techniques
4. **Time Series Forecasting**: LSTM, Temporal Fusion Transformers
5. **Explainable AI**: SHAP, LIME libraries

### Useful Datasets
1. Indian Railways train schedules (public timetables)
2. Weather data (historical)
3. OpenStreetMap railway infrastructure data
4. Synthetic data generation based on real patterns

### Development Tools
1. **Postman/Insomnia**: API testing
2. **pgAdmin**: PostgreSQL management
3. **Redis Commander**: Redis visualization
4. **React DevTools**: Frontend debugging
5. **Jupyter Notebooks**: ML experimentation

---

## Next Steps

1. **Set up development environment** following the setup guide
2. **Generate synthetic data** using provided generators
3. **Implement Phase 1 MVP** with basic functionality
4. **Iterate and test** continuously
5. **Document as you go** - don't leave it for the end
6. **Prepare demo scenarios** early in Phase 2
7. **Practice presentations** - multiple dry runs
8. **Have backup plans** for demo day

**Remember**: The goal is a working, demonstrable system that solves a real problem. Focus on core functionality first, then enhance.

Good luck with the development! 🚂
