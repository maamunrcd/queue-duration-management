// Queue Management Types

export interface PatientEntry {
  serialNumber: number;
  patientName: string; // patient's name (required)
  mobile?: string | null; // patient's mobile number (optional)
  age?: number | null; // patient's age (required)
  joinedAt: string; // when joined queue
  startedAt: string | null; // when service started
  completedAt: string | null; // when service completed
  serviceDuration: number | null; // actual time in minutes
  status?: "present" | "absent" | "completed"; // patient status
  reAddedAt?: string | null; // when absent patient was re-added
  originalSerial?: number; // original serial if re-added
}

export interface Organization {
  id: string;
  name: string; // "Ibn Sina Hospital"
  codePrefix?: string | null; // Optional prefix like "ibneSina"
  createdAt: string;
  lastUpdated: string;
}

export interface Department {
  id: string;
  organizationId: string;
  name: string; // "Cardiology"
  createdAt: string;
  lastUpdated: string;
}

export interface Queue {
  id: string;
  organizationId?: string; // NEW: For multi-tenant support
  departmentId?: string; // NEW: For department isolation
  doctorName: string;
  secretCode: string; // Auto-generated, unique per doctor
  sessionType: "morning" | "evening"; // Morning or Evening session
  currentNumber: number;
  totalPatientsJoined: number; // dynamic, keeps increasing
  currentDate: string; // YYYY-MM-DD format for day-wise serial reset
  status: "idle" | "active" | "paused" | "ended" | "completed";
  serialLimit?: number | null; // Optional limit on serial numbers (null = unlimited)
  avgTimePerPatient: number; // dynamic, calculated from ALL completed patients (excludes idle/paused time)
  patientHistory: PatientEntry[]; // track all patients
  currentPatientStartTime: string | null; // when current patient service started
  queueStartTime: string | null; // when queue actually started (first 'active' status)
  createdAt: string;
  lastUpdated: string;
}

export interface QueueData {
  queues: Record<string, Queue>; // key = queue_id
  organizations?: Record<string, Organization>; // NEW: For multi-tenant
  departments?: Record<string, Department>; // NEW: For departments
}
