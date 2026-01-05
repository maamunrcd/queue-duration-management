// LocalStorage utilities for queue management

import type { Queue, QueueData, PatientEntry } from "../types";

const STORAGE_KEY = "queue_management_data";

/* -------------------- BASIC STORAGE -------------------- */

// Get all queues
export const getAllQueues = (): QueueData => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return { queues: {} };
  return JSON.parse(data);
};

// Get specific queue
export const getQueue = (queueId: string): Queue | null => {
  const data = getAllQueues();
  const queue = data.queues[queueId];
  if (!queue) return null;

  // Backward compatibility
  if (!queue.patientHistory) queue.patientHistory = [];
  if (queue.totalPatientsJoined === undefined) {
    queue.totalPatientsJoined = queue.currentNumber || 0;
  }
  if (!queue.avgTimePerPatient) queue.avgTimePerPatient = 5;
  if (!queue.queueStartTime) queue.queueStartTime = null;
  if (!queue.currentDate) {
    queue.currentDate = getCurrentDate();
  }
  if (!queue.sessionType) queue.sessionType = "morning"; // Default to morning for old queues

  // Check if date changed and reset serial if needed
  const today = getCurrentDate();
  if (queue.currentDate !== today) {
    // New day - reset serial count but keep currentNumber for reference
    queue.currentDate = today;
    // Don't reset totalPatientsJoined here - let joinQueue handle it
  }

  return queue;
};

// Get current date string (YYYY-MM-DD) - helper function
const getCurrentDate = (): string => {
  return new Date().toISOString().split("T")[0];
};

// Find queue by doctor name
export const getQueueByDoctorName = (doctorName: string): Queue | null => {
  const data = getAllQueues();
  const queues = Object.values(data.queues);
  return queues.find((q) => q.doctorName === doctorName) || null;
};

// Get unique doctor names for autocomplete
export const getUniqueDoctorNames = (): string[] => {
  const data = getAllQueues();
  const queues = Object.values(data.queues);
  const uniqueNames = new Set(queues.map((q) => q.doctorName.trim()));
  return Array.from(uniqueNames).sort();
};

// Find queue by secret code
export const getQueueBySecretCode = (secretCode: string): Queue | null => {
  const data = getAllQueues();
  const queues = Object.values(data.queues);
  return queues.find((q) => q.secretCode === secretCode) || null;
};

// Check if secret code is unique
export const isSecretCodeUnique = (
  secretCode: string,
  excludeQueueId?: string
): boolean => {
  const data = getAllQueues();
  const queues = Object.values(data.queues);
  return !queues.some(
    (q) => q.secretCode === secretCode && q.id !== excludeQueueId
  );
};

// Save queue
export const saveQueue = (queue: Queue): void => {
  const data = getAllQueues();
  data.queues[queue.id] = {
    ...queue,
    lastUpdated: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  broadcastUpdate(queue.id);
};

// Delete queue
export const deleteQueue = (queueId: string): void => {
  const data = getAllQueues();
  delete data.queues[queueId];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  broadcastUpdate(queueId);
};

// Update queue status
export const updateQueueStatus = (
  queueId: string,
  status: Queue["status"]
): void => {
  const queue = getQueue(queueId);
  if (!queue) return;
  queue.status = status;
  saveQueue(queue);
};

// End queue (no new serials can be issued)
export const endQueue = (queueId: string): void => {
  const queue = getQueue(queueId);
  if (!queue) return;
  queue.status = "ended";
  saveQueue(queue);
};

// Resume queue (allow new serials again)
export const resumeQueue = (queueId: string): void => {
  const queue = getQueue(queueId);
  if (!queue) return;
  // Can only resume from "ended" status
  if (queue.status === "ended") {
    // Resume to "active" if it was active before, otherwise "idle"
    queue.status = queue.queueStartTime ? "active" : "idle";
    saveQueue(queue);
  }
};

/* -------------------- PATIENT FLOW -------------------- */

// Complete current patient & calculate service time
export const completeCurrentPatient = (queueId: string): void => {
  const queue = getQueue(queueId);
  if (!queue) return;

  // If no currentPatientStartTime, patient hasn't started yet - nothing to complete
  if (!queue.currentPatientStartTime) return;

  const completedAt = new Date().toISOString();
  const startedAt = new Date(queue.currentPatientStartTime);

  const serviceDuration =
    (new Date(completedAt).getTime() - startedAt.getTime()) / 60000; // minutes

  // Ensure patientHistory exists
  if (!queue.patientHistory) {
    queue.patientHistory = [];
  }

  // Find patient by currentNumber (the one being completed)
  const patientIndex = queue.patientHistory.findIndex(
    (p) => p.serialNumber === queue.currentNumber
  );

  if (patientIndex !== -1) {
    // Update existing patient entry - ensure we're updating the correct patient
    const patient = queue.patientHistory[patientIndex];
    queue.patientHistory[patientIndex] = {
      ...patient,
      startedAt: queue.currentPatientStartTime,
      completedAt,
      serviceDuration: Math.max(0, serviceDuration), // Ensure non-negative
      status: "completed", // Mark as completed
    };
  } else {
    // Patient not in history yet (shouldn't happen, but create entry for safety)
    // This can happen if patient joined after queue started or data was lost
    queue.patientHistory.push({
      serialNumber: queue.currentNumber,
      patientName: `Patient #${queue.currentNumber}`,
      joinedAt: queue.currentPatientStartTime || new Date().toISOString(),
      startedAt: queue.currentPatientStartTime,
      completedAt,
      serviceDuration: Math.max(0, serviceDuration),
      status: "completed", // Mark as completed
    });
  }

  // Ensure patientHistory array is properly updated in the queue object
  // This ensures the reference is maintained for saveQueue
  queue.patientHistory = [...queue.patientHistory];

  // Recalculate avg from ALL COMPLETED patients (excludes idle/paused time automatically)
  // A patient is completed if they have a completedAt timestamp
  const completedPatients = queue.patientHistory.filter(
    (p) => p.completedAt !== null && p.serviceDuration !== null
  );

  if (completedPatients.length > 0) {
    // Sum of ALL actual service times (no idle/paused time included)
    const totalServiceTime = completedPatients.reduce(
      (sum, p) => sum + (p.serviceDuration ?? 0),
      0
    );

    // Average = Total service time / Number of completed patients
    // This gives maximum accurate estimate (excludes all idle/paused time)
    queue.avgTimePerPatient = Number(
      (totalServiceTime / completedPatients.length).toFixed(2)
    );
  }

  queue.currentPatientStartTime = null;
  saveQueue(queue);
};

// Call next patient (skips absent patients)
export const callNextPatient = (queueId: string): void => {
  let queue = getQueue(queueId);
  if (!queue) return;

  // Complete current patient BEFORE incrementing (uses current currentNumber)
  if (queue.currentPatientStartTime) {
    completeCurrentPatient(queueId);
    // Re-fetch queue after completion to get updated patientHistory
    const updatedQueue = getQueue(queueId);
    if (updatedQueue) {
      queue = updatedQueue;
    }
  }

  // Find next present patient (skip absent)
  let nextNumber = queue.currentNumber + 1;
  const maxAttempts = queue.totalPatientsJoined + 10; // Safety limit

  while (nextNumber <= maxAttempts) {
    const nextPatient = queue.patientHistory.find(
      (p) => p.serialNumber === nextNumber
    );

    // If patient doesn't exist or is present/completed, use this number
    if (
      !nextPatient ||
      nextPatient.status === "present" ||
      nextPatient.status === "completed" ||
      !nextPatient.status
    ) {
      break;
    }

    // If absent, skip and check next
    if (nextPatient.status === "absent") {
      nextNumber++;
      continue;
    }

    nextNumber++;
  }

  queue.currentNumber = nextNumber;
  queue.currentPatientStartTime = new Date().toISOString();

  if (queue.currentNumber > queue.totalPatientsJoined) {
    queue.totalPatientsJoined = queue.currentNumber;
  }

  saveQueue(queue);
};

// Join queue with day-wise serial reset
export const joinQueue = (
  queueId: string,
  patientName: string,
  mobile?: string | null,
  age?: number | null
): { serialNumber: number; patientName: string; error?: string } => {
  const queue = getQueue(queueId);
  if (!queue)
    return { serialNumber: 0, patientName: "", error: "Queue not found" };

  // Check if queue is ended
  if (queue.status === "ended") {
    return {
      serialNumber: 0,
      patientName: "",
      error: "Queue has ended. No new serials can be issued.",
    };
  }

  const today = getCurrentDate();

  // Reset serial if it's a new day
  if (!queue.currentDate || queue.currentDate !== today) {
    queue.currentDate = today;
    queue.totalPatientsJoined = 0;
    // Don't reset currentNumber - let doctor decide
  }

  // Count patients joined today
  const todayPatients =
    queue.patientHistory?.filter((p) => {
      if (!p.joinedAt) return false;
      const patientDate = new Date(p.joinedAt).toISOString().split("T")[0];
      return patientDate === today;
    }) || [];

  const nextSerial = todayPatients.length + 1;

  // Check serial limit
  if (queue.serialLimit !== null && queue.serialLimit !== undefined) {
    if (nextSerial > queue.serialLimit) {
      return {
        serialNumber: 0,
        patientName: "",
        error: `Queue limit reached (${queue.serialLimit} patients).`,
      };
    }
  }

  const serialNumber = nextSerial;
  queue.totalPatientsJoined = serialNumber;

  queue.patientHistory.push({
    serialNumber,
    patientName,
    mobile: mobile || null,
    age: age || null,
    joinedAt: new Date().toISOString(),
    startedAt: null,
    completedAt: null,
    serviceDuration: null,
    status: "present", // Default to present
  });

  saveQueue(queue);
  return { serialNumber, patientName };
};

// Get patient by serial
export const getPatientBySerial = (
  queueId: string,
  serialNumber: number
): PatientEntry | null => {
  const queue = getQueue(queueId);
  if (!queue) return null;

  return (
    queue.patientHistory.find((p) => p.serialNumber === serialNumber) || null
  );
};

/* -------------------- WAIT TIME CALCULATION -------------------- */

// Calculate average time from completed patients (same logic everywhere)
export const calculateAverageTime = (queue: Queue): number => {
  // A patient is completed if they have a completedAt timestamp
  // For average calculation, also need serviceDuration to be valid (not null and >= 0)
  const completedPatients =
    queue.patientHistory?.filter(
      (p) =>
        p.completedAt !== null &&
        p.serviceDuration !== null &&
        p.serviceDuration >= 0
    ) || [];

  if (completedPatients.length > 0) {
    // Calculate from actual service durations (most accurate)
    const totalServiceTime = completedPatients.reduce(
      (sum, p) => sum + (p.serviceDuration ?? 0),
      0
    );
    return Number((totalServiceTime / completedPatients.length).toFixed(2));
  }

  // Fallback to stored value or default
  return queue.avgTimePerPatient > 0 ? queue.avgTimePerPatient : 5;
};

export const calculateWaitTime = (
  queue: Queue,
  patientNumber: number
): number => {
  if (!queue || queue.status === "idle") return 0;
  if (patientNumber <= queue.currentNumber) return 0;

  const peopleAhead = patientNumber - queue.currentNumber;

  // Use calculateAverageTime for consistency
  const avgTime = calculateAverageTime(queue);

  const estimatedMinutes = peopleAhead * avgTime;

  // UX-friendly minimum
  return Math.max(1, Math.round(estimatedMinutes));
};

/* -------------------- REAL-TIME TAB SYNC -------------------- */

const channel = new BroadcastChannel("queue_updates");

export const broadcastUpdate = (queueId: string): void => {
  channel.postMessage({
    type: "queue_update",
    queueId,
    timestamp: Date.now(),
  });
};

export const onQueueUpdate = (
  callback: (queueId: string) => void
): (() => void) => {
  const messageHandler = (event: MessageEvent) => {
    if (event.data?.type === "queue_update") {
      callback(event.data.queueId);
    }
  };

  channel.addEventListener("message", messageHandler);

  // Return cleanup function
  return () => {
    channel.removeEventListener("message", messageHandler);
  };
};

/* -------------------- ABSENT PATIENT MANAGEMENT -------------------- */

// Mark patient as absent
export const markPatientAsAbsent = (
  queueId: string,
  serialNumber: number
): void => {
  const queue = getQueue(queueId);
  if (!queue) return;

  const patientIndex = queue.patientHistory.findIndex(
    (p) => p.serialNumber === serialNumber
  );

  if (patientIndex !== -1) {
    queue.patientHistory[patientIndex] = {
      ...queue.patientHistory[patientIndex],
      status: "absent",
    };
    queue.patientHistory = [...queue.patientHistory];
    saveQueue(queue);
  }
};

// Re-add absent patient to queue (marks as present)
export const reAddAbsentPatient = (
  queueId: string,
  serialNumber: number
): void => {
  const queue = getQueue(queueId);
  if (!queue) return;

  const patientIndex = queue.patientHistory.findIndex(
    (p) => p.serialNumber === serialNumber && p.status === "absent"
  );

  if (patientIndex !== -1) {
    const patient = queue.patientHistory[patientIndex];

    // Update patient status to present
    queue.patientHistory[patientIndex] = {
      ...patient,
      status: "present",
      reAddedAt: new Date().toISOString(),
      originalSerial: patient.originalSerial || patient.serialNumber,
    };

    queue.patientHistory = [...queue.patientHistory];
    saveQueue(queue);
  }
};

/* -------------------- SECRET CODE GENERATION -------------------- */

// Generate secret code with optional prefix
export const generateSecretCode = (
  prefix?: string | null,
  departmentId?: string
): string => {
  // Generate random 6-digit code
  const randomCode = Math.floor(100000 + Math.random() * 900000).toString();

  // If prefix provided, use it
  if (prefix && prefix.trim()) {
    const cleanPrefix = prefix.trim().toLowerCase().replace(/\s+/g, "");
    return `${cleanPrefix}-${randomCode}`;
  }

  // If departmentId, use first 3 chars
  if (departmentId) {
    const deptCode = departmentId.substring(0, 3).toUpperCase();
    return `${deptCode}-${randomCode}`;
  }

  // Default: just random code
  return randomCode;
};

// Ensure secret code is unique across all doctors
export const generateUniqueSecretCode = (
  prefix?: string | null,
  departmentId?: string,
  excludeQueueId?: string
): string => {
  let attempts = 0;
  let code: string;

  do {
    code = generateSecretCode(prefix, departmentId);
    attempts++;

    if (attempts > 100) {
      // Fallback: use timestamp
      code = `CODE-${Date.now().toString(36).toUpperCase()}`;
      break;
    }
  } while (!isSecretCodeUnique(code, excludeQueueId));

  return code;
};

// Check if secret code is unique within department (for future multi-department)
export const isSecretCodeUniqueInDepartment = (
  secretCode: string,
  departmentId: string,
  excludeQueueId?: string
): boolean => {
  const data = getAllQueues();
  const queues = Object.values(data.queues);
  return !queues.some(
    (q) =>
      q.secretCode === secretCode &&
      q.departmentId === departmentId &&
      q.id !== excludeQueueId
  );
};

/* -------------------- UTILS -------------------- */

export const generateId = (): string =>
  Date.now().toString(36) + Math.random().toString(36).substring(2);
