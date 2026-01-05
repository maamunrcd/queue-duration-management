import { useState, useEffect } from "react";
import type { Queue } from "../types";
import {
  saveQueue,
  onQueueUpdate,
  getQueue,
  calculateWaitTime,
  callNextPatient,
} from "../utils/firebaseStorage";

interface DoctorPanelProps {
  queue: Queue;
  onBack: () => void;
}

export default function DoctorPanel({
  queue: initialQueue,
  onBack,
}: DoctorPanelProps) {
  const [queue, setQueue] = useState(initialQueue);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    // Initialize current time
    const initTime = Date.now();
    setCurrentTime(initTime);

    // Real-time updates: poll every 2 seconds + listen to Firebase
    const interval = setInterval(async () => {
      const updated = await getQueue(queue.id);
      if (updated) {
        setQueue(updated);
      }
      setCurrentTime(Date.now()); // Update time for calculations
    }, 2000);

    // Listen for updates from Firebase
    const unsubscribe = onQueueUpdate(async (queueId) => {
      if (queueId === queue.id) {
        const updated = await getQueue(queueId);
        if (updated) {
          setQueue(updated);
        }
      }
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [queue.id]);

  const handleStart = async () => {
    if (queue.status === "idle") {
      const updated = {
        ...queue,
        status: "active" as const,
        currentNumber: 1,
        queueStartTime: new Date().toISOString(), // Track when queue actually started
        currentPatientStartTime: new Date().toISOString(), // Start timing for first patient
      };
      await saveQueue(updated);
      setQueue(updated);
    }
  };

  const handlePause = async () => {
    const updated = { ...queue, status: "paused" as const };
    await saveQueue(updated);
    setQueue(updated);
  };

  const handleResume = async () => {
    const updated = { ...queue, status: "active" as const };
    await saveQueue(updated);
    setQueue(updated);
  };

  const handleNext = async () => {
    // Use the utility function which handles time tracking
    await callNextPatient(queue.id);

    // Reload queue to get updated data
    const updated = await getQueue(queue.id);
    if (updated) {
      setQueue(updated);
    }
  };

  const handleReset = () => {
    if (confirm("Queue reset করতে চান? সব data মুছে যাবে!")) {
      const updated = {
        ...queue,
        currentNumber: 0,
        totalPatientsJoined: 0,
        status: "idle" as const,
        patientHistory: [],
        currentPatientStartTime: null,
      };
      saveQueue(updated);
      setQueue(updated);
    }
  };

  const patientsWaiting = Math.max(
    0,
    queue.totalPatientsJoined - queue.currentNumber
  );
  const currentPatientDuration =
    queue.currentPatientStartTime && currentTime > 0
      ? Math.floor(
          (currentTime - new Date(queue.currentPatientStartTime).getTime()) /
            1000 /
            60
        )
      : 0;

  // Get current patient info
  const currentPatient = queue.patientHistory.find(
    (p) => p.serialNumber === queue.currentNumber
  );
  const nextPatient = queue.patientHistory.find(
    (p) => p.serialNumber === queue.currentNumber + 1
  );

  // Check if all patients are done
  const allPatientsComplete =
    queue.currentNumber >= queue.totalPatientsJoined &&
    queue.totalPatientsJoined > 0;

  // Calculate completed patients:
  // A patient is completed if their serialNumber < currentNumber (they've been served and passed)
  // OR if they have completedAt set AND serialNumber < currentNumber
  const completedPatients =
    queue.patientHistory?.filter(
      (p) => p.serialNumber < queue.currentNumber && p.completedAt !== null
    ) || [];

  // Calculate average from completed patients with valid serviceDuration
  const completedWithDuration = completedPatients.filter(
    (p) => p.serviceDuration !== null && p.serviceDuration >= 0
  );

  let dynamicAvgTime = 0;
  if (completedWithDuration.length > 0) {
    // Sum of all actual service durations (from start to end time)
    const totalServiceTime = completedWithDuration.reduce(
      (sum, p) => sum + (p.serviceDuration ?? 0),
      0
    );
    // Average = Total service time / Number of completed patients with duration
    dynamicAvgTime = Number(
      (totalServiceTime / completedWithDuration.length).toFixed(2)
    );
  } else {
    // Fallback to stored value if no completed patients yet
    dynamicAvgTime = queue.avgTimePerPatient > 0 ? queue.avgTimePerPatient : 5;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {queue.doctorName}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                ডাক্তার Control Panel
              </p>
            </div>
            <button
              onClick={onBack}
              className="text-gray-600 hover:text-gray-800"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div
            className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
              queue.status === "active"
                ? "bg-green-100 text-green-700"
                : queue.status === "paused"
                ? "bg-yellow-100 text-yellow-700"
                : queue.status === "completed"
                ? "bg-gray-100 text-gray-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full mr-2 ${
                queue.status === "active"
                  ? "bg-green-500 animate-pulse"
                  : queue.status === "paused"
                  ? "bg-yellow-500"
                  : "bg-gray-500"
              }`}
            />
            {queue.status === "active" && "Queue চলছে"}
            {queue.status === "paused" && "Queue বিরতিতে আছে"}
            {queue.status === "idle" && "Queue শুরু হয়নি"}
            {queue.status === "completed" && "Queue শেষ"}
          </div>
        </div>

        {/* Current Number Display */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <p className="text-center text-gray-600 mb-2">এখন ডাকা হচ্ছে</p>
          <div className="text-center">
            <div className="inline-block bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl px-12 py-8 shadow-xl">
              <p className="text-6xl font-bold">
                {queue.currentNumber === 0 ? "--" : queue.currentNumber}
              </p>
              {currentPatient?.patientName && (
                <p className="text-lg mt-3 opacity-90">
                  {currentPatient.patientName}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">অপেক্ষমান</p>
              <p className="text-2xl font-bold text-yellow-600">
                {patientsWaiting}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">মোট Joined</p>
              <p className="text-2xl font-bold text-gray-800">
                {queue.totalPatientsJoined}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">বর্তমানে</p>
              <p className="text-xl font-bold text-blue-600">
                {currentPatientDuration} min
              </p>
            </div>
          </div>

          {/* Next Patient Preview */}
          {nextPatient && queue.status === "active" && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-600 mb-1">পরবর্তী রোগী:</p>
              <p className="text-sm font-semibold text-blue-800">
                #{nextPatient.serialNumber} - {nextPatient.patientName}
              </p>
            </div>
          )}
        </div>

        {/* Control Buttons */}
        <div className="space-y-3">
          {queue.status === "idle" && (
            <button
              onClick={handleStart}
              className="w-full bg-green-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-green-700 transition-colors shadow-lg flex items-center justify-center"
            >
              <svg
                className="w-6 h-6 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Queue শুরু করুন
            </button>
          )}

          {queue.status === "active" && (
            <>
              {allPatientsComplete ? (
                <div className="bg-green-50 border-2 border-green-300 rounded-lg p-6 text-center">
                  <svg
                    className="w-16 h-16 text-green-500 mx-auto mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <h3 className="text-xl font-bold text-green-700 mb-2">
                    সব রোগী শেষ! 🎉
                  </h3>
                  <p className="text-sm text-green-600">
                    আর কোনো রোগী অপেক্ষা করছে না।
                  </p>
                  <p className="text-xs text-gray-600 mt-2">
                    মোট {queue.totalPatientsJoined} জন completed!
                  </p>
                </div>
              ) : (
                <>
                  <button
                    onClick={handleNext}
                    disabled={allPatientsComplete}
                    className="w-full py-6 rounded-lg font-bold text-xl transition-colors shadow-lg flex items-center justify-center bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    <svg
                      className="w-8 h-8 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                    পরবর্তী রোগী ডাকুন
                  </button>

                  {currentPatientDuration > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                      <p className="text-sm text-blue-800">
                        বর্তমান রোগীর সাথে{" "}
                        <span className="font-bold">
                          {currentPatientDuration} মিনিট
                        </span>{" "}
                        হয়েছে
                      </p>
                    </div>
                  )}
                </>
              )}

              <button
                onClick={handlePause}
                className="w-full bg-yellow-500 text-white py-3 rounded-lg font-semibold hover:bg-yellow-600 transition-colors flex items-center justify-center"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                বিরতি নিন
              </button>
            </>
          )}

          {queue.status === "paused" && (
            <button
              onClick={handleResume}
              className="w-full bg-green-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-green-700 transition-colors shadow-lg flex items-center justify-center"
            >
              <svg
                className="w-6 h-6 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Queue আবার শুরু করুন
            </button>
          )}

          {queue.currentNumber > 0 && (
            <button
              onClick={handleReset}
              className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Queue Reset করুন
            </button>
          )}
        </div>

        {/* Waiting List */}
        {queue.patientHistory.filter(
          (p) => p.serialNumber > queue.currentNumber
        ).length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
            <h3 className="font-semibold text-gray-800 mb-3">
              অপেক্ষমান রোগী (
              {
                queue.patientHistory.filter(
                  (p) => p.serialNumber > queue.currentNumber
                ).length
              }
              )
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {queue.patientHistory
                .filter((p) => p.serialNumber > queue.currentNumber)
                .slice(0, 10) // Show first 10 waiting
                .map((patient) => (
                  <div
                    key={patient.serialNumber}
                    className="flex items-center justify-between p-2 bg-yellow-50 rounded"
                  >
                    <span className="text-sm font-medium text-gray-800">
                      #{patient.serialNumber} - {patient.patientName}
                    </span>
                    <span className="text-xs text-gray-600">
                      {calculateWaitTime(
                        queue,
                        patient.serialNumber,
                        currentTime
                      )}{" "}
                      min
                    </span>
                  </div>
                ))}
              {queue.patientHistory.filter(
                (p) => p.serialNumber > queue.currentNumber
              ).length > 10 && (
                <p className="text-xs text-center text-gray-500 mt-2">
                  আরো{" "}
                  {queue.patientHistory.filter(
                    (p) => p.serialNumber > queue.currentNumber
                  ).length - 10}{" "}
                  জন...
                </p>
              )}
            </div>
          </div>
        )}

        {/* Stats */}
        {queue.currentNumber > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
            <h3 className="font-semibold text-gray-800 mb-3">
              আজকের পরিসংখ্যান
            </h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {completedPatients.length}
                </p>
                <p className="text-xs text-gray-600">Completed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">
                  {patientsWaiting}
                </p>
                <p className="text-xs text-gray-600">Waiting</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {dynamicAvgTime} min
                </p>
                <p className="text-xs text-gray-600">
                  Avg Time
                  {completedWithDuration.length > 0 ? (
                    <span className="block text-green-600 font-normal">
                      ({completedWithDuration.length} জন থেকে ✓)
                    </span>
                  ) : (
                    <span className="block text-gray-500 font-normal">
                      (প্রাথমিক অনুমান)
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Last 5 patients service time */}
            {completedPatients.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-600 mb-2">
                  সর্বশেষ Completed রোগী:
                </p>
                <div className="space-y-1">
                  {completedPatients
                    .slice(-5)
                    .reverse()
                    .map((patient, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center px-3 py-2 bg-blue-50 rounded text-xs"
                      >
                        <span className="font-medium text-blue-800">
                          #{patient.serialNumber} - {patient.patientName}
                        </span>
                        <span className="text-blue-600 font-bold">
                          {patient.serviceDuration?.toFixed(1)} min
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
