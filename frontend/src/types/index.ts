export interface Station {
  code: string;
  name: string;
  division_id: string;
  kilometer_mark: number;
  latitude: number;
  longitude: number;
  platforms: number;
  has_loop_lines: boolean;
}

export interface Section {
  id: string;
  name: string;
  division_id: string;
  start_station_code: string;
  end_station_code: string;
  start_km: number;
  end_km: number;
  track_direction: 'UP' | 'DOWN' | 'COMMON_LOOP' | 'THIRD_LINE' | 'YARD';
  speed_limit_kmh: number;
  is_electrified: boolean;
}

export interface MaintenanceRequest {
  id: number;
  request_id: string;
  department: 'TMS' | 'SMMS' | 'TDMS';
  division_id: string;
  section_id: string;
  from_km: number;
  to_km: number;
  asset_type: string;
  defect_type: string;
  severity: 'EMERGENCY' | 'CRITICAL' | 'PLANNED_HIGH' | 'ROUTINE';
  estimated_duration_minutes: number;
  required_machine_type?: string;
  priority_score: number;
  status: 'PENDING' | 'OPTIMIZED' | 'SANCTIONED' | 'DISCONNECTED' | 'IN_PROGRESS' | 'COMPLETED';
  due_date: string;
}

export interface MaintenanceBlock {
  id: number;
  block_id: string;
  section_id: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  total_duration_minutes?: number;
  block_type: 'COMBINED_SUPER_BLOCK' | 'SINGLE_DEPARTMENT' | 'EMERGENCY_SHUTDOWN';
  is_combined: boolean;
  status: 'PLANNED' | 'SANCTIONED' | 'DISCONNECTED' | 'PTW_GRANTED' | 'IN_PROGRESS' | 'FIT_RESTORED' | 'CANCELLED';
  disconnection_memo_number?: string;
  permit_to_work_ptw_number?: string;
  track_fit_cert_issued?: boolean;
  post_block_tsr_speed_kmh?: number;
  tasks: MaintenanceRequest[];
  maintenance_tasks?: any[];
  explanation?: {
    summary: string;
    tradeoff: string;
    factors: Record<string, number>;
  };
}

export interface OptimizationMetrics {
  total_input_requests: number;
  scheduled_requests: number;
  total_blocks_created: number;
  combined_super_blocks: number;
  separate_maintenance_hours: number;
  optimized_block_hours: number;
  time_saved_hours: number;
  asset_availability_gain_percent: number;
  wall_time_seconds: number;
}

export interface TrainStationStop {
  station_code: string;
  station_name: string;
  kilometer_mark: number;
  latitude: number;
  longitude: number;
  scheduled_arrival: string;
  scheduled_departure: string;
  actual_arrival: string;
  actual_departure: string;
  platform: string;
  status: 'PASSED' | 'AT_STATION' | 'APPROACHING' | 'SCHEDULED';
  halt_minutes: number;
}

export interface CorridorTrain {
  train_number: string;
  train_name: string;
  train_category: 'VANDE_BHARAT' | 'RAJDHANI' | 'SHATABDI' | 'SUPERFAST' | 'MAIL_EXPRESS' | 'FREIGHT';
  priority_precedence: 1 | 2 | 3 | 4;
  priority_label: string;
  regulation_rights: string;
  direction: 'UP' | 'DOWN'; // UP: CNB -> NDLS, DOWN: NDLS -> CNB
  source_station: string;
  destination_station: string;
  current_location: {
    section_id: string;
    section_name: string;
    current_km: number;
    latitude: number;
    longitude: number;
    speed_kmh: number;
  };
  delay_minutes: number;
  delay_display: string;
  punctuality_status: 'ON_TIME' | 'MINOR_DELAY' | 'MAJOR_DELAY';
  delay_cause?: string;
  locomotive_class: string;
  rake_composition: string;
  kavach_enabled: boolean;
  station_stops: TrainStationStop[];
  route_sections: string[];
}

