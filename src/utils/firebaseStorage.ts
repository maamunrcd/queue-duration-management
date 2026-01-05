// Firebase Realtime Database storage for multi-device sync
// Replace localStorage with this for cross-device support

import { database } from '../config/firebase';
import { ref, set, get, onValue, off } from 'firebase/database';
import type { Queue, QueueData, PatientEntry } from '../types';

const STORAGE_KEY = 'queue_management_data';

// BroadcastChannel for same-tab updates (keep for compatibility)
const channel = new BroadcastChannel('queue_updates');

/* -------------------- BASIC STORAGE -------------------- */

// Get all queues from Firebase
export const getAllQueues = async (): Promise<QueueData> => {
  try {
    const snapshot = await get(ref(database, STORAGE_KEY));
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return { queues: {} };
  } catch (error) {
    console.error('Error getting queues:', error);
    return { queues: {} };
  }
};

// Get specific queue
export const getQueue = async (queueId: string): Promise<Queue | null> => {
  try {
    const snapshot = await get(ref(database, `${STORAGE_KEY}/queues/${queueId}`));
    if (snapshot.exists()) {
      const queue = snapshot.val();
      // Backward compatibility
      if (!queue.patientHistory) queue.patientHistory = [];
      if (queue.totalPatientsJoined === undefined) {
        queue.totalPatientsJoined = queue.currentNumber || 0;
      }
      if (!queue.avgTimePerPatient) queue.avgTimePerPatient = 5;
      if (!queue.queueStartTime) queue.queueStartTime = null;
      if (!queue.currentDate) {
        // Set current date if not exists (for day-wise serial)
        queue.currentDate = new Date().toISOString().split('T')[0];
      }
      return queue;
    }
    return null;
  } catch (error) {
    console.error('Error getting queue:', error);
    return null;
  }
};

// Save queue to Firebase
export const saveQueue = async (queue: Queue): Promise<void> => {
  try {
    await set(ref(database, `${STORAGE_KEY}/queues/${queue.id}`), {
      ...queue,
      lastUpdated: new Date().toISOString(),
    });
    // Also broadcast for same-tab updates
    channel.postMessage({
      type: 'queue_update',
      queueId: queue.id,
    });
  } catch (error) {
    console.error('Error saving queue:', error);
    throw error;
  }
};

// Delete queue
export const deleteQueue = async (queueId: string): Promise<void> => {
  try {
    await set(ref(database, `${STORAGE_KEY}/queues/${queueId}`), null);
    channel.postMessage({
      type: 'queue_update',
      queueId,
    });
  } catch (error) {
    console.error('Error deleting queue:', error);
    throw error;
  }
};

// Update queue status
export const updateQueueStatus = async (
  queueId: string,
  status: Queue['status']
): Promise<void> => {
  const queue = await getQueue(queueId);
  if (!queue) return;
  queue.status = status;
  await saveQueue(queue);
};

/* -------------------- PATIENT FLOW -------------------- */

// Complete current patient & calculate service time
export const completeCurrentPatient = async (queueId: string): Promise<void> => {
  const queue = await getQueue(queueId);
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
    // Update existing patient entry
    const patient = queue.patientHistory[patientIndex];
    queue.patientHistory[patientIndex] = {
      ...patient,
      startedAt: queue.currentPatientStartTime,
      completedAt,
      serviceDuration: Math.max(0, serviceDuration), // Ensure non-negative
    };
  } else {
    // Patient not in history yet (shouldn't happen, but create entry for safety)
    queue.patientHistory.push({
      serialNumber: queue.currentNumber,
      patientName: `Patient #${queue.currentNumber}`,
      joinedAt: queue.currentPatientStartTime || new Date().toISOString(),
      startedAt: queue.currentPatientStartTime,
      completedAt,
      serviceDuration: Math.max(0, serviceDuration),
    });
  }

  // Ensure patientHistory array is properly updated
  queue.patientHistory = [...queue.patientHistory];

  // Recalculate avg from ALL COMPLETED patients
  // A patient is completed if serialNumber < currentNumber AND has completedAt
  const completedPatients = queue.patientHistory.filter(
    (p) => 
      p.serialNumber < queue.currentNumber &&
      p.completedAt !== null && 
      p.serviceDuration !== null && 
      p.serviceDuration >= 0
  );

  if (completedPatients.length > 0) {
    const totalServiceTime = completedPatients.reduce(
      (sum, p) => sum + (p.serviceDuration ?? 0),
      0
    );
    queue.avgTimePerPatient = Number(
      (totalServiceTime / completedPatients.length).toFixed(2)
    );
  }

  queue.currentPatientStartTime = null;
  await saveQueue(queue);
};

// Call next patient
export const callNextPatient = async (queueId: string): Promise<void> => {
  const queue = await getQueue(queueId);
  if (!queue) return;

  // Complete current patient BEFORE incrementing
  if (queue.currentPatientStartTime) {
    await completeCurrentPatient(queueId);
    // Re-fetch queue after completion to get updated patientHistory
    const updatedQueue = await getQueue(queueId);
    if (updatedQueue) {
      updatedQueue.currentNumber += 1;
      updatedQueue.currentPatientStartTime = new Date().toISOString();

      if (updatedQueue.currentNumber > updatedQueue.totalPatientsJoined) {
        updatedQueue.totalPatientsJoined = updatedQueue.currentNumber;
      }

      await saveQueue(updatedQueue);
      return;
    }
  }

  // If no currentPatientStartTime, just increment
  queue.currentNumber += 1;
  queue.currentPatientStartTime = new Date().toISOString();

  if (queue.currentNumber > queue.totalPatientsJoined) {
    queue.totalPatientsJoined = queue.currentNumber;
  }

  await saveQueue(queue);
};

// Get current date in YYYY-MM-DD format
const getCurrentDate = (): string => {
  const now = new Date();
  return now.toISOString().split('T')[0]; // Returns YYYY-MM-DD
};

// Get day-wise serial number for a doctor (resets to 1 each day)
const getDayWiseSerial = (queue: Queue): number => {
  const today = getCurrentDate();
  
  // If queue's currentDate is not today, reset serials for new day
  if (!queue.currentDate || queue.currentDate !== today) {
    queue.currentDate = today;
    queue.totalPatientsJoined = 0;
    queue.currentNumber = 0;
    // Keep patientHistory but filter to today only for serial calculation
  }
  
  // Count patients joined today (from patientHistory)
  const todayPatients = queue.patientHistory?.filter(p => {
    if (!p.joinedAt) return false;
    const patientDate = new Date(p.joinedAt).toISOString().split('T')[0];
    return patientDate === today;
  }) || [];
  
  // Next serial = today's patients count + 1
  return todayPatients.length + 1;
};

// Join queue
export const joinQueue = async (
  queueId: string,
  patientName: string
): Promise<{ serialNumber: number; patientName: string }> => {
  const queue = await getQueue(queueId);
  if (!queue) return { serialNumber: 0, patientName: '' };

  // Get day-wise serial (resets to 1 each day)
  const serialNumber = getDayWiseSerial(queue);
  
  // Update totalPatientsJoined for today
  queue.totalPatientsJoined = serialNumber;

  if (!queue.patientHistory) {
    queue.patientHistory = [];
  }

  queue.patientHistory.push({
    serialNumber,
    patientName,
    joinedAt: new Date().toISOString(),
    startedAt: null,
    completedAt: null,
    serviceDuration: null,
  });

  await saveQueue(queue);
  return { serialNumber, patientName };
};

// Get patient by serial
export const getPatientBySerial = async (
  queueId: string,
  serialNumber: number
): Promise<PatientEntry | null> => {
  const queue = await getQueue(queueId);
  if (!queue) return null;

  return (
    queue.patientHistory.find((p) => p.serialNumber === serialNumber) || null
  );
};

/* -------------------- WAIT TIME CALCULATION -------------------- */

// Calculate average time from completed patients (more accurate)
export const calculateAverageTime = (queue: Queue): number => {
  // A patient is completed if serialNumber < currentNumber AND has completedAt
  const completedPatients =
    queue.patientHistory?.filter(
      (p) => 
        p.serialNumber < queue.currentNumber &&
        p.completedAt !== null && 
        p.serviceDuration !== null && 
        p.serviceDuration >= 0
    ) || [];

  if (completedPatients.length > 0) {
    const totalServiceTime = completedPatients.reduce(
      (sum, p) => sum + (p.serviceDuration ?? 0),
      0
    );
    return Number((totalServiceTime / completedPatients.length).toFixed(2));
  }

  return queue.avgTimePerPatient > 0 ? queue.avgTimePerPatient : 5;
};

// Calculate median time (less affected by outliers like 20 min patient)
export const calculateMedianTime = (queue: Queue): number => {
  const completedPatients =
    queue.patientHistory?.filter(
      (p) => 
        p.serialNumber < queue.currentNumber &&
        p.completedAt !== null && 
        p.serviceDuration !== null && 
        p.serviceDuration >= 0
    ) || [];

  if (completedPatients.length === 0) {
    return queue.avgTimePerPatient > 0 ? queue.avgTimePerPatient : 5;
  }

  const durations = completedPatients
    .map((p) => p.serviceDuration ?? 0)
    .sort((a, b) => a - b);

  const mid = Math.floor(durations.length / 2);
  if (durations.length % 2 === 0) {
    return Number(((durations[mid - 1] + durations[mid]) / 2).toFixed(2));
  }
  return Number(durations[mid].toFixed(2));
};

// Smart prediction: Use median for more stable average, but adjust for current patient
export const calculateSmartAverage = (queue: Queue, currentTime?: number): number => {
  const avgTime = calculateAverageTime(queue);
  const medianTime = calculateMedianTime(queue);
  
  // If we have current patient info, use it for better prediction
  if (queue.currentPatientStartTime && currentTime) {
    const elapsedMinutes = (currentTime - new Date(queue.currentPatientStartTime).getTime()) / 60000;
    
    // If current patient is taking longer than average, use their elapsed time as predictor
    if (elapsedMinutes > avgTime) {
      // Current patient is taking longer - use elapsed time as better predictor
      return Math.max(avgTime, elapsedMinutes);
    }
  }
  
  // Use median if we have enough data (more stable, less affected by outliers)
  // But fallback to average if median is too different (might be skewed)
  if (queue.patientHistory?.filter(p => p.completedAt !== null).length >= 3) {
    const diff = Math.abs(medianTime - avgTime);
    // If median and average are close, use median (more stable)
    if (diff <= avgTime * 0.5) {
      return medianTime;
    }
  }
  
  return avgTime;
};

// Calculate remaining time for current patient (smart prediction)
// Handles long patients (like 20 min) accurately
export const calculateCurrentPatientRemainingTime = (
  queue: Queue,
  currentTime: number
): number => {
  if (!queue.currentPatientStartTime || queue.status !== 'active') {
    return 0;
  }

  const startedAt = new Date(queue.currentPatientStartTime).getTime();
  const elapsedMinutes = (currentTime - startedAt) / 60000;
  const avgTime = calculateAverageTime(queue);
  const medianTime = calculateMedianTime(queue);

  // If patient is taking MUCH longer than average (like 20 min vs 1.5 min avg)
  // Use their actual elapsed time as better predictor
  if (elapsedMinutes > avgTime * 2) {
    // Patient is taking significantly longer (e.g., 20 min vs 1.5 min avg)
    // Predict they'll continue at similar pace
    // Use elapsed time directly (they're already taking that long)
    const predictedTotal = elapsedMinutes * 1.1; // Small buffer (10%)
    return Math.max(0, predictedTotal - elapsedMinutes);
  }

  // If patient is taking longer than average but not extreme
  if (elapsedMinutes > avgTime) {
    // Patient is taking longer - predict remaining based on their current pace
    // Use median as baseline, but if elapsed > median, use elapsed as predictor
    const predictedTotal = Math.max(medianTime, elapsedMinutes * 1.2); // Add 20% buffer
    return Math.max(0, predictedTotal - elapsedMinutes);
  }

  // Patient is within normal time - use average minus elapsed
  return Math.max(0, avgTime - elapsedMinutes);
};

export const calculateWaitTime = (
  queue: Queue,
  patientNumber: number,
  currentTime?: number
): number => {
  if (!queue || queue.status === 'idle') return 0;
  if (patientNumber <= queue.currentNumber) return 0;

  const peopleAhead = patientNumber - queue.currentNumber;
  
  // Use smart average for better prediction
  const avgTime = currentTime 
    ? calculateSmartAverage(queue, currentTime)
    : calculateAverageTime(queue);

  // If current patient is being served, calculate their remaining time
  let currentPatientRemaining = 0;
  if (queue.currentPatientStartTime && currentTime && peopleAhead > 0) {
    currentPatientRemaining = calculateCurrentPatientRemainingTime(queue, currentTime);
  }

  // Calculate wait time: current patient remaining + others ahead * average
  const othersAhead = Math.max(0, peopleAhead - 1); // Exclude current patient
  const estimatedMinutes = currentPatientRemaining + (othersAhead * avgTime);

  return Math.max(1, Math.round(estimatedMinutes));
};

/* -------------------- REAL-TIME UPDATES -------------------- */

// Listen for real-time updates from Firebase
export const onQueueUpdate = (
  callback: (queueId: string) => void
): (() => void) => {
  const queueRef = ref(database, `${STORAGE_KEY}/queues`);

  const unsubscribe = onValue(queueRef, (snapshot) => {
    if (snapshot.exists()) {
      const queues = snapshot.val();
      Object.keys(queues).forEach((queueId) => {
        callback(queueId);
      });
    }
  });

  // Also listen to BroadcastChannel for same-tab updates
  const handleMessage = (event: MessageEvent) => {
    if (event.data.type === 'queue_update') {
      callback(event.data.queueId);
    }
  };
  channel.addEventListener('message', handleMessage);

  return () => {
    off(queueRef);
    channel.removeEventListener('message', handleMessage);
  };
};

/* -------------------- UTILS -------------------- */

export const generateId = (): string =>
  Date.now().toString(36) + Math.random().toString(36).substring(2);

