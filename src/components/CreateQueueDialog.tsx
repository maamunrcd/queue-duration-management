import { useState, useEffect } from "react";
import type { Queue } from "../types";
import {
  saveQueue,
  generateId,
  getAllQueues,
  generateUniqueSecretCode,
  getUniqueDoctorNames,
} from "../utils/storage";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  User,
  Lock,
  Clock,
  Sparkles,
  Sun,
  Moon,
} from "lucide-react";

interface CreateQueueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onQueueCreated: (queue: Queue) => void;
  language: "bn" | "en";
}

export function CreateQueueDialog({
  open,
  onOpenChange,
  onQueueCreated,
  language,
}: CreateQueueDialogProps) {
  const [doctorName, setDoctorName] = useState("");
  const [codePrefix, setCodePrefix] = useState(""); // Optional prefix
  const [sessionType, setSessionType] = useState<"morning" | "evening">(
    "morning"
  ); // Session type
  const [avgTime, setAvgTime] = useState<number | string>("");
  const [serialLimit, setSerialLimit] = useState<number | string>(""); // Optional serial limit
  const [error, setError] = useState("");
  const [generatedCodePreview, setGeneratedCodePreview] = useState("");
  const [doctorSuggestions, setDoctorSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Auto-generate code preview when doctor name or prefix changes
  useEffect(() => {
    if (doctorName.trim()) {
      const preview = generateUniqueSecretCode(codePrefix.trim() || null);
      setGeneratedCodePreview(preview);

      // Update suggestions
      const allDoctors = getUniqueDoctorNames();
      const filtered = allDoctors.filter((name) =>
        name.toLowerCase().includes(doctorName.toLowerCase())
      );
      setDoctorSuggestions(filtered);
      setShowSuggestions(filtered.length > 0 && doctorName.trim().length > 0);
    } else {
      setGeneratedCodePreview("");
      setDoctorSuggestions([]);
      setShowSuggestions(false);
    }
  }, [codePrefix, doctorName]);

  // Auto-detect session type based on existing queues
  useEffect(() => {
    if (doctorName.trim()) {
      const data = getAllQueues();
      const existingQueues = Object.values(data.queues);
      const today = new Date().toISOString().split("T")[0];
      const todayQueues = existingQueues.filter(
        (q) =>
          q.doctorName.trim() === doctorName.trim() &&
          (q.currentDate ||
            new Date(q.createdAt).toISOString().split("T")[0]) === today
      );

      // If morning exists, default to evening, and vice versa
      const hasMorning = todayQueues.some(
        (q) => (q.sessionType || "morning") === "morning"
      );
      const hasEvening = todayQueues.some(
        (q) => (q.sessionType || "morning") === "evening"
      );

      if (hasMorning && !hasEvening) {
        setSessionType("evening");
      } else if (hasEvening && !hasMorning) {
        setSessionType("morning");
      } else {
        // Default to morning if no queues exist
        setSessionType("morning");
      }
    }
  }, [doctorName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!doctorName.trim()) {
      setError(
        language === "bn"
          ? "দয়া করে ডাক্তারের নাম দিন!"
          : "Please enter doctor name!"
      );
      return;
    }

    // Check if same doctor + same date + same session already exists
    const data = getAllQueues();
    const existingQueues = Object.values(data.queues);
    const today = new Date().toISOString().split("T")[0];
    const duplicateQueue = existingQueues.find(
      (q) =>
        q.doctorName.trim() === doctorName.trim() &&
        (q.currentDate || new Date(q.createdAt).toISOString().split("T")[0]) ===
          today &&
        (q.sessionType || "morning") === sessionType
    );

    if (duplicateQueue) {
      setError(
        language === "bn"
          ? `এই ডাক্তারের ${
              sessionType === "morning" ? "সকালের" : "বিকালের"
            } সেশনের জন্য ইতিমধ্যে Queue আছে।`
          : `Queue already exists for this doctor's ${sessionType} session today.`
      );
      return;
    }

    // Auto-generate unique secret code
    const secretCode = generateUniqueSecretCode(codePrefix.trim() || null);

    const currentDate = new Date().toISOString().split("T")[0];

    const queue: Queue = {
      id: generateId(),
      doctorName: doctorName.trim(),
      secretCode, // Auto-generated!
      sessionType, // Morning or Evening
      currentNumber: 0,
      totalPatientsJoined: 0,
      currentDate,
      status: "idle",
      avgTimePerPatient: avgTime ? Number(avgTime) : 5,
      serialLimit: serialLimit ? Number(serialLimit) : null, // Optional limit
      patientHistory: [],
      currentPatientStartTime: null,
      queueStartTime: null,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };

    saveQueue(queue);
    onQueueCreated(queue);

    // Reset form
    setDoctorName("");
    setCodePrefix("");
    setSessionType("morning");
    setAvgTime("");
    setSerialLimit("");
    setError("");
    setGeneratedCodePreview("");
    onOpenChange(false);
  };

  const handleClose = () => {
    setDoctorName("");
    setCodePrefix("");
    setSessionType("morning");
    setAvgTime("");
    setSerialLimit("");
    setError("");
    setGeneratedCodePreview("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader className="space-y-3 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl">
                {language === "bn"
                  ? "নতুন Queue তৈরি করুন"
                  : "Create New Queue"}
              </DialogTitle>
              <DialogDescription className="text-base mt-1">
                {language === "bn"
                  ? "ডাক্তারের জন্য Queue তৈরি করুন এবং QR Code Generate করুন"
                  : "Create a queue for doctor and generate QR code"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Doctor Name with Autocomplete */}
          <div className="space-y-2 relative">
            <Label
              htmlFor="dialog-doctorName"
              className="text-sm font-semibold flex items-center gap-2"
            >
              <User className="h-4 w-4 text-muted-foreground" />
              {language === "bn" ? "ডাক্তারের নাম" : "Doctor Name"}
              <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="dialog-doctorName"
                type="text"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                onFocus={() => {
                  if (doctorSuggestions.length > 0) setShowSuggestions(true);
                }}
                onBlur={() => {
                  // Delay to allow click on suggestion
                  setTimeout(() => setShowSuggestions(false), 200);
                }}
                placeholder={
                  language === "bn"
                    ? "যেমন: ডা. রহমান - কার্ডিওলজি"
                    : "e.g., Dr. Rahman - Cardiology"
                }
                className="h-11 text-base"
                required
                autoFocus
              />
              {showSuggestions && doctorSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-auto">
                  {doctorSuggestions.map((name, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="w-full text-left px-4 py-2 hover:bg-accent hover:text-accent-foreground text-sm"
                      onClick={() => {
                        setDoctorName(name);
                        setShowSuggestions(false);
                      }}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Session Type - Simple Toggle */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              {language === "bn" ? "সেশন" : "Session"}
            </Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSessionType("morning")}
                className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-md border-2 transition-all ${
                  sessionType === "morning"
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-input bg-background text-muted-foreground hover:bg-accent"
                }`}
              >
                <Sun className="h-4 w-4" />
                <span>{language === "bn" ? "সকাল" : "Morning"}</span>
              </button>
              <button
                type="button"
                onClick={() => setSessionType("evening")}
                className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-md border-2 transition-all ${
                  sessionType === "evening"
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-input bg-background text-muted-foreground hover:bg-accent"
                }`}
              >
                <Moon className="h-4 w-4" />
                <span>{language === "bn" ? "বিকাল" : "Evening"}</span>
              </button>
            </div>
          </div>

          {/* Code Prefix (Optional) */}
          <div className="space-y-2">
            <Label
              htmlFor="dialog-codePrefix"
              className="text-sm font-semibold flex items-center gap-2"
            >
              <Lock className="h-4 w-4 text-muted-foreground" />
              {language === "bn" ? "Code Prefix" : "Code Prefix"}
              <span className="text-xs font-normal text-muted-foreground">
                ({language === "bn" ? "ঐচ্ছিক" : "Optional"})
              </span>
            </Label>
            <Input
              id="dialog-codePrefix"
              type="text"
              value={codePrefix}
              onChange={(e) => setCodePrefix(e.target.value)}
              placeholder={
                language === "bn" ? "যেমন: ibneSina" : "e.g., ibneSina"
              }
              className="h-11 text-base"
            />
            <div className="p-3 bg-muted/50 rounded-lg border border-muted">
              <p className="text-xs text-muted-foreground mb-1">
                {language === "bn"
                  ? "Auto-generated Secret Code:"
                  : "Auto-generated Secret Code:"}
              </p>
              <p className="font-mono text-sm font-semibold text-primary">
                {generatedCodePreview ||
                  (language === "bn"
                    ? "ডাক্তারের নাম দিন"
                    : "Enter doctor name")}
              </p>
            </div>
            <p className="text-xs text-muted-foreground pl-6">
              {language === "bn"
                ? "Secret code automatically generate হবে, unique এবং secure"
                : "Secret code will be auto-generated, unique and secure"}
            </p>
          </div>

          {/* Average Time */}
          <div className="space-y-2">
            <Label
              htmlFor="dialog-avgTime"
              className="text-sm font-semibold flex items-center gap-2"
            >
              <Clock className="h-4 w-4 text-muted-foreground" />
              {language === "bn"
                ? "গড় সময় (মিনিট)"
                : "Average Time (minutes)"}
              <span className="text-xs font-normal text-muted-foreground">
                ({language === "bn" ? "ঐচ্ছিক" : "Optional"})
              </span>
            </Label>
            <Input
              id="dialog-avgTime"
              type="number"
              value={avgTime}
              onChange={(e) => setAvgTime(e.target.value)}
              placeholder={
                language === "bn" ? "Default: 5 মিনিট" : "Default: 5 minutes"
              }
              min="0"
              max="60"
              className="h-11 text-base"
            />
            <p className="text-xs text-muted-foreground pl-6">
              {language === "bn"
                ? "মিনিট/রোগী (খালি থাকলে 5 min default, পরে automatic calculate হবে)"
                : "Minutes per patient (default: 5 min, will auto-calculate later)"}
            </p>
          </div>

          {/* Serial Limit */}
          <div className="space-y-2">
            <Label
              htmlFor="dialog-serialLimit"
              className="text-sm font-semibold flex items-center gap-2"
            >
              <Clock className="h-4 w-4 text-muted-foreground" />
              {language === "bn" ? "Serial Limit" : "Serial Limit"}
              <span className="text-xs font-normal text-muted-foreground">
                ({language === "bn" ? "ঐচ্ছিক" : "Optional"})
              </span>
            </Label>
            <Input
              id="dialog-serialLimit"
              type="number"
              value={serialLimit}
              onChange={(e) => setSerialLimit(e.target.value)}
              placeholder={
                language === "bn"
                  ? "খালি রাখলে Unlimited"
                  : "Leave empty for unlimited"
              }
              min="1"
              className="h-11 text-base"
            />
            <p className="text-xs text-muted-foreground pl-6">
              {language === "bn"
                ? "মোট কতজন রোগী Serial নিতে পারবে (খালি থাকলে Unlimited)"
                : "Maximum number of patients who can get serial (leave empty for unlimited)"}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 h-11"
            >
              {language === "bn" ? "বাতিল" : "Cancel"}
            </Button>
            <Button type="submit" className="flex-1 h-11">
              {language === "bn" ? "Queue তৈরি করুন" : "Create Queue"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
