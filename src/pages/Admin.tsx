import { useState, useEffect } from "react";
import QRCode from "react-qr-code";
import type { Queue } from "../types";
import {
  saveQueue,
  generateId,
  getAllQueues,
  deleteQueue,
} from "../utils/firebaseStorage";

export default function Admin() {
  const [doctorName, setDoctorName] = useState("");
  const [secretCode, setSecretCode] = useState("");
  const [avgTime, setAvgTime] = useState<number | string>(""); // optional initial estimate
  const [generatedQueue, setGeneratedQueue] = useState<Queue | null>(null);
  const [existingQueues, setExistingQueues] = useState<Queue[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredDoctors, setFilteredDoctors] = useState<string[]>([]);

  // Load existing queues
  const loadQueues = async () => {
    const data = await getAllQueues();
    setExistingQueues(Object.values(data.queues));
  };

  // Get unique doctor names for auto-suggest
  const getUniqueDoctorNames = (): string[] => {
    const doctors = new Set<string>();
    existingQueues.forEach((queue) => {
      if (queue.doctorName) {
        doctors.add(queue.doctorName);
      }
    });
    return Array.from(doctors).sort();
  };

  // Handle doctor name input with auto-suggest
  const handleDoctorNameChange = (value: string) => {
    setDoctorName(value);
    if (value.length > 0) {
      const allDoctors = getUniqueDoctorNames();
      const filtered = allDoctors.filter((doctor) =>
        doctor.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredDoctors(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  // Select doctor from suggestions
  const selectDoctor = (name: string) => {
    setDoctorName(name);
    setShowSuggestions(false);
    setFilteredDoctors([]);
  };

  useEffect(() => {
    loadQueues();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!doctorName || !secretCode) {
      alert("দয়া করে সব তথ্য fill করুন!");
      return;
    }

    // Get current date for day-wise serial reset
    const currentDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    const queue: Queue = {
      id: generateId(),
      doctorName,
      secretCode,
      currentNumber: 0,
      totalPatientsJoined: 0, // starts at 0, resets each day
      currentDate, // Track current date for day-wise serial reset
      status: "idle",
      avgTimePerPatient: avgTime ? Number(avgTime) : 5, // optional initial estimate, default 5 min
      patientHistory: [], // track actual service times
      currentPatientStartTime: null,
      queueStartTime: null, // will be set when queue starts (first 'active' status)
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };

    await saveQueue(queue);
    setGeneratedQueue(queue);
    await loadQueues();

    // Reset form
    setDoctorName("");
    setSecretCode("");
    setAvgTime("");
  };

  const handleDelete = async (queueId: string) => {
    if (confirm("এই queue delete করতে চান?")) {
      await deleteQueue(queueId);
      await loadQueues();
      if (generatedQueue?.id === queueId) {
        setGeneratedQueue(null);
      }
    }
  };

  const queueUrl = generatedQueue
    ? `${globalThis.location.origin}/queue/${generatedQueue.id}`
    : "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Queue Duration Management
          </h1>
          <p className="text-gray-600">
            ডাক্তার/কাউন্টার এর জন্য QR Code তৈরি করুন - Real-time Wait Time
            Tracking
          </p>
        </div>

        {/* Generate New Queue Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            নতুন Queue তৈরি করুন
          </h2>

          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ডাক্তার/কাউন্টার এর নাম *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={doctorName}
                  onChange={(e) => handleDoctorNameChange(e.target.value)}
                  onFocus={() => {
                    if (doctorName.length > 0) {
                      const allDoctors = getUniqueDoctorNames();
                      const filtered = allDoctors.filter((doctor) =>
                        doctor.toLowerCase().includes(doctorName.toLowerCase())
                      );
                      setFilteredDoctors(filtered);
                      setShowSuggestions(filtered.length > 0);
                    }
                  }}
                  onBlur={() => {
                    // Delay to allow click on suggestion
                    setTimeout(() => setShowSuggestions(false), 200);
                  }}
                  placeholder="যেমন: ডা. রহমান - কার্ডিওলজি (Type to search existing doctors)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                {showSuggestions && filteredDoctors.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredDoctors.map((doctor, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => selectDoctor(doctor)}
                        className="w-full text-left px-4 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                      >
                        <span className="text-sm text-gray-800">{doctor}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Secret Code (ডাক্তার login এর জন্য) *
              </label>
              <input
                type="text"
                value={secretCode}
                onChange={(e) => setSecretCode(e.target.value)}
                placeholder="যেমন: 1234"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                এই code দিয়ে শুধু ডাক্তার queue control করতে পারবে
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                প্রাথমিক আনুমানিক সময় (Optional)
              </label>
              <input
                type="number"
                value={avgTime}
                onChange={(e) => setAvgTime(e.target.value)}
                placeholder="খালি রাখলে default 5 মিনিট"
                min="0"
                max="60"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                মিনিট/রোগী (খালি থাকলে 5 min default, পরে automatic calculate
                হবে)
              </p>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              QR Code তৈরি করুন
            </button>
          </form>
        </div>

        {/* Generated QR Code */}
        {generatedQueue && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-green-600">
              ✅ QR Code তৈরি হয়েছে!
            </h2>

            <div className="bg-gray-50 p-6 rounded-lg mb-4">
              <div className="flex flex-col items-center">
                <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
                  <QRCode value={queueUrl} size={200} />
                </div>

                <div className="text-center">
                  <p className="font-semibold text-lg text-gray-800">
                    {generatedQueue.doctorName}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    Secret Code:{" "}
                    <span className="font-mono font-bold">
                      {generatedQueue.secretCode}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    (ডাক্তার কে দিন, রোগীদের দেখাবেন না!)
                  </p>
                  <p className="text-xs text-green-600 mt-2">
                    ℹ️ রোগীরা auto serial পাবে অথবা manual number দিতে পারবে
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    মোট Join করেছে:{" "}
                    <span className="font-bold">
                      {generatedQueue.totalPatientsJoined}
                    </span>{" "}
                    জন
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-800 mb-2">
                  📱 QR Scan করলে এই URL open হবে:
                </p>
                <a
                  href={queueUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 break-all hover:underline"
                >
                  {queueUrl}
                </a>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-gray-800">পরবর্তী পদক্ষেপ:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                <li>QR Code প্রিন্ট করুন (Right click → Print)</li>
                <li>ডাক্তারের chamber এ লাগান</li>
                <li>ডাক্তার কে Secret Code দিন</li>
                <li>রোগীরা scan করবে এবং serial number enter করবে</li>
              </ol>
            </div>
          </div>
        )}

        {/* Existing Queues List */}
        {existingQueues.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                বর্তমান Queues ({existingQueues.length})
              </h2>
              <button
                onClick={() => loadQueues()}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                🔄 Refresh
              </button>
            </div>

            <div className="space-y-3">
              {existingQueues.map((queue) => (
                <div
                  key={queue.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-800">
                        {queue.doctorName}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Current: {queue.currentNumber} | Total Joined:{" "}
                        {queue.totalPatientsJoined}
                        <span
                          className={`ml-3 px-2 py-1 rounded text-xs font-medium ${
                            queue.status === "active"
                              ? "bg-green-100 text-green-700"
                              : queue.status === "paused"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {queue.status.toUpperCase()}
                        </span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Avg Time: {queue.avgTimePerPatient} min/patient
                        {queue.patientHistory &&
                          queue.patientHistory.length > 0 &&
                          ` (${
                            queue.patientHistory.filter((p) => p.completedAt)
                              .length
                          } completed)`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={`/queue/${queue.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 text-sm"
                      >
                        Open
                      </a>
                      <button
                        onClick={() => handleDelete(queue.id)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
