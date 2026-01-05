import { useState, useEffect } from "react";
import type { Queue } from "../types";
import {
  onQueueUpdate,
  getQueue,
  getPatientBySerial,
  calculateWaitTime,
  calculateAverageTime,
} from "../utils/firebaseStorage";

interface PatientViewProps {
  queue: Queue;
  patientNumber: number;
  onBack: () => void;
}

export default function PatientView({
  queue: initialQueue,
  patientNumber,
  onBack,
}: PatientViewProps) {
  const [queue, setQueue] = useState<Queue>(initialQueue);
  const [patientInfo, setPatientInfo] = useState<{
    serialNumber: number;
    patientName: string;
  } | null>(null);

  /* ---------------- PATIENT INFO ---------------- */

  useEffect(() => {
    const loadPatientInfo = async () => {
      const info = await getPatientBySerial(queue.id, patientNumber);
      if (info) {
        setPatientInfo({
          serialNumber: info.serialNumber,
          patientName: info.patientName,
        });
      }
    };
    loadPatientInfo();
  }, [queue.id, patientNumber]);

  /* ---------------- REAL TIME UPDATE ---------------- */

  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    // Initialize time
    const initTime = Date.now();
    setCurrentTime(initTime);

    const interval = setInterval(async () => {
      const updated = await getQueue(queue.id);
      if (updated) setQueue(updated);
      setCurrentTime(Date.now()); // Update time for calculations
    }, 2000);

    const unsubscribe = onQueueUpdate(async (queueId) => {
      if (queueId === queue.id) {
        const updated = await getQueue(queueId);
        if (updated) setQueue(updated);
      }
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [queue.id]);

  /* ---------------- IDEAL CALCULATION ---------------- */

  const currentServing = queue.currentNumber;

  // Calculate completed patients:
  // A patient is completed if their serialNumber < currentNumber (they've been served and passed)
  // AND they have completedAt set
  const completedPatients =
    queue.patientHistory?.filter(
      (p) => p.serialNumber < queue.currentNumber && p.completedAt !== null
    ) || [];

  // Use calculateAverageTime for consistency with calculateWaitTime
  const avgTime = calculateAverageTime(queue);

  // Patient status checks
  const isCurrentlyBeingServed = patientNumber === currentServing; // Currently being served
  const isYourTurn = patientNumber === currentServing + 1; // Next in line
  const alreadyServed = patientNumber < currentServing; // Already completed (strictly less than)
  const notJoinedYet = patientNumber > queue.totalPatientsJoined;

  /* -------- PEOPLE AHEAD CALCULATION -------- */

  // Count people ahead: current patient (if ahead) + others waiting
  const peopleAhead =
    patientNumber > currentServing
      ? patientNumber - currentServing // Includes current patient if ahead
      : 0;

  /* -------- FINAL WAIT TIME (SMART PREDICTION) -------- */

  // Use calculateWaitTime with currentTime for smart prediction
  // This automatically handles current patient's remaining time intelligently
  // If current patient is taking longer (e.g., 20 min), it predicts remaining time accurately
  const waitTime = calculateWaitTime(queue, patientNumber, currentTime);

  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 p-4">
      <div className="max-w-md mx-auto">
        {/* HEADER */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold">{queue.doctorName}</h1>
              <p className="text-sm text-gray-600">Queue Status</p>
            </div>
            <button onClick={onBack}>✕</button>
          </div>

          <div className="mt-3 text-sm">
            {queue.status === "active" && "🟢 Queue চলছে"}
            {queue.status === "paused" && "🟡 Queue বিরতিতে"}
            {queue.status === "idle" && "⚪ Queue শুরু হয়নি"}
          </div>
        </div>

        {/* TOKEN */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 text-center">
          {patientInfo?.patientName && (
            <p className="font-medium mb-1">{patientInfo.patientName}</p>
          )}
          <p className="text-gray-600">আপনার Serial</p>
          <p className="text-5xl font-bold mt-2">{patientNumber}</p>
        </div>

        {/* STATES */}
        {notJoinedYet && (
          <div className="bg-orange-100 p-6 rounded-lg text-center mb-6">
            আপনি এখনো queue তে join করেননি
          </div>
        )}

        {alreadyServed && (
          <div className="bg-gray-100 p-6 rounded-lg text-center mb-6">
            আপনার পালা শেষ হয়েছে 🙏
          </div>
        )}

        {isCurrentlyBeingServed && queue.status === "active" && (
          <div className="bg-blue-100 p-6 rounded-lg text-center mb-6 animate-pulse">
            <p className="text-2xl font-bold text-blue-700">
              আপনার পালা চলছে! 🔔
            </p>
            <p>ডাক্তার এখন আপনাকে দেখছেন</p>
          </div>
        )}

        {isYourTurn && queue.status === "active" && (
          <div className="bg-green-100 p-6 rounded-lg text-center mb-6 animate-pulse">
            <p className="text-2xl font-bold text-green-700">
              আপনার পালা এসেছে!
            </p>
            <p>দয়া করে ডাক্তারের কাছে যান</p>
          </div>
        )}

        {!alreadyServed &&
          !isCurrentlyBeingServed &&
          !isYourTurn &&
          queue.status === "active" && (
            <>
              {/* CURRENT */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-4">
                <p className="text-sm text-gray-600">এখন চলছে</p>
                <p className="text-4xl font-bold">{currentServing || "--"}</p>
              </div>

              {/* AHEAD */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-4">
                <p className="text-sm text-gray-600">আপনার আগে</p>
                <p className="text-4xl font-bold text-blue-600">
                  {peopleAhead}
                </p>
              </div>

              {/* WAIT TIME */}
              <div className="bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-lg p-6 mb-4">
                <p className="text-sm opacity-90">আনুমানিক অপেক্ষার সময়</p>
                <p className="text-5xl font-bold">{waitTime} মিনিট</p>

                <p className="text-xs mt-2 opacity-80">
                  {completedPatients.length > 0 ? (
                    <>
                      গড় {avgTime} মিনিট/রোগী
                      <span className="text-green-200 ml-1">
                        ({completedPatients.length} জন সম্পন্ন থেকে ✓)
                      </span>
                    </>
                  ) : (
                    <>
                      প্রাথমিক অনুমান {avgTime || 5} মিনিট/রোগী
                      <span className="opacity-60 ml-1">
                        (প্রথম রোগী শেষ হলে সঠিক হবে)
                      </span>
                    </>
                  )}
                </p>
              </div>
            </>
          )}

        {queue.status === "paused" && (
          <div className="bg-yellow-50 p-4 rounded-lg text-center">
            Queue সাময়িকভাবে বন্ধ আছে
          </div>
        )}
      </div>
    </div>
  );
}
