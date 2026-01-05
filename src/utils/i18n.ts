// Internationalization (i18n) Utility
// Supports Bengali and English

export type Language = "bn" | "en";

interface Translations {
  [key: string]: {
    bn: string;
    en: string;
  };
}

const translations: Translations = {
  // Admin Panel
  "admin.title": {
    bn: "Queue Management - Admin Panel",
    en: "Queue Management - Admin Panel",
  },
  "admin.doctorName": {
    bn: "ডাক্তারের নাম",
    en: "Doctor Name",
  },
  "admin.secretCode": {
    bn: "Secret Code",
    en: "Secret Code",
  },
  "admin.avgTime": {
    bn: "গড় সময় (মিনিট) - ঐচ্ছিক",
    en: "Average Time (minutes) - Optional",
  },
  "admin.generate": {
    bn: "QR Code Generate করুন",
    en: "Generate QR Code",
  },
  "admin.existingQueues": {
    bn: "বিদ্যমান Queues",
    en: "Existing Queues",
  },
  "admin.delete": {
    bn: "Delete",
    en: "Delete",
  },
  "admin.qrCode": {
    bn: "QR Code",
    en: "QR Code",
  },
  "admin.scanOrShare": {
    bn: "এই QR code scan করুন অথবা link share করুন",
    en: "Scan this QR code or share the link",
  },
  "admin.copyLink": {
    bn: "Link Copy করুন",
    en: "Copy Link",
  },
  "admin.newQueue": {
    bn: "নতুন Queue তৈরি করুন",
    en: "Create New Queue",
  },
  "admin.reuseQueue": {
    bn: "বিদ্যমান Queue ব্যবহার করুন",
    en: "Use Existing Queue",
  },
  "admin.doctorExists": {
    bn: "এই ডাক্তারের জন্য ইতিমধ্যে Queue আছে",
    en: "Queue already exists for this doctor",
  },
  "admin.secretCodeExists": {
    bn: "এই Secret Code ইতিমধ্যে ব্যবহৃত হয়েছে",
    en: "This Secret Code is already in use",
  },
  "admin.fillAll": {
    bn: "দয়া করে সব তথ্য fill করুন!",
    en: "Please fill all information!",
  },
  "admin.deleteConfirm": {
    bn: "এই queue delete করতে চান?",
    en: "Do you want to delete this queue?",
  },

  // Queue Page
  "queue.selectMode": {
    bn: "আপনি কি করতে চান?",
    en: "What would you like to do?",
  },
  "queue.doctorLogin": {
    bn: "ডাক্তার হিসেবে Login করুন",
    en: "Login as Doctor",
  },
  "queue.patientView": {
    bn: "রোগী হিসেবে Queue দেখুন",
    en: "View Queue as Patient",
  },
  "queue.secretCode": {
    bn: "Secret Code",
    en: "Secret Code",
  },
  "queue.login": {
    bn: "Login",
    en: "Login",
  },
  "queue.serialNumber": {
    bn: "Serial Number",
    en: "Serial Number",
  },
  "queue.view": {
    bn: "View",
    en: "View",
  },
  "queue.wrongCode": {
    bn: "ভুল secret code! আবার চেষ্টা করুন।",
    en: "Wrong secret code! Please try again.",
  },
  "queue.invalidSerial": {
    bn: "সঠিক serial number দিন (1-999)",
    en: "Enter valid serial number (1-999)",
  },
  "queue.notFound": {
    bn: "Queue খুঁজে পাওয়া যায়নি!",
    en: "Queue not found!",
  },
  "queue.newPatient": {
    bn: "নতুন রোগী? Auto Serial নিন:",
    en: "New Patient? Get Auto Serial:",
  },
  "queue.patientName": {
    bn: "আপনার নাম",
    en: "Your Name",
  },
  "queue.patientAge": {
    bn: "বয়স",
    en: "Age",
  },
  "queue.patientMobile": {
    bn: "মোবাইল নম্বর",
    en: "Mobile Number",
  },
  "queue.optional": {
    bn: "(ঐচ্ছিক)",
    en: "(Optional)",
  },
  "queue.required": {
    bn: "*",
    en: "*",
  },
  "queue.namePlaceholder": {
    bn: "যেমন: রহমান",
    en: "e.g., Rahman",
  },
  "queue.agePlaceholder": {
    bn: "যেমন: 25",
    en: "e.g., 25",
  },
  "queue.mobilePlaceholder": {
    bn: "যেমন: 01712345678",
    en: "e.g., 01712345678",
  },
  "queue.autoSerial": {
    bn: "Auto Serial নিন (Auto Join)",
    en: "Get Auto Serial (Auto Join)",
  },
  "queue.nameRequired": {
    bn: "আপনার নাম লিখুন!",
    en: "Please enter your name!",
  },
  "queue.ageRequired": {
    bn: "সঠিক বয়স দিন (1-150)",
    en: "Enter valid age (1-150)",
  },
  "queue.existingSerial": {
    bn: "আগে থেকে Serial আছে? Status দেখুন:",
    en: "Have existing Serial? View Status:",
  },
  "queue.serialPlaceholder": {
    bn: "Serial Number দিন",
    en: "Enter Serial Number",
  },
  "queue.viewStatus": {
    bn: "Status দেখুন",
    en: "View Status",
  },
  "queue.or": {
    bn: "অথবা",
    en: "OR",
  },
  "queue.patientCustomer": {
    bn: "রোগী/গ্রাহক",
    en: "Patient/Customer",
  },
  "queue.backToAdmin": {
    bn: "Admin Panel এ ফিরে যান",
    en: "Back to Admin Panel",
  },
  "queue.viewQueueStatus": {
    bn: "Queue Status দেখুন",
    en: "View Queue Status",
  },

  // Doctor Panel
  "doctor.controlPanel": {
    bn: "ডাক্তার Control Panel",
    en: "Doctor Control Panel",
  },
  "doctor.currentPatient": {
    bn: "এখন ডাকা হচ্ছে",
    en: "Currently Serving",
  },
  "doctor.nextPatient": {
    bn: "পরবর্তী রোগী",
    en: "Next Patient",
  },
  "doctor.waiting": {
    bn: "অপেক্ষমান",
    en: "Waiting",
  },
  "doctor.totalJoined": {
    bn: "মোট Joined",
    en: "Total Joined",
  },
  "doctor.currentDuration": {
    bn: "বর্তমানে",
    en: "Current",
  },
  "doctor.minutes": {
    bn: "মিনিট",
    en: "minutes",
  },
  "doctor.start": {
    bn: "Queue শুরু করুন",
    en: "Start Queue",
  },
  "doctor.pause": {
    bn: "Queue Pause করুন",
    en: "Pause Queue",
  },
  "doctor.resume": {
    bn: "Queue আবার শুরু করুন",
    en: "Resume Queue",
  },
  "doctor.next": {
    bn: "পরবর্তী রোগী ডাকুন",
    en: "Call Next Patient",
  },
  "doctor.reset": {
    bn: "Queue Reset করুন",
    en: "Reset Queue",
  },
  "doctor.resetConfirm": {
    bn: "Queue reset করতে চান? সব data মুছে যাবে!",
    en: "Do you want to reset queue? All data will be deleted!",
  },
  "doctor.allDone": {
    bn: "সব রোগী শেষ",
    en: "All Patients Done",
  },
  "doctor.stats": {
    bn: "আজকের পরিসংখ্যান",
    en: "Today's Statistics",
  },
  "doctor.completed": {
    bn: "Completed",
    en: "Completed",
  },
  "doctor.avgTime": {
    bn: "Avg Time",
    en: "Avg Time",
  },
  "doctor.initialEstimate": {
    bn: "প্রাথমিক অনুমান",
    en: "Initial Estimate",
  },
  "doctor.fromPatients": {
    bn: "জন থেকে",
    en: "from",
  },
  "doctor.presentPatients": {
    bn: "Present Patients",
    en: "Present Patients",
  },
  "doctor.absentPatients": {
    bn: "Absent Patients",
    en: "Absent Patients",
  },
  "doctor.markAbsent": {
    bn: "Mark Absent",
    en: "Mark Absent",
  },
  "doctor.reAdd": {
    bn: "Re-add to Queue",
    en: "Re-add to Queue",
  },
  "doctor.show": {
    bn: "Show",
    en: "Show",
  },
  "doctor.hide": {
    bn: "Hide",
    en: "Hide",
  },
  "doctor.markAbsentConfirm": {
    bn: "Serial #{} কে Absent হিসেবে চিহ্নিত করবেন?",
    en: "Mark Serial #{} as Absent?",
  },
  "doctor.original": {
    bn: "Original",
    en: "Original",
  },

  // Patient View
  "patient.yourSerial": {
    bn: "আপনার Serial",
    en: "Your Serial",
  },
  "patient.yourName": {
    bn: "আপনার নাম",
    en: "Your Name",
  },
  "patient.currentServing": {
    bn: "এখন ডাকা হচ্ছে",
    en: "Currently Serving",
  },
  "patient.yourTurn": {
    bn: "আপনার পালা",
    en: "Your Turn",
  },
  "patient.waitTime": {
    bn: "আনুমানিক অপেক্ষার সময়",
    en: "Estimated Wait Time",
  },
  "patient.peopleAhead": {
    bn: "আপনার আগে",
    en: "People Ahead",
  },
  "patient.completed": {
    bn: "আপনার পালা শেষ হয়েছে",
    en: "Your turn is completed",
  },
  "patient.back": {
    bn: "Back",
    en: "Back",
  },
};

// Language state management
let currentLanguage: Language =
  (localStorage.getItem("language") as Language) || "bn";

export const setLanguage = (lang: Language): void => {
  currentLanguage = lang;
  localStorage.setItem("language", lang);
  // Trigger language change event
  window.dispatchEvent(new Event("languagechange"));
};

export const getLanguage = (): Language => {
  return currentLanguage;
};

// Translation function
export const t = (
  key: string,
  params?: Record<string, string | number>
): string => {
  const translation = translations[key];
  if (!translation) {
    console.warn(`Translation missing for key: ${key}`);
    return key;
  }

  let text = translation[currentLanguage];

  // Replace parameters in format {param}
  if (params) {
    Object.entries(params).forEach(([paramKey, paramValue]) => {
      text = text.replace(
        new RegExp(`\\{\\{${paramKey}\\}\\}`, "g"),
        String(paramValue)
      );
    });
  }

  return text;
};

// Note: useTranslation hook should be imported from hooks/i18n.ts
// This file only contains the core translation logic
