// Queue Management Types

export interface PatientEntry {
  serialNumber: number;
  patientName: string; // patient's name
  joinedAt: string; // when joined queue
  startedAt: string | null; // when service started
  completedAt: string | null; // when service completed
  serviceDuration: number | null; // actual time in minutes
}

export interface Queue {
  id: string;
  doctorName: string;
  secretCode: string;
  currentNumber: number;
  totalPatientsJoined: number; // dynamic, keeps increasing
  currentDate: string; // YYYY-MM-DD format for day-wise serial reset
  status: "idle" | "active" | "paused" | "completed";
  avgTimePerPatient: number; // dynamic, calculated from ALL completed patients (excludes idle/paused time)
  patientHistory: PatientEntry[]; // track all patients
  currentPatientStartTime: string | null; // when current patient service started
  queueStartTime: string | null; // when queue actually started (first 'active' status)
  createdAt: string;
  lastUpdated: string;
}

export interface QueueData {
  queues: Record<string, Queue>; // key = queue_id
}
