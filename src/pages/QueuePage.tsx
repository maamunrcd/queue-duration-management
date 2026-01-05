import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { Queue } from "../types";
import { getQueue, onQueueUpdate, joinQueue } from "../utils/firebaseStorage";
import DoctorPanel from "../components/DoctorPanel";
import PatientView from "../components/PatientView";

type ViewMode = "select" | "doctor" | "patient" | "confirmation";

export default function QueuePage() {
  const { queueId } = useParams<{ queueId: string }>();
  const navigate = useNavigate();
  const [queue, setQueue] = useState<Queue | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("select");
  const [secretInput, setSecretInput] = useState("");
  const [patientNumber, setPatientNumber] = useState("");
  const [patientName, setPatientName] = useState("");
  const [assignedSerial, setAssignedSerial] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!queueId) {
      navigate("/");
      return;
    }

    const loadQueue = async () => {
      const q = await getQueue(queueId);
      if (!q) {
        setError("Queue খুঁজে পাওয়া যায়নি!");
        return;
      }
      setQueue(q);
    };

    loadQueue();

    // Listen for real-time updates
    const unsubscribe = onQueueUpdate(async (updatedQueueId) => {
      if (updatedQueueId === queueId) {
        await loadQueue();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [queueId, navigate]);

  const handleDoctorLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!queue) return;

    if (secretInput === queue.secretCode) {
      setViewMode("doctor");
      setError("");
    } else {
      setError("ভুল secret code! আবার চেষ্টা করুন।");
    }
  };

  const handlePatientView = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(patientNumber);

    if (isNaN(num) || num < 1 || num > 999) {
      setError(`সঠিক serial number দিন (1-999)`);
      return;
    }

    setViewMode("patient");
    setError("");
  };

  if (error && !queue) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md">
          <div className="text-red-600 text-center mb-4">
            <svg
              className="w-16 h-16 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-lg font-semibold">{error}</p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
          >
            Admin Panel এ ফিরে যান
          </button>
        </div>
      </div>
    );
  }

  if (!queue) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  // Selection Screen
  if (viewMode === "select") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              {queue.doctorName}
            </h1>
            <p className="text-gray-600">আপনি কে?</p>
          </div>

          <div className="space-y-4">
            {/* Doctor Option */}
            <div className="border-2 border-blue-200 rounded-lg p-6 hover:border-blue-400 transition-colors">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <svg
                  className="w-6 h-6 mr-2 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                ডাক্তার/স্টাফ
              </h3>
              <form onSubmit={handleDoctorLogin} className="space-y-3">
                <input
                  type="password"
                  value={secretInput}
                  onChange={(e) => setSecretInput(e.target.value)}
                  placeholder="Secret Code দিন"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                {error && viewMode === "select" && (
                  <p className="text-red-600 text-sm">{error}</p>
                )}
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700"
                >
                  Serial Number Control Panel খুলুন
                </button>
              </form>
            </div>

            {/* Patient Option */}
            <div className="border-2 border-green-200 rounded-lg p-6 hover:border-green-400 transition-colors">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <svg
                  className="w-6 h-6 mr-2 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                রোগী/গ্রাহক
              </h3>

              {/* Auto Join with Name */}
              <div className="mb-4 p-4 bg-green-50 rounded-lg">
                <p className="text-sm font-medium text-green-800 mb-3">
                  ✨ নতুন রোগী? Auto Serial নিন:
                </p>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!patientName.trim()) {
                      setError("আপনার নাম লিখুন!");
                      return;
                    }
                    const result = await joinQueue(
                      queue!.id,
                      patientName.trim()
                    );
                    setAssignedSerial(result.serialNumber);
                    setPatientNumber(result.serialNumber.toString());
                    setViewMode("confirmation");
                    setError("");
                  }}
                  className="space-y-2"
                >
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="আপনার নাম লিখুন"
                    className="w-full px-4 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-green-500 to-teal-600 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-teal-700 shadow-md"
                  >
                    Auto Serial নিন (Auto Join)
                  </button>
                </form>
              </div>

              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-white text-gray-500">অথবা</span>
                </div>
              </div>

              {/* Existing Serial Lookup */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-800 mb-3">
                  📋 আগে থেকে Serial আছে? Status দেখুন:
                </p>
                <form onSubmit={handlePatientView} className="space-y-2">
                  <input
                    type="number"
                    value={patientNumber}
                    onChange={(e) => setPatientNumber(e.target.value)}
                    placeholder="Serial Number দিন"
                    min="1"
                    max="999"
                    className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700"
                  >
                    Status দেখুন
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <a href="/" className="text-sm text-gray-500 hover:text-gray-700">
              ← Admin Panel এ ফিরে যান
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Confirmation Screen (After Auto Join)
  if (viewMode === "confirmation" && assignedSerial) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <svg
              className="w-20 h-20 text-green-500 mx-auto mb-4"
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
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Queue তে যুক্ত হয়েছেন! ✅
            </h2>
            <p className="text-gray-600">আপনার তথ্য:</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-teal-600 text-white rounded-xl p-6 mb-6 shadow-lg">
            <div className="text-center">
              <p className="text-sm opacity-90 mb-2">নাম</p>
              <p className="text-2xl font-bold mb-4">{patientName}</p>

              <div className="border-t border-white/30 pt-4 mt-4">
                <p className="text-sm opacity-90 mb-2">Serial Number</p>
                <p className="text-6xl font-bold">{assignedSerial}</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800 mb-2">
              📱 <strong>গুরুত্বপূর্ণ:</strong> এই number টি মনে রাখুন!
            </p>
            <p className="text-xs text-blue-700">
              আপনি এই page খোলা রেখে বাইরে যেতে পারেন। Real-time update পাবেন!
            </p>
          </div>

          <button
            onClick={() => {
              setViewMode("patient");
            }}
            className="w-full bg-green-600 text-white py-4 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-md"
          >
            Queue Status দেখুন →
          </button>

          <button
            onClick={() => {
              setViewMode("select");
              setPatientName("");
              setPatientNumber("");
              setAssignedSerial(null);
            }}
            className="w-full mt-3 text-gray-600 hover:text-gray-800 text-sm"
          >
            ← ফিরে যান
          </button>
        </div>
      </div>
    );
  }

  // Doctor Panel
  if (viewMode === "doctor") {
    return <DoctorPanel queue={queue} onBack={() => setViewMode("select")} />;
  }

  // Patient View
  if (viewMode === "patient") {
    return (
      <PatientView
        queue={queue}
        patientNumber={parseInt(patientNumber)}
        onBack={() => {
          setViewMode("select");
          setPatientNumber("");
          setPatientName("");
          setAssignedSerial(null);
        }}
      />
    );
  }

  return null;
}
