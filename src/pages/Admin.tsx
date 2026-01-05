import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import QRCode from "react-qr-code";
import type { Queue } from "../types";
import { getAllQueues, deleteQueue } from "../utils/storage";
import { useTranslation } from "../hooks/useTranslation";
import { CreateQueueDialog } from "../components/CreateQueueDialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Trash2,
  ExternalLink,
  Copy,
  CheckCircle2,
  RefreshCw,
  Languages,
  LogOut,
  Sun,
  Moon,
} from "lucide-react";

export default function Admin() {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useTranslation();
  const [generatedQueue, setGeneratedQueue] = useState<Queue | null>(null);
  const [existingQueues, setExistingQueues] = useState<Queue[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  // Check if logged in
  useEffect(() => {
    const isLoggedIn = sessionStorage.getItem("admin_logged_in") === "true";
    if (!isLoggedIn) {
      navigate("/admin/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem("admin_logged_in");
    sessionStorage.removeItem("admin_login_time");
    navigate("/admin/login");
  };

  const loadQueues = () => {
    const data = getAllQueues();
    const queues = Object.values(data.queues);
    // Sort by creation date (newest first)
    queues.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    setExistingQueues(queues);
  };

  // Group queues by date and doctor for day-wise view
  const groupQueuesByDay = () => {
    const grouped: Record<string, Record<string, Queue[]>> = {};

    existingQueues.forEach((queue) => {
      const date =
        queue.currentDate ||
        new Date(queue.createdAt).toISOString().split("T")[0];
      const doctorName = queue.doctorName;

      if (!grouped[date]) {
        grouped[date] = {};
      }
      if (!grouped[date][doctorName]) {
        grouped[date][doctorName] = [];
      }
      grouped[date][doctorName].push(queue);
    });

    return grouped;
  };

  const groupedQueues = groupQueuesByDay();
  const sortedDates = Object.keys(groupedQueues).sort((a, b) =>
    b.localeCompare(a)
  ); // Newest first

  useEffect(() => {
    const timer = setTimeout(() => {
      loadQueues();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleQueueCreated = (queue: Queue) => {
    setGeneratedQueue(queue);
    loadQueues();
  };

  const handleDelete = (queueId: string) => {
    if (
      confirm(
        language === "bn"
          ? "এই queue delete করতে চান?"
          : "Do you want to delete this queue?"
      )
    ) {
      deleteQueue(queueId);
      loadQueues();
      if (generatedQueue?.id === queueId) {
        setGeneratedQueue(null);
      }
    }
  };

  const copyToClipboard = () => {
    const queueUrl = generatedQueue
      ? `${globalThis.location.origin}/queue/${generatedQueue.id}`
      : "";
    navigator.clipboard.writeText(queueUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const queueUrl = generatedQueue
    ? `${globalThis.location.origin}/queue/${generatedQueue.id}`
    : "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="space-y-0.5">
                <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {t("admin.title")}
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  {language === "bn"
                    ? "ডাক্তার/কাউন্টার এর জন্য QR Code তৈরি করুন - Real-time Wait Time Tracking"
                    : "Generate QR Code for Doctor/Counter - Real-time Wait Time Tracking"}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={language === "bn" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setLanguage("bn")}
                  className="gap-2"
                >
                  <Languages className="h-4 w-4" />
                  বাংলা
                </Button>
                <Button
                  variant={language === "en" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setLanguage("en")}
                  className="gap-2"
                >
                  <Languages className="h-4 w-4" />
                  English
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4" />
                  {language === "bn" ? "Logout" : "Logout"}
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Create Queue Button */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-white to-blue-50/50">
          <CardContent className="pt-4 pb-4 sm:pt-6 sm:pb-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/10 shrink-0">
                  <Plus className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold">
                    {language === "bn"
                      ? "নতুন Queue তৈরি করুন"
                      : "Create New Queue"}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    {language === "bn"
                      ? "ডাক্তারের জন্য Queue তৈরি করুন এবং QR Code Generate করুন"
                      : "Create a queue for doctor and generate QR code"}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="w-full sm:w-auto shrink-0"
                size="lg"
              >
                <Plus className="mr-2 h-4 w-4" />
                {language === "bn" ? "Queue তৈরি করুন" : "Create Queue"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Generated QR Code */}
        {generatedQueue && (
          <Card className="border-0 shadow-md animate-in slide-in-from-bottom-4">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <CardTitle className="text-lg sm:text-xl text-green-600">
                    {language === "bn"
                      ? "QR Code তৈরি হয়েছে!"
                      : "QR Code Generated!"}
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-5">
              <div className="flex flex-col md:flex-row gap-4 sm:gap-5">
                <div className="flex-1 space-y-3">
                  <div className="bg-muted/50 p-4 sm:p-5 rounded-lg flex justify-center">
                    <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm">
                      <QRCode
                        value={queueUrl}
                        size={160}
                        className="sm:w-[180px] sm:h-[180px]"
                      />
                    </div>
                  </div>
                  <div className="text-center space-y-1.5">
                    <p className="font-semibold text-base sm:text-lg">
                      {generatedQueue.doctorName}
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <Badge
                        variant="secondary"
                        className="font-mono text-xs sm:text-sm"
                      >
                        {generatedQueue.secretCode}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {language === "bn"
                        ? "ডাক্তার কে দিন, রোগীদের দেখাবেন না!"
                        : "Give to doctor only, don't show to patients!"}
                    </p>
                  </div>
                </div>

                <Separator orientation="vertical" className="hidden md:block" />

                <div className="flex-1 space-y-3">
                  <div className="space-y-2">
                    <Label className="text-sm">
                      {language === "bn" ? "Queue URL" : "Queue URL"}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={queueUrl}
                        readOnly
                        className="font-mono text-xs sm:text-sm"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={copyToClipboard}
                        className="shrink-0"
                      >
                        {copied ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open(queueUrl, "_blank")}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    {language === "bn" ? "Queue খুলুন" : "Open Queue"}
                  </Button>
                  <div className="bg-muted/50 p-3 sm:p-4 rounded-lg space-y-1.5 text-xs sm:text-sm">
                    <p className="font-medium">
                      {language === "bn" ? "পরবর্তী পদক্ষেপ:" : "Next Steps:"}
                    </p>
                    <ol className="list-decimal list-inside space-y-0.5 text-muted-foreground">
                      <li>
                        {language === "bn"
                          ? "QR Code প্রিন্ট করুন"
                          : "Print QR Code"}
                      </li>
                      <li>
                        {language === "bn"
                          ? "ডাক্তারের chamber এ লাগান"
                          : "Place in doctor's chamber"}
                      </li>
                      <li>
                        {language === "bn"
                          ? "ডাক্তার কে Secret Code দিন"
                          : "Give Secret Code to doctor"}
                      </li>
                    </ol>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Existing Queues - Day-wise Grouped */}
        {existingQueues.length > 0 && (
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl sm:text-2xl">
                  {language === "bn" ? "বিদ্যমান Queues" : "Existing Queues"} (
                  {existingQueues.length})
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={loadQueues}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {language === "bn" ? "Refresh" : "Refresh"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="space-y-4 sm:space-y-5">
                {sortedDates.map((date) => (
                  <div key={date} className="space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                      <h3 className="text-base sm:text-lg font-semibold">
                        {new Date(date).toLocaleDateString(
                          language === "bn" ? "bn-BD" : "en-US",
                          {
                            weekday: "short",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        {Object.values(groupedQueues[date]).flat().length}{" "}
                        {language === "bn" ? "Queues" : "Queues"}
                      </Badge>
                    </div>
                    {Object.entries(groupedQueues[date]).map(
                      ([doctorName, queues]) => {
                        const morningSessions = queues.filter(
                          (q) => (q.sessionType || "morning") === "morning"
                        ).length;
                        const eveningSessions = queues.filter(
                          (q) => (q.sessionType || "morning") === "evening"
                        ).length;
                        return (
                          <div key={doctorName} className="space-y-2">
                            <h4 className="text-sm sm:text-base font-medium text-muted-foreground flex items-center gap-2 flex-wrap">
                              <span>{doctorName}</span>
                              {morningSessions > 0 && (
                                <Badge
                                  variant="default"
                                  className="text-xs font-normal flex items-center gap-1"
                                >
                                  <Sun className="h-3 w-3" />
                                  {morningSessions}{" "}
                                  {language === "bn" ? "সকাল" : "Morning"}
                                </Badge>
                              )}
                              {eveningSessions > 0 && (
                                <Badge
                                  variant="secondary"
                                  className="text-xs font-normal flex items-center gap-1"
                                >
                                  <Moon className="h-3 w-3" />
                                  {eveningSessions}{" "}
                                  {language === "bn" ? "বিকাল" : "Evening"}
                                </Badge>
                              )}
                            </h4>
                            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                              {queues.map((queue) => (
                                <Card
                                  key={queue.id}
                                  className="border hover:shadow-md transition-shadow"
                                >
                                  <CardHeader className="pb-2 pt-3 px-3 sm:px-4">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                          <CardTitle className="text-base sm:text-lg truncate">
                                            {queue.doctorName}
                                          </CardTitle>
                                          <div
                                            className={`text-xs shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-md border-2 transition-all ${
                                              (queue.sessionType ||
                                                "morning") === "morning"
                                                ? "border-primary/30 bg-primary/5 text-primary"
                                                : "border-secondary/30 bg-secondary/5 text-secondary-foreground"
                                            }`}
                                          >
                                            {(queue.sessionType ||
                                              "morning") === "morning" ? (
                                              <>
                                                <Sun className="h-3 w-3" />
                                                <span className="font-medium">
                                                  {language === "bn"
                                                    ? "সকাল"
                                                    : "Morning"}
                                                </span>
                                              </>
                                            ) : (
                                              <>
                                                <Moon className="h-3 w-3" />
                                                <span className="font-medium">
                                                  {language === "bn"
                                                    ? "বিকাল"
                                                    : "Evening"}
                                                </span>
                                              </>
                                            )}
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
                                            className="text-xs shrink-0"
                                          >
                                            {queue.status.toUpperCase()}
                                          </Badge>
                                        </div>
                                        <div className="space-y-1">
                                          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground flex-wrap">
                                            <span>
                                              {language === "bn"
                                                ? "বর্তমান"
                                                : "Current"}
                                              :{" "}
                                              <strong className="text-foreground">
                                                {queue.currentNumber}
                                              </strong>
                                            </span>
                                            <span>•</span>
                                            <span>
                                              {language === "bn"
                                                ? "মোট"
                                                : "Total"}
                                              :{" "}
                                              <strong className="text-foreground">
                                                {queue.totalPatientsJoined}
                                              </strong>
                                            </span>
                                            {queue.serialLimit && (
                                              <>
                                                <span>•</span>
                                                <span>
                                                  {language === "bn"
                                                    ? "লিমিট"
                                                    : "Limit"}
                                                  :{" "}
                                                  <strong className="text-foreground">
                                                    {queue.serialLimit}
                                                  </strong>
                                                </span>
                                              </>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span>
                                              {language === "bn"
                                                ? "গড়"
                                                : "Avg"}
                                              :{" "}
                                              <strong className="text-foreground">
                                                {queue.avgTimePerPatient.toFixed(
                                                  1
                                                )}
                                              </strong>{" "}
                                              min
                                            </span>
                                          </div>
                                          <div className="pt-1">
                                            <p className="text-xs font-mono text-muted-foreground break-all">
                                              <span className="text-muted-foreground/70">
                                                {language === "bn"
                                                  ? "কোড"
                                                  : "Code"}
                                                :{" "}
                                              </span>
                                              <span className="text-primary font-semibold">
                                                {queue.secretCode}
                                              </span>
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </CardHeader>
                                  <CardContent className="pt-0 pb-3 px-3 sm:px-4">
                                    <div className="flex items-center justify-end gap-1">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() =>
                                          window.open(
                                            `/queue/${queue.id}`,
                                            "_blank"
                                          )
                                        }
                                      >
                                        <ExternalLink className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => handleDelete(queue.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Queue Dialog */}
      <CreateQueueDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onQueueCreated={handleQueueCreated}
        language={language}
      />
    </div>
  );
}
