import { useState, useEffect } from "react";
import type { Queue } from "../types";
import {
  saveQueue,
  onQueueUpdate,
  getQueue,
  calculateWaitTime,
  callNextPatient,
  markPatientAsAbsent,
  reAddAbsentPatient,
  endQueue,
  resumeQueue,
} from "../utils/storage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  ArrowLeft,
  Users,
  Clock,
  CheckCircle2,
  UserX,
  UserCheck,
  AlertCircle,
} from "lucide-react";

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
  const [showAbsentList, setShowAbsentList] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: "absent" | "reset" | "end" | "resume" | null;
    serialNumber?: number;
  }>({ open: false, type: null });

  useEffect(() => {
    const updateTime = () => setCurrentTime(Date.now());
    updateTime(); // Initial update

    const interval = setInterval(() => {
      const updated = getQueue(queue.id);
      if (updated) {
        setQueue(updated);
      }
      updateTime();
    }, 2000);

    onQueueUpdate((queueId) => {
      if (queueId === queue.id) {
        const updated = getQueue(queueId);
        if (updated) {
          setQueue(updated);
        }
      }
    });

    return () => {
      clearInterval(interval);
    };
  }, [queue.id]);

  const handleStart = () => {
    if (queue.status === "idle") {
      const updated = {
        ...queue,
        status: "active" as const,
        currentNumber: 1,
        queueStartTime: new Date().toISOString(),
        currentPatientStartTime: new Date().toISOString(),
      };
      saveQueue(updated);
      setQueue(updated);
    }
  };

  const handlePause = () => {
    const updated = { ...queue, status: "paused" as const };
    saveQueue(updated);
    setQueue(updated);
  };

  const handleResume = () => {
    const updated = { ...queue, status: "active" as const };
    saveQueue(updated);
    setQueue(updated);
  };

  const handleEndQueue = () => {
    setConfirmDialog({
      open: true,
      type: "end",
    });
  };

  const handleResumeQueue = () => {
    setConfirmDialog({
      open: true,
      type: "resume",
    });
  };

  const confirmEndQueue = () => {
    endQueue(queue.id);
    const updated = getQueue(queue.id);
    if (updated) {
      setQueue(updated);
    }
    setConfirmDialog({ open: false, type: null });
  };

  const confirmResumeQueue = () => {
    resumeQueue(queue.id);
    const updated = getQueue(queue.id);
    if (updated) {
      setQueue(updated);
    }
    setConfirmDialog({ open: false, type: null });
  };

  const handleNext = () => {
    callNextPatient(queue.id);
    const updated = getQueue(queue.id);
    if (updated) {
      setQueue(updated);
    }
  };

  const handleReset = () => {
    setConfirmDialog({
      open: true,
      type: "reset",
    });
  };

  const confirmReset = () => {
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
  };

  const handleMarkAbsent = (serialNumber: number) => {
    setConfirmDialog({
      open: true,
      type: "absent",
      serialNumber,
    });
  };

  const confirmMarkAbsent = () => {
    if (confirmDialog.serialNumber) {
      markPatientAsAbsent(queue.id, confirmDialog.serialNumber);
      const updated = getQueue(queue.id);
      if (updated) setQueue(updated);
    }
  };

  const handleReAddPatient = (serialNumber: number) => {
    reAddAbsentPatient(queue.id, serialNumber);
    const updated = getQueue(queue.id);
    if (updated) setQueue(updated);
  };

  const currentPatientDuration =
    queue.currentPatientStartTime && currentTime > 0
      ? Math.floor(
          (currentTime - new Date(queue.currentPatientStartTime).getTime()) /
            1000 /
            60
        )
      : 0;

  const currentPatient = queue.patientHistory.find(
    (p) => p.serialNumber === queue.currentNumber
  );
  const nextPatient = queue.patientHistory.find(
    (p) => p.serialNumber === queue.currentNumber + 1
  );

  const allPatientsComplete =
    queue.currentNumber >= queue.totalPatientsJoined &&
    queue.totalPatientsJoined > 0;

  const completedPatients =
    queue.patientHistory?.filter(
      (p) => p.serialNumber < queue.currentNumber && p.completedAt !== null
    ) || [];

  const presentPatients =
    queue.patientHistory?.filter(
      (p) =>
        p.serialNumber > queue.currentNumber &&
        (p.status === "present" || !p.status || p.status !== "absent")
    ) || [];

  const absentPatients =
    queue.patientHistory?.filter((p) => p.status === "absent") || [];

  const completedWithDuration = completedPatients.filter(
    (p) => p.serviceDuration !== null && p.serviceDuration >= 0
  );

  const dynamicAvgTime =
    completedWithDuration.length > 0
      ? Number(
          (
            completedWithDuration.reduce(
              (sum, p) => sum + (p.serviceDuration ?? 0),
              0
            ) / completedWithDuration.length
          ).toFixed(2)
        )
      : queue.avgTimePerPatient > 0
      ? queue.avgTimePerPatient
      : 5;

  const patientsWaiting = Math.max(
    0,
    queue.totalPatientsJoined - queue.currentNumber
  );

  return (
    <>
      <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b shadow-sm px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                aria-label="Go back"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {queue.doctorName}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Doctor Control Panel
                </p>
              </div>
            </div>
            <Badge
              variant={
                queue.status === "active"
                  ? "success"
                  : queue.status === "paused"
                  ? "warning"
                  : queue.status === "ended"
                  ? "destructive"
                  : "secondary"
              }
              className="text-sm px-3 py-1"
            >
              {queue.status === "active" && "Active"}
              {queue.status === "paused" && "Paused"}
              {queue.status === "idle" && "Idle"}
              {queue.status === "ended" && "Ended"}
              {queue.status === "completed" && "Completed"}
            </Badge>
          </div>
        </header>

        {/* Main Content - Full Screen Layout */}
        <main className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
          {/* Left Column - Current Patient & Controls */}
          <section className="lg:col-span-2 flex flex-col gap-4 overflow-y-auto">
            {/* Current Patient Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Current Patient
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {queue.currentNumber > 0 ? (
                  <>
                    <div className="text-center space-y-2">
                      <div className="text-5xl font-bold text-primary">
                        #{queue.currentNumber}
                      </div>
                      <p className="text-xl font-semibold">
                        {currentPatient?.patientName || "Unknown"}
                      </p>
                      {currentPatient?.age && (
                        <p className="text-sm text-muted-foreground">
                          Age: {currentPatient.age}
                        </p>
                      )}
                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Duration: {currentPatientDuration} minutes</span>
                      </div>
                    </div>
                    <Separator />
                    {nextPatient && (
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-1">
                          Next Patient
                        </p>
                        <p className="text-lg font-semibold">
                          #{nextPatient.serialNumber} -{" "}
                          {nextPatient.patientName}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No patient currently being served</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Control Buttons */}
            <Card>
              <CardHeader>
                <CardTitle>Queue Controls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {queue.status === "idle" && (
                    <Button
                      onClick={handleStart}
                      className="col-span-2 h-12"
                      size="lg"
                    >
                      <Play className="mr-2 h-5 w-5" />
                      Start Queue
                    </Button>
                  )}
                  {queue.status === "active" && (
                    <>
                      <Button
                        onClick={handlePause}
                        variant="outline"
                        className="h-12"
                      >
                        <Pause className="mr-2 h-5 w-5" />
                        Pause
                      </Button>
                      <Button
                        onClick={handleNext}
                        className="h-12"
                        disabled={allPatientsComplete}
                      >
                        <SkipForward className="mr-2 h-5 w-5" />
                        Next Patient
                      </Button>
                    </>
                  )}
                  {queue.status === "paused" && (
                    <>
                      <Button
                        onClick={handleResume}
                        className="col-span-2 h-12"
                        size="lg"
                      >
                        <Play className="mr-2 h-5 w-5" />
                        Resume Queue
                      </Button>
                    </>
                  )}
                  {queue.status === "active" && (
                    <Button
                      onClick={handleEndQueue}
                      variant="outline"
                      className="col-span-2 h-12"
                      size="lg"
                    >
                      <AlertCircle className="mr-2 h-5 w-5" />
                      End Queue
                    </Button>
                  )}
                  {queue.status === "ended" && (
                    <Button
                      onClick={handleResumeQueue}
                      className="col-span-2 h-12"
                      size="lg"
                    >
                      <Play className="mr-2 h-5 w-5" />
                      Resume Queue
                    </Button>
                  )}
                  {queue.currentNumber > 0 && (
                    <Button
                      onClick={handleReset}
                      variant="destructive"
                      className="col-span-2 h-12"
                      size="lg"
                    >
                      <RotateCcw className="mr-2 h-5 w-5" />
                      Reset Queue
                    </Button>
                  )}
                </div>
                {allPatientsComplete && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto mb-1" />
                    <p className="text-sm text-green-700 font-medium">
                      All patients completed!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Today's Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-3xl font-bold text-green-600">
                      {completedPatients.length}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Completed
                    </p>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-yellow-600">
                      {patientsWaiting}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Waiting
                    </p>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-blue-600">
                      {dynamicAvgTime}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Avg Time (min)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Right Column - Patient Lists */}
          <section className="flex flex-col gap-4 overflow-y-auto">
            {/* Present Patients */}
            {presentPatients.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-green-600" />
                    Present ({presentPatients.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {presentPatients.map((patient) => (
                      <div
                        key={patient.serialNumber}
                        className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">
                            #{patient.serialNumber} - {patient.patientName}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            {patient.age && (
                              <p className="text-xs text-muted-foreground">
                                Age: {patient.age}
                              </p>
                            )}
                            {patient.mobile && (
                              <a
                                href={`tel:${patient.mobile}`}
                                className="text-xs text-blue-600 hover:text-blue-800 underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                📞 {patient.mobile}
                              </a>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Wait:{" "}
                            {calculateWaitTime(queue, patient.serialNumber)} min
                          </p>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleMarkAbsent(patient.serialNumber)}
                          className="ml-2 shrink-0"
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Absent Patients */}
            {absentPatients.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <UserX className="h-5 w-5 text-red-600" />
                      Absent ({absentPatients.length})
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAbsentList(!showAbsentList)}
                    >
                      {showAbsentList ? "Hide" : "Show"}
                    </Button>
                  </div>
                </CardHeader>
                {showAbsentList && (
                  <CardContent>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {absentPatients.map((patient) => (
                        <div
                          key={patient.serialNumber}
                          className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm">
                              #{patient.serialNumber} - {patient.patientName}
                            </p>
                            <div className="flex items-center gap-3 mt-1">
                              {patient.age && (
                                <p className="text-xs text-muted-foreground">
                                  Age: {patient.age}
                                </p>
                              )}
                              {patient.mobile && (
                                <a
                                  href={`tel:${patient.mobile}`}
                                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  📞 {patient.mobile}
                                </a>
                              )}
                            </div>
                            {patient.reAddedAt && (
                              <p className="text-xs text-orange-600 mt-1">
                                ⏰ Late arrival (Re-added)
                              </p>
                            )}
                          </div>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() =>
                              handleReAddPatient(patient.serialNumber)
                            }
                            className="ml-2 shrink-0"
                          >
                            <UserCheck className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            )}
          </section>
        </main>
      </div>

      {/* Confirm Dialogs */}
      <ConfirmDialog
        open={confirmDialog.open && confirmDialog.type === "absent"}
        onOpenChange={(open) =>
          setConfirmDialog({ open, type: open ? "absent" : null })
        }
        title="Mark Patient as Absent"
        description={`Are you sure you want to mark Serial #${confirmDialog.serialNumber} as absent?`}
        confirmText="Mark Absent"
        cancelText="Cancel"
        onConfirm={confirmMarkAbsent}
        variant="destructive"
      />

      <ConfirmDialog
        open={confirmDialog.open && confirmDialog.type === "reset"}
        onOpenChange={(open) =>
          setConfirmDialog({ open, type: open ? "reset" : null })
        }
        title="Reset Queue"
        description="Are you sure you want to reset the queue? All data will be deleted!"
        confirmText="Reset"
        cancelText="Cancel"
        onConfirm={confirmReset}
        variant="destructive"
      />

      <ConfirmDialog
        open={confirmDialog.open && confirmDialog.type === "end"}
        onOpenChange={(open) =>
          setConfirmDialog({ open, type: open ? "end" : null })
        }
        title="End Queue"
        description="Are you sure you want to end this queue? No new serials can be issued after ending."
        confirmText="End Queue"
        cancelText="Cancel"
        onConfirm={confirmEndQueue}
        variant="destructive"
      />

      <ConfirmDialog
        open={confirmDialog.open && confirmDialog.type === "resume"}
        onOpenChange={(open) =>
          setConfirmDialog({ open, type: open ? "resume" : null })
        }
        title="Resume Queue"
        description="Resume this queue to allow new serials to be issued again."
        confirmText="Resume Queue"
        cancelText="Cancel"
        onConfirm={confirmResumeQueue}
        variant="default"
      />
    </>
  );
}
