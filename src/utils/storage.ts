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

  return queue;
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

// Call next patient
export const callNextPatient = (queueId: string): void => {
  const queue = getQueue(queueId);
  if (!queue) return;

  // Complete current patient BEFORE incrementing (uses current currentNumber)
  if (queue.currentPatientStartTime) {
    completeCurrentPatient(queueId);
    // Re-fetch queue after completion to get updated patientHistory
    const updatedQueue = getQueue(queueId);
    if (updatedQueue) {
      // Use updated queue for increment
      updatedQueue.currentNumber += 1;
      updatedQueue.currentPatientStartTime = new Date().toISOString();

      if (updatedQueue.currentNumber > updatedQueue.totalPatientsJoined) {
        updatedQueue.totalPatientsJoined = updatedQueue.currentNumber;
      }

      saveQueue(updatedQueue);
      return;
    }
  }

  // If no currentPatientStartTime, just increment (first patient or edge case)
  queue.currentNumber += 1;
  queue.currentPatientStartTime = new Date().toISOString();

  if (queue.currentNumber > queue.totalPatientsJoined) {
    queue.totalPatientsJoined = queue.currentNumber;
  }

  saveQueue(queue);
};

// Join queue
export const joinQueue = (
  queueId: string,
  patientName: string
): { serialNumber: number; patientName: string } => {
  const queue = getQueue(queueId);
  if (!queue) return { serialNumber: 0, patientName: "" };

  queue.totalPatientsJoined += 1;
  const serialNumber = queue.totalPatientsJoined;

  queue.patientHistory.push({
    serialNumber,
    patientName,
    joinedAt: new Date().toISOString(),
    startedAt: null,
    completedAt: null,
    serviceDuration: null,
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

export const onQueueUpdate = (callback: (queueId: string) => void): void => {
  channel.onmessage = (event) => {
    if (event.data?.type === "queue_update") {
      callback(event.data.queueId);
    }
  };
};

/* -------------------- UTILS -------------------- */

export const generateId = (): string =>
  Date.now().toString(36) + Math.random().toString(36).substring(2);
