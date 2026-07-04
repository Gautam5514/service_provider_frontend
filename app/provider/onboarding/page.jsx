"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser } from "@/lib/auth";
import api from "@/lib/api";
import { refreshLocation } from "@/lib/location";
import LocationPicker from "@/components/LocationPicker";
import { Loader2, MapPin, Navigation, ChevronDown } from "lucide-react";

const STEPS = [
  { id: 1, label: "Basic Profile" },
  { id: 2, label: "Services & Skills" },
  { id: 3, label: "KYC Documents" },
  { id: 4, label: "Work Proofs" },
  { id: 5, label: "Bank Details" },
  { id: 6, label: "Availability" },
  { id: 7, label: "Agreement" },
];

const SERVICE_CATEGORIES = ["ac", "cooler", "fan", "tv", "electrical", "appliance"];
const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_LABELS = { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun" };

const inputCls =
  "w-full bg-white border border-zinc-300 rounded-lg px-3.5 py-2.5 text-sm font-semibold text-black focus:outline-none focus:border-black focus:ring-4 focus:ring-black/[0.06] transition-all placeholder:text-zinc-400 disabled:opacity-50";

function FileUpload({ value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("File exceeds 2MB limit.");
      return;
    }

    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const { data } = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (data.success) {
        onChange(data.fileUrl);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mt-1">
      {value ? (
        <div className="flex items-center justify-between border border-zinc-200 rounded-lg px-3 py-2.5 bg-zinc-50">
          <div className="flex items-center">
            <svg className="w-4 h-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            <span className="text-[10px] font-bold uppercase tracking-widest text-green-700">Uploaded</span>
          </div>
          <div className="flex items-center gap-4">
            <a href={value} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold uppercase tracking-widest text-black hover:underline">View</a>
            <button type="button" onClick={() => onChange("")} className="text-[10px] font-bold uppercase tracking-widest text-red-600 hover:underline">Remove</button>
          </div>
        </div>
      ) : (
        <div className="relative border border-dashed border-zinc-300 rounded-lg p-4 hover:border-black transition-colors cursor-pointer text-center bg-zinc-50/50">
          <input type="file" onChange={handleUpload} accept="image/*,.pdf" disabled={uploading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" />
          {uploading ? (
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 animate-pulse">Uploading...</span>
          ) : (
            <span className="text-[10px] font-bold uppercase tracking-widest text-black">+ Select File (Max 2MB)</span>
          )}
        </div>
      )}
      {error && <p className="text-[9px] font-bold uppercase tracking-widest text-red-600 mt-1.5">{error}</p>}
    </div>
  );
}

function StepHeader({ title, subtitle }) {
  return (
    <div className="border-b border-zinc-100 pb-6 mb-8">
      <h2 className="text-2xl font-extrabold tracking-tight">{title}</h2>
      <p className="text-xs text-zinc-500 mt-1.5 tracking-wide">{subtitle}</p>
    </div>
  );
}

function Field({ label, hint, noBadge, children }) {
  // "*" at the end of a label marks the field mandatory; everything else is optional.
  const required = /\*\s*$/.test(label);
  const clean = label.replace(/\s*\*+\s*$/, "");
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-zinc-500">
        <span>{clean}</span>
        {required ? (
          <span className="text-[8px] font-black tracking-wide normal-case text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-md">Required</span>
        ) : !noBadge ? (
          <span className="text-[8px] font-black tracking-wide normal-case text-zinc-400 bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded-md">Optional</span>
        ) : null}
      </label>
      {children}
      {hint && <p className="text-[9px] text-zinc-400 mt-1">{hint}</p>}
    </div>
  );
}

// Standard dropdown — native select styled to match inputs, with a clear chevron
// so users instantly recognise it as a picker.
function Select({ value, onChange, children }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        className={`${inputCls} appearance-none pr-9 cursor-pointer`}
      >
        {children}
      </select>
      <ChevronDown size={15} strokeWidth={2.5} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" />
    </div>
  );
}

const emptyService = () => ({
  category: "ac",
  serviceName: "",
  experienceYears: 1,
  skillLevel: "intermediate",
  hasOwnTools: false,
  canProvideInstallationAndRepair: false,
  previousCompany: "",
  canHandleEmergency: false,
});

export default function ProviderOnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [statusLoading, setStatusLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [pickingLocation, setPickingLocation] = useState(false);
  const [error, setError] = useState("");

  // Step 1
  const [profile, setProfile] = useState({
    dateOfBirth: "",
    city: "",
    serviceArea: "",
    workingRadiusKm: 10,
    gender: "",
    emergencyContact: "",
    alternatePhone: "",
    languages: "",
    about: "",
    location: null,
  });

  // Step 2
  const [services, setServices] = useState([emptyService()]);

  // Step 3
  const [documents, setDocuments] = useState({
    aadhaar: { fileUrl: "", docNumberMasked: "" },
    pan: { fileUrl: "", docNumberMasked: "" },
    selfie: { fileUrl: "" },
    address_proof: { fileUrl: "" },
  });

  // Step 4
  const [workProofs, setWorkProofs] = useState([]);

  // Step 5
  const [bankDetails, setBankDetails] = useState({
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    upiId: "",
    cancelledChequeUrl: "",
  });

  // Step 6
  const [availability, setAvailability] = useState({
    workingType: "full_time",
    availableDays: [],
    workingHoursFrom: "09:00",
    workingHoursTo: "18:00",
    travelRadiusKm: 10,
    acceptsUrgentJobs: false,
    hasOwnVehicle: false,
    vehicleType: "",
    preferredLocations: "",
  });

  // Step 7
  const [agreement, setAgreement] = useState({
    termsAccepted: false,
    codeOfConductAccepted: false,
    customerSafetyAccepted: false,
    noDirectPaymentRuleAccepted: false,
    commissionPolicyAccepted: false,
    dataPrivacyConsent: false,
    bgvConsent: false,
  });

  // On mount: guard + resume from server step
  useEffect(() => {
    const user = getStoredUser();
    if (!user || user.role !== "provider") {
      router.replace("/login");
      return;
    }

    const fetchStatus = async () => {
      try {
        const { data } = await api.get("/providers/onboarding/status");
        if (data.success) {
          // All 7 steps completed (agreement signed) → go to dashboard, don't show onboarding again
          const allDone = data.onboardingStarted && data.steps?.[7]?.complete === true;
          if (allDone) {
            router.replace("/dashboard/provider");
            return;
          }
          if (data.onboardingStarted && data.currentStep > 1) {
            setCurrentStep(Math.min(data.currentStep, 7));
          }
        }
      } catch {
        // no profile yet — start from step 1
      } finally {
        setStatusLoading(false);
      }
    };
    fetchStatus();
  }, [router]);

  // ─── Client-side validation per step (prevents bad API calls) ─────────────
  function validateStep(step) {
    const errs = [];

    if (step === 1) {
      if (!profile.dateOfBirth)
        errs.push("Date of birth is required.");
      else {
        const ageMs  = Date.now() - new Date(profile.dateOfBirth).getTime();
        const ageYrs = ageMs / (365.25 * 24 * 3600 * 1000);
        if (ageYrs < 18) errs.push("You must be at least 18 years old to register as a provider.");
        if (ageYrs > 80) errs.push("Please enter a valid date of birth.");
      }
      if (!profile.city.trim() || profile.city.trim().length < 2)
        errs.push("City is required (minimum 2 characters).");
      if (!profile.serviceArea.trim() || profile.serviceArea.trim().length < 2)
        errs.push("Service area is required — e.g. 'South Delhi' or 'Bandra West'.");
      const radius = Number(profile.workingRadiusKm);
      if (!radius || radius < 1 || radius > 100)
        errs.push("Working radius must be between 1 and 100 km.");
      if (profile.emergencyContact) {
        const ec = profile.emergencyContact.replace(/\D/g, "");
        if (ec.length !== 10) errs.push("Emergency contact must be a valid 10-digit mobile number.");
      }
      if (profile.alternatePhone) {
        const ap = profile.alternatePhone.replace(/\D/g, "");
        if (ap.length !== 10) errs.push("Alternate phone must be a valid 10-digit mobile number.");
      }
    }

    if (step === 2) {
      if (services.length === 0)
        errs.push("Add at least one service you offer.");
      services.forEach((s, i) => {
        const num = i + 1;
        if (!s.serviceName.trim() || s.serviceName.trim().length < 2)
          errs.push(`Service ${num}: Service name is required (min 2 characters).`);
        const exp = Number(s.experienceYears);
        if (isNaN(exp) || exp < 0 || exp > 60)
          errs.push(`Service ${num}: Experience years must be between 0 and 60.`);
      });
    }

    if (step === 3) {
      if (!documents.aadhaar?.fileUrl)   errs.push("Aadhaar card upload is required.");
      if (!documents.pan?.fileUrl)       errs.push("PAN card upload is required.");
      if (!documents.selfie?.fileUrl)    errs.push("Live selfie photo is required.");
      const aadhaarNum = (documents.aadhaar?.docNumberMasked || "").replace(/\s/g, "");
      if (aadhaarNum && !/^\d{12}$/.test(aadhaarNum))
        errs.push("Aadhaar number must be exactly 12 digits (no spaces).");
      const panNum = (documents.pan?.docNumberMasked || "").toUpperCase().replace(/\s/g, "");
      if (panNum && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(panNum))
        errs.push("PAN format is invalid — expected format: ABCDE1234F.");
    }

    if (step === 5) {
      if (!bankDetails.accountHolderName.trim())
        errs.push("Account holder name is required (must match bank records).");
      if (!bankDetails.accountNumber) {
        errs.push("Account number is required.");
      } else {
        const acNum = bankDetails.accountNumber.replace(/\s/g, "");
        if (!/^\d+$/.test(acNum))   errs.push("Account number must contain digits only.");
        if (acNum.length < 9)       errs.push("Account number is too short (minimum 9 digits).");
        if (acNum.length > 18)      errs.push("Account number is too long (maximum 18 digits).");
      }
      if (!bankDetails.ifscCode) {
        errs.push("IFSC code is required.");
      } else {
        const ifsc = bankDetails.ifscCode.toUpperCase().replace(/\s/g, "");
        if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc))
          errs.push("IFSC code format is invalid — expected 11 characters like SBIN0001234.");
      }
      if (bankDetails.upiId && !/^[\w.\-+]+@[\w]+$/.test(bankDetails.upiId))
        errs.push("UPI ID format is invalid — expected format: yourname@upi or 9876543210@paytm.");
    }

    if (step === 6) {
      if (availability.availableDays.length === 0)
        errs.push("Select at least one working day.");
      if (!availability.workingHoursFrom || !availability.workingHoursTo)
        errs.push("Working hours (from and to) are required.");
      else if (availability.workingHoursFrom >= availability.workingHoursTo)
        errs.push("Working hours end time must be after start time.");
      const tr = Number(availability.travelRadiusKm);
      if (!tr || tr < 1 || tr > 100)
        errs.push("Travel radius must be between 1 and 100 km.");
    }

    return errs;
  }

  const handleNext = async () => {
    setError("");

    // Client-side validation before touching the API
    const clientErrors = validateStep(currentStep);
    if (clientErrors.length > 0) {
      setError(clientErrors.join("\n")); // shown as pre-wrapped text below
      window.scrollTo(0, 0);
      return;
    }

    setLoading(true);
    try {
      let endpoint;
      let payload;

      if (currentStep === 1) {
        endpoint = "/providers/onboarding/step/1";
        payload = {
          ...profile,
          workingRadiusKm: Number(profile.workingRadiusKm),
          languages: profile.languages
            ? profile.languages.split(",").map((l) => l.trim()).filter(Boolean)
            : [],
        };
      } else if (currentStep === 2) {
        endpoint = "/providers/onboarding/step/2";
        payload = {
          services: services.map((s) => ({
            ...s,
            experienceYears: Number(s.experienceYears),
          })),
        };
      } else if (currentStep === 3) {
        endpoint = "/providers/onboarding/step/3";
        const docs = Object.entries(documents)
          .filter(([, v]) => v.fileUrl)
          .map(([docType, v]) => ({ docType, ...v }));
        payload = { documents: docs };
      } else if (currentStep === 4) {
        endpoint = "/providers/onboarding/step/4";
        payload = { proofs: workProofs };
      } else if (currentStep === 5) {
        endpoint = "/providers/onboarding/step/5";
        payload = bankDetails;
      } else if (currentStep === 6) {
        endpoint = "/providers/onboarding/step/6";
        payload = {
          ...availability,
          travelRadiusKm: Number(availability.travelRadiusKm),
          preferredLocations: availability.preferredLocations
            ? availability.preferredLocations.split(",").map((l) => l.trim()).filter(Boolean)
            : [],
        };
      } else if (currentStep === 7) {
        endpoint = "/providers/onboarding/step/7";
        payload = agreement;
      }

      const { data } = await api.post(endpoint, payload);
      if (data.success) {
        if (currentStep === 7) {
          router.push("/dashboard/provider?onboarding=complete");
        } else {
          setCurrentStep((s) => s + 1);
          window.scrollTo(0, 0);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please check your details and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip4 = async () => {
    setLoading(true);
    try {
      await api.post("/providers/onboarding/step/4", { proofs: [] });
    } catch {
      // skip anyway
    } finally {
      setLoading(false);
      setCurrentStep(5);
      window.scrollTo(0, 0);
    }
  };

  const allAgreed = Object.values(agreement).every(Boolean);

  // ─── How much of the CURRENT section is filled (drives the progress bar) ────
  function stepFillPercent(step) {
    const pct = (done, total) => (total ? Math.round((done / total) * 100) : 100);
    if (step === 1) {
      const c = [profile.dateOfBirth, profile.city.trim(), profile.serviceArea.trim(), profile.workingRadiusKm];
      return pct(c.filter(Boolean).length, c.length);
    }
    if (step === 2) {
      let done = 0, total = 0;
      services.forEach((s) => { total += 2; if (s.serviceName.trim()) done++; if (String(s.experienceYears) !== "") done++; });
      return pct(done, total);
    }
    if (step === 3) {
      const c = [documents.aadhaar?.fileUrl, documents.pan?.fileUrl, documents.selfie?.fileUrl];
      return pct(c.filter(Boolean).length, c.length);
    }
    if (step === 4) return 100; // optional section — always ready to proceed
    if (step === 5) {
      const c = [bankDetails.accountHolderName.trim(), bankDetails.accountNumber, bankDetails.ifscCode];
      return pct(c.filter(Boolean).length, c.length);
    }
    if (step === 6) {
      const c = [availability.availableDays.length > 0, availability.workingHoursFrom, availability.workingHoursTo, availability.travelRadiusKm];
      return pct(c.filter(Boolean).length, c.length);
    }
    if (step === 7) {
      const v = Object.values(agreement);
      return pct(v.filter(Boolean).length, v.length);
    }
    return 0;
  }
  const sectionFill = stepFillPercent(currentStep);

  const useCurrentLocation = async () => {
    setLocating(true);
    setError("");
    try {
      const loc = await refreshLocation();
      setProfile((p) => ({
        ...p,
        city: p.city || loc.city || "",
        serviceArea: p.serviceArea || [loc.city, loc.state].filter(Boolean).join(", "),
        location: loc.lat && loc.lng
          ? { lat: loc.lat, lng: loc.lng, source: loc.source || "gps" }
          : null,
      }));
    } catch {
      setError("Could not detect your location. Add city and service area manually.");
    } finally {
      setLocating(false);
    }
  };

  const onPickLocation = ({ lat, lng, fullAddress, city, pincode }) => {
    setProfile((p) => ({
      ...p,
      city: city || p.city,
      serviceArea: fullAddress || p.serviceArea || city,
      location: lat && lng ? { lat, lng, source: "manual", pincode } : p.location,
    }));
    setPickingLocation(false);
  };

  if (statusLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <p className="text-sm font-bold tracking-widest uppercase text-zinc-400 animate-pulse">
          Loading your profile...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans selection:bg-black selection:text-white">
      {/* Sticky header with step progress */}
      <div className="sticky top-0 z-20 bg-white border-b border-zinc-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-zinc-400">
                Provider Onboarding
              </p>
              <h1 className="text-base font-extrabold tracking-tight">
                Step {currentStep} — {STEPS[currentStep - 1].label}
              </h1>
            </div>
            <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-500">
              {currentStep} / 7
            </span>
          </div>
          {/* Step indicator dots */}
          <div className="flex gap-1">
            {STEPS.map((s) => (
              <div
                key={s.id}
                title={s.label}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  s.id < currentStep
                    ? "bg-black"
                    : s.id === currentStep
                    ? "bg-black"
                    : "bg-zinc-200"
                }`}
              />
            ))}
          </div>
          {/* Step labels on md+ */}
          <div className="hidden md:flex gap-1 mt-1.5">
            {STEPS.map((s) => (
              <div key={s.id} className="flex-1 text-center">
                <span
                  className={`text-[8px] font-bold tracking-wide uppercase ${
                    s.id === currentStep ? "text-black" : "text-zinc-300"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          {/* Current-section fill meter */}
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out ${sectionFill === 100 ? "bg-emerald-500" : "bg-zinc-900"}`}
                style={{ width: `${sectionFill}%` }}
              />
            </div>
            <span className="text-[10px] font-bold tracking-wide uppercase text-zinc-500 tabular-nums shrink-0">
              {sectionFill === 100 ? "Section ready" : `${sectionFill}% filled`}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {error && (
          <div className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs font-semibold leading-relaxed">
            {error.includes("\n") ? (
              <ul className="space-y-1.5">
                {error.split("\n").filter(Boolean).map((e, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="shrink-0 mt-px text-red-400">✕</span>
                    {e}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex items-start gap-2">
                <span className="shrink-0 mt-px text-red-400">✕</span>
                {error}
              </div>
            )}
          </div>
        )}

        <div className="bg-white border border-zinc-200 rounded-2xl p-8 md:p-10 shadow-sm">

          {/* Animated step container — re-keys on step change to replay the slide */}
          <div key={currentStep} className="onb-step">

          {/* ── STEP 1: Basic Profile ───────────────────────────────────── */}
          {currentStep === 1 && (
            <div>
              <StepHeader title="Basic Profile" subtitle="Tell us who you are. Fields tagged Required must be filled — the rest are optional." />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Date of Birth *">
                  <input type="date" value={profile.dateOfBirth}
                    onChange={(e) => setProfile((p) => ({ ...p, dateOfBirth: e.target.value }))}
                    className={inputCls} />
                </Field>
                <Field label="City *">
                  <input type="text" placeholder="e.g. New Delhi" value={profile.city}
                    onChange={(e) => setProfile((p) => ({ ...p, city: e.target.value }))}
                    className={inputCls} />
                </Field>
                <Field label="Service Area *" hint="Locality or zone you primarily work in">
                  <input type="text" placeholder="e.g. South Delhi" value={profile.serviceArea}
                    onChange={(e) => setProfile((p) => ({ ...p, serviceArea: e.target.value }))}
                    className={inputCls} />
                </Field>
                <Field label="Working Radius (km) *">
                  <input type="number" min="1" max="100" value={profile.workingRadiusKm}
                    onChange={(e) => setProfile((p) => ({ ...p, workingRadiusKm: e.target.value }))}
                    className={inputCls} />
                </Field>
                <div className="md:col-span-2 border border-zinc-200 rounded-xl bg-zinc-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-white border border-zinc-200 rounded-lg flex items-center justify-center shrink-0">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-black">Precise job matching location</p>
                      <p className="text-xs text-zinc-500 mt-1">
                        Use GPS once so nearby customer jobs appear even when city or locality text is slightly different.
                      </p>
                      {profile.location && (
                        <p className="text-[10px] font-bold tracking-widest uppercase text-emerald-600 mt-2">
                          Location saved from {profile.location.source}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setPickingLocation(true)}
                      className="inline-flex items-center justify-center gap-2 bg-white text-black border border-zinc-300 rounded-lg px-4 py-2.5 text-[10px] font-bold tracking-widest uppercase hover:border-black"
                    >
                      <MapPin size={13} />
                      Pick on Map
                    </button>
                    <button
                      type="button"
                      onClick={useCurrentLocation}
                      disabled={locating}
                      className="inline-flex items-center justify-center gap-2 bg-black text-white rounded-lg px-4 py-2.5 text-[10px] font-bold tracking-widest uppercase hover:bg-zinc-800 disabled:opacity-50"
                    >
                      {locating ? <Loader2 size={13} className="animate-spin" /> : <Navigation size={13} />}
                      {locating ? "Detecting" : "Use Current Location"}
                    </button>
                  </div>
                </div>
                <Field label="Gender">
                  <Select value={profile.gender}
                    onChange={(e) => setProfile((p) => ({ ...p, gender: e.target.value }))}>
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </Select>
                </Field>
                <Field label="Emergency Contact" hint="Recommended — must be a 10-digit mobile number">
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="10-digit mobile number"
                    value={profile.emergencyContact}
                    maxLength={10}
                    onChange={(e) => setProfile((p) => ({ ...p, emergencyContact: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                    className={`${inputCls} tracking-widest ${profile.emergencyContact && profile.emergencyContact.length === 10 ? "border-emerald-400" : profile.emergencyContact.length > 0 ? "border-amber-400" : ""}`}
                  />
                  {profile.emergencyContact.length > 0 && profile.emergencyContact.length < 10 && (
                    <p className="text-[10px] text-amber-600 font-semibold mt-1">{10 - profile.emergencyContact.length} more digit{10 - profile.emergencyContact.length !== 1 ? "s" : ""} needed</p>
                  )}
                </Field>
                <Field label="Alternate Phone" hint="Optional — 10-digit mobile number">
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="10-digit mobile number"
                    value={profile.alternatePhone}
                    maxLength={10}
                    onChange={(e) => setProfile((p) => ({ ...p, alternatePhone: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                    className={`${inputCls} tracking-widest ${profile.alternatePhone && profile.alternatePhone.length === 10 ? "border-emerald-400" : profile.alternatePhone.length > 0 ? "border-amber-400" : ""}`}
                  />
                  {profile.alternatePhone.length > 0 && profile.alternatePhone.length < 10 && (
                    <p className="text-[10px] text-amber-600 font-semibold mt-1">{10 - profile.alternatePhone.length} more digit{10 - profile.alternatePhone.length !== 1 ? "s" : ""} needed</p>
                  )}
                </Field>
                <Field label="Languages Spoken" hint="Comma separated: Hindi, English">
                  <input type="text" placeholder="Hindi, English" value={profile.languages}
                    onChange={(e) => setProfile((p) => ({ ...p, languages: e.target.value }))}
                    className={inputCls} />
                </Field>
                <div className="md:col-span-2">
                  <Field label="About You" hint="Describe your experience in 2–3 lines (optional)">
                    <textarea rows={3} placeholder="I have 5+ years of AC repair experience..."
                      value={profile.about}
                      onChange={(e) => setProfile((p) => ({ ...p, about: e.target.value }))}
                      className="w-full bg-white border border-zinc-300 rounded-lg p-3 text-sm text-black focus:outline-none focus:border-black focus:ring-4 focus:ring-black/[0.06] transition-all placeholder:text-zinc-400 resize-none" />
                  </Field>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: Services & Skills ───────────────────────────────── */}
          {currentStep === 2 && (
            <div>
              <StepHeader title="Services & Skills" subtitle="Add every service you offer. At least one service is required." />
              <div className="space-y-5">
                {services.map((svc, i) => (
                  <div key={i} className="border border-zinc-200 rounded-xl p-6">
                    <div className="flex justify-between items-center mb-5">
                      <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-500">
                        Service {i + 1}
                      </p>
                      {services.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setServices((s) => s.filter((_, idx) => idx !== i))}
                          className="text-[9px] font-bold tracking-widest uppercase text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <Field label="Category *">
                        <Select value={svc.category}
                          onChange={(e) => setServices((s) => s.map((x, idx) => idx === i ? { ...x, category: e.target.value } : x))}>
                          {SERVICE_CATEGORIES.map((c) => (
                            <option key={c} value={c}>{c.toUpperCase()}</option>
                          ))}
                        </Select>
                      </Field>
                      <Field label="Service Name *">
                        <input type="text" placeholder="e.g. AC Repair, Fan Installation"
                          value={svc.serviceName}
                          onChange={(e) => setServices((s) => s.map((x, idx) => idx === i ? { ...x, serviceName: e.target.value } : x))}
                          className={inputCls} />
                      </Field>
                      <Field label="Experience (Years) *">
                        <input type="number" min="0" max="50" value={svc.experienceYears}
                          onChange={(e) => setServices((s) => s.map((x, idx) => idx === i ? { ...x, experienceYears: e.target.value } : x))}
                          className={inputCls} />
                      </Field>
                      <Field label="Skill Level *">
                        <Select value={svc.skillLevel}
                          onChange={(e) => setServices((s) => s.map((x, idx) => idx === i ? { ...x, skillLevel: e.target.value } : x))}>
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="expert">Expert</option>
                        </Select>
                      </Field>
                      <Field label="Previous Company / Employer" hint="Optional">
                        <input type="text" placeholder="e.g. ABC Service Centre"
                          value={svc.previousCompany}
                          onChange={(e) => setServices((s) => s.map((x, idx) => idx === i ? { ...x, previousCompany: e.target.value } : x))}
                          className={inputCls} />
                      </Field>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-x-8 gap-y-3">
                      {[
                        { field: "hasOwnTools", label: "Has own tools *" },
                        { field: "canProvideInstallationAndRepair", label: "Can do installation + repair *" },
                        { field: "canHandleEmergency", label: "Available for emergency calls" },
                      ].map(({ field, label }) => (
                        <label key={field} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={svc[field]}
                            onChange={(e) => setServices((s) => s.map((x, idx) => idx === i ? { ...x, [field]: e.target.checked } : x))}
                            className="w-4 h-4 accent-black border-zinc-400" />
                          <span className="text-xs font-medium text-zinc-700">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                <button type="button"
                  onClick={() => setServices((s) => [...s, emptyService()])}
                  className="w-full border border-dashed border-zinc-300 rounded-xl py-4 text-[10px] font-bold tracking-widest uppercase text-zinc-500 hover:border-black hover:text-black transition-colors">
                  + Add Another Service
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: KYC Documents ───────────────────────────────────── */}
          {currentStep === 3 && (
            <div>
              <StepHeader title="KYC Documents" subtitle="Aadhaar, PAN and Live Selfie are required. Address proof is optional." />
              <div className="mb-6 p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-600 leading-relaxed">
                Documents are stored securely and reviewed only by our verification team. We never share them with customers.
              </div>
              <div className="space-y-5">
                {[
                  { key: "aadhaar", label: "Aadhaar Card *", required: true, hasMask: true, maskPlaceholder: "XXXX XXXX 1234" },
                  { key: "pan", label: "PAN Card *", required: true, hasMask: true, maskPlaceholder: "ABCDE1234F" },
                  { key: "selfie", label: "Live Selfie *", required: true, hasMask: false },
                  { key: "address_proof", label: "Address Proof", required: false, hasMask: false, note: "Recommended — required for home-entry job tier" },
                ].map(({ key, label, hasMask, maskPlaceholder, note }) => (
                  <div key={key} className="border border-zinc-200 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-500">{label}</p>
                      {note && <p className="text-[9px] text-zinc-400">{note}</p>}
                    </div>
                    <div className={`grid gap-4 ${hasMask ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
                      <Field label="File Upload" noBadge>
                        <FileUpload
                          value={documents[key]?.fileUrl || ""}
                          onChange={(url) => setDocuments((d) => ({ ...d, [key]: { ...d[key], fileUrl: url } }))}
                        />
                      </Field>
                      {hasMask && (
                        <Field label="Document Number" noBadge hint={key === "aadhaar" ? "12-digit Aadhaar number" : "PAN format: ABCDE1234F"}>
                          <input
                            type="text"
                            placeholder={maskPlaceholder}
                            value={documents[key]?.docNumberMasked || ""}
                            maxLength={key === "aadhaar" ? 12 : 10}
                            onChange={(e) => {
                              let v = e.target.value;
                              if (key === "aadhaar") v = v.replace(/\D/g, "").slice(0, 12);
                              if (key === "pan")     v = v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
                              setDocuments((d) => ({ ...d, [key]: { ...d[key], docNumberMasked: v } }));
                            }}
                            className={(() => {
                              const v = documents[key]?.docNumberMasked || "";
                              const valid =
                                key === "aadhaar" ? /^\d{12}$/.test(v)
                                : key === "pan"   ? /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(v)
                                : true;
                              const hasValue = v.length > 0;
                              return `${inputCls} tracking-widest font-mono ${hasValue && valid ? "border-emerald-400" : hasValue ? "border-amber-400" : ""}`;
                            })()}
                          />
                          {/* Format hint */}
                          {(() => {
                            const v = documents[key]?.docNumberMasked || "";
                            if (!v) return null;
                            if (key === "aadhaar") {
                              if (/^\d{12}$/.test(v)) return <p className="text-[10px] text-emerald-600 font-semibold mt-1">✓ Valid Aadhaar format</p>;
                              if (!/^\d+$/.test(v))   return <p className="text-[10px] text-red-500 font-semibold mt-1">Aadhaar must contain digits only</p>;
                              return <p className="text-[10px] text-amber-600 font-semibold mt-1">{12 - v.length} more digit{12 - v.length !== 1 ? "s" : ""} needed</p>;
                            }
                            if (key === "pan") {
                              if (/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(v)) return <p className="text-[10px] text-emerald-600 font-semibold mt-1">✓ Valid PAN format</p>;
                              return <p className="text-[10px] text-amber-600 font-semibold mt-1">Format: 5 letters + 4 digits + 1 letter (e.g. ABCDE1234F)</p>;
                            }
                            return null;
                          })()}
                        </Field>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 4: Work Proofs ─────────────────────────────────────── */}
          {currentStep === 4 && (
            <div>
              <StepHeader title="Work Proofs" subtitle="Show your past work. Recommended — you can also skip this step." />
              <div className="space-y-4">
                {workProofs.map((proof, i) => (
                  <div key={i} className="border border-zinc-200 rounded-xl p-5 space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-500">Proof {i + 1}</p>
                      <button onClick={() => setWorkProofs((w) => w.filter((_, idx) => idx !== i))}
                        className="text-[9px] font-bold tracking-widest uppercase text-red-500 hover:text-red-700">
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="Proof Type">
                        <Select value={proof.proofType}
                          onChange={(e) => setWorkProofs((w) => w.map((x, idx) => idx === i ? { ...x, proofType: e.target.value } : x))}>
                          <option value="work_photo">Work Photo</option>
                          <option value="certificate">Certificate</option>
                          <option value="experience_letter">Experience Letter</option>
                          <option value="job_id_card">Job ID Card</option>
                          <option value="reference_contact">Reference Contact</option>
                        </Select>
                      </Field>
                      {proof.proofType !== "reference_contact" ? (
                        <Field label="File Upload">
                          <FileUpload
                            value={proof.fileUrl || ""}
                            onChange={(url) => setWorkProofs((w) => w.map((x, idx) => idx === i ? { ...x, fileUrl: url } : x))}
                          />
                        </Field>
                      ) : (
                        <>
                          <Field label="Reference Name">
                            <input type="text" placeholder="Full name"
                              value={proof.referenceContactName || ""}
                              onChange={(e) => setWorkProofs((w) => w.map((x, idx) => idx === i ? { ...x, referenceContactName: e.target.value } : x))}
                              className={inputCls} />
                          </Field>
                          <Field label="Reference Phone">
                            <input type="tel" placeholder="+91 9876543210"
                              value={proof.referenceContactPhone || ""}
                              onChange={(e) => setWorkProofs((w) => w.map((x, idx) => idx === i ? { ...x, referenceContactPhone: e.target.value } : x))}
                              className={inputCls} />
                          </Field>
                        </>
                      )}
                      <Field label="Title (optional)">
                        <input type="text" placeholder="e.g. AC installation at Sector 62"
                          value={proof.title || ""}
                          onChange={(e) => setWorkProofs((w) => w.map((x, idx) => idx === i ? { ...x, title: e.target.value } : x))}
                          className={inputCls} />
                      </Field>
                    </div>
                  </div>
                ))}
                <button type="button"
                  onClick={() => setWorkProofs((w) => [...w, { proofType: "work_photo", fileUrl: "", title: "" }])}
                  className="w-full border border-dashed border-zinc-300 rounded-xl py-4 text-[10px] font-bold tracking-widest uppercase text-zinc-500 hover:border-black hover:text-black transition-colors">
                  + Add Work Proof
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 5: Bank Details ────────────────────────────────────── */}
          {currentStep === 5 && (
            <div>
              <StepHeader title="Bank & Payout Details" subtitle="Your earnings will be credited here. Fields tagged Required must be filled — the rest are optional." />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Account Holder Name *">
                  <input type="text" placeholder="As per bank records" value={bankDetails.accountHolderName}
                    onChange={(e) => setBankDetails((b) => ({ ...b, accountHolderName: e.target.value }))}
                    className={inputCls} />
                </Field>
                <Field label="IFSC Code *" hint="11-character code on your cheque / passbook">
                  <input
                    type="text"
                    placeholder="SBIN0001234"
                    maxLength={11}
                    value={bankDetails.ifscCode}
                    onChange={(e) => setBankDetails((b) => ({ ...b, ifscCode: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11) }))}
                    className={(() => {
                      const v = bankDetails.ifscCode;
                      const valid = /^[A-Z]{4}0[A-Z0-9]{6}$/.test(v);
                      return `${inputCls} uppercase tracking-widest font-mono ${v.length > 0 && valid ? "border-emerald-400" : v.length > 0 ? "border-amber-400" : ""}`;
                    })()}
                  />
                  {bankDetails.ifscCode.length > 0 && (
                    /^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankDetails.ifscCode)
                      ? <p className="text-[10px] text-emerald-600 font-semibold mt-1">✓ Valid IFSC format</p>
                      : <p className="text-[10px] text-amber-600 font-semibold mt-1">Format: 4 letters + 0 + 6 alphanumeric (11 chars total)</p>
                  )}
                </Field>
                <Field label="Account Number *" hint="9–18 digits — digits only, no spaces">
                  <input
                    type="password"
                    placeholder="Enter account number"
                    value={bankDetails.accountNumber}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 18);
                      setBankDetails((b) => ({ ...b, accountNumber: v }));
                    }}
                    className={(() => {
                      const v = bankDetails.accountNumber;
                      const valid = v.length >= 9 && v.length <= 18;
                      return `${inputCls} ${v.length > 0 && valid ? "border-emerald-400" : v.length > 0 ? "border-amber-400" : ""}`;
                    })()}
                  />
                  {bankDetails.accountNumber.length > 0 && (
                    bankDetails.accountNumber.length < 9
                      ? <p className="text-[10px] text-amber-600 font-semibold mt-1">Need at least {9 - bankDetails.accountNumber.length} more digit{9 - bankDetails.accountNumber.length !== 1 ? "s" : ""}</p>
                      : <p className="text-[10px] text-emerald-600 font-semibold mt-1">✓ {bankDetails.accountNumber.length} digits entered</p>
                  )}
                </Field>
                <Field label="UPI ID" hint="Optional — for faster payouts">
                  <input type="text" placeholder="yourname@upi" value={bankDetails.upiId}
                    onChange={(e) => setBankDetails((b) => ({ ...b, upiId: e.target.value }))}
                    className={inputCls} />
                </Field>
                <div className="md:col-span-2">
                  <Field label="Cancelled Cheque Upload" hint="Recommended — helps verify your bank account faster">
                    <FileUpload
                      value={bankDetails.cancelledChequeUrl || ""}
                      onChange={(url) => setBankDetails((b) => ({ ...b, cancelledChequeUrl: url }))}
                    />
                  </Field>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 6: Availability ────────────────────────────────────── */}
          {currentStep === 6 && (
            <div>
              <StepHeader title="Availability & Working Model" subtitle="Help us match you with the right jobs. Fields tagged Required must be filled — the rest are optional." />
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Field label="Working Type *">
                    <Select value={availability.workingType}
                      onChange={(e) => setAvailability((a) => ({ ...a, workingType: e.target.value }))}>
                      <option value="full_time">Full-time</option>
                      <option value="part_time">Part-time</option>
                    </Select>
                  </Field>
                  <Field label="Travel Radius (km) *">
                    <input type="number" min="1" max="100" value={availability.travelRadiusKm}
                      onChange={(e) => setAvailability((a) => ({ ...a, travelRadiusKm: e.target.value }))}
                      className={inputCls} />
                  </Field>
                  <Field label="Working Hours From *">
                    <input type="time" value={availability.workingHoursFrom}
                      onChange={(e) => setAvailability((a) => ({ ...a, workingHoursFrom: e.target.value }))}
                      className={inputCls} />
                  </Field>
                  <Field label="Working Hours To *">
                    <input type="time" value={availability.workingHoursTo}
                      onChange={(e) => setAvailability((a) => ({ ...a, workingHoursTo: e.target.value }))}
                      className={inputCls} />
                  </Field>
                </div>

                <div>
                  <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-3">
                    Available Days *
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map((day) => (
                      <button key={day} type="button"
                        onClick={() => setAvailability((a) => ({
                          ...a,
                          availableDays: a.availableDays.includes(day)
                            ? a.availableDays.filter((d) => d !== day)
                            : [...a.availableDays, day],
                        }))}
                        className={`px-4 py-2 rounded-lg text-[10px] font-bold tracking-widest uppercase border transition-colors ${
                          availability.availableDays.includes(day)
                            ? "bg-black text-white border-black"
                            : "bg-white text-zinc-500 border-zinc-300 hover:border-black hover:text-black"
                        }`}>
                        {DAY_LABELS[day]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-x-8 gap-y-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={availability.acceptsUrgentJobs}
                      onChange={(e) => setAvailability((a) => ({ ...a, acceptsUrgentJobs: e.target.checked }))}
                      className="w-4 h-4 accent-black" />
                    <span className="text-xs font-medium text-zinc-700">Accept urgent / same-day jobs</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={availability.hasOwnVehicle}
                      onChange={(e) => setAvailability((a) => ({ ...a, hasOwnVehicle: e.target.checked }))}
                      className="w-4 h-4 accent-black" />
                    <span className="text-xs font-medium text-zinc-700">Has own vehicle</span>
                  </label>
                </div>

                {availability.hasOwnVehicle && (
                  <Field label="Vehicle Type">
                    <Select value={availability.vehicleType}
                      onChange={(e) => setAvailability((a) => ({ ...a, vehicleType: e.target.value }))}>
                      <option value="">Select type</option>
                      <option value="bike">Bike</option>
                      <option value="scooter">Scooter</option>
                      <option value="car">Car</option>
                      <option value="cycle">Cycle</option>
                      <option value="other">Other</option>
                    </Select>
                  </Field>
                )}

                <Field label="Preferred Job Locations" hint="Comma separated: Saket, Vasant Kunj">
                  <input type="text" placeholder="e.g. Lajpat Nagar, Greater Kailash" value={availability.preferredLocations}
                    onChange={(e) => setAvailability((a) => ({ ...a, preferredLocations: e.target.value }))}
                    className={inputCls} />
                </Field>
              </div>
            </div>
          )}

          {/* ── STEP 7: Agreement ───────────────────────────────────────── */}
          {currentStep === 7 && (
            <div>
              <StepHeader title="Safety & Legal Agreement" subtitle="All boxes must be checked to complete your application." />
              <div className="space-y-3">
                {[
                  { key: "termsAccepted", label: "I accept the Platform Terms & Conditions" },
                  { key: "codeOfConductAccepted", label: "I will follow the Code of Conduct with all customers" },
                  { key: "customerSafetyAccepted", label: "I agree to the Customer Safety Policy" },
                  { key: "noDirectPaymentRuleAccepted", label: "I will not accept direct cash from customers or contact them outside the platform" },
                  { key: "commissionPolicyAccepted", label: "I accept the Platform Commission & Payout Policy" },
                  { key: "dataPrivacyConsent", label: "I consent to my data being processed for platform operations" },
                  { key: "bgvConsent", label: "I consent to background & identity verification (Aadhaar / PAN / Police records)" },
                ].map(({ key, label }) => (
                  <label key={key}
                    className="flex items-start gap-3 p-4 rounded-lg border border-zinc-200 cursor-pointer hover:border-black transition-colors group">
                    <div className="relative mt-0.5 shrink-0">
                      <input type="checkbox" checked={agreement[key]}
                        onChange={(e) => setAgreement((a) => ({ ...a, [key]: e.target.checked }))}
                        className="peer appearance-none w-5 h-5 border-2 border-zinc-400 checked:bg-black checked:border-black transition-colors cursor-pointer rounded-none" />
                      <svg className="absolute top-0.5 left-0.5 w-3.5 h-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity"
                        viewBox="0 0 14 10" fill="none">
                        <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <span className="text-sm text-zinc-600 group-hover:text-black transition-colors leading-relaxed">
                      {label}
                    </span>
                  </label>
                ))}
              </div>
              {!allAgreed && (
                <p className="mt-4 text-[10px] font-bold tracking-widest uppercase text-zinc-400">
                  Please accept all agreements above to submit
                </p>
              )}
            </div>
          )}

          </div>{/* /onb-step */}

          {/* ── Navigation ──────────────────────────────────────────────── */}
          <div className="mt-10 pt-8 border-t border-zinc-200 flex justify-between items-center">
            <div>
              {currentStep > 1 && (
                <button onClick={() => { setCurrentStep((s) => s - 1); window.scrollTo(0, 0); }}
                  className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 hover:text-black transition-colors">
                  ← Back
                </button>
              )}
            </div>
            <div className="flex items-center gap-5">
              {currentStep === 4 && (
                <button onClick={handleSkip4} disabled={loading}
                  className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 hover:text-black transition-colors disabled:opacity-40">
                  Skip for now
                </button>
              )}
              <button
                onClick={handleNext}
                disabled={loading || (currentStep === 7 && !allAgreed)}
                className="bg-black text-white rounded-lg px-8 py-3 text-[10px] font-bold tracking-widest uppercase hover:bg-zinc-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                {loading
                  ? "Saving..."
                  : currentStep === 7
                  ? "Submit Application"
                  : "Save & Continue →"}
              </button>
            </div>
          </div>
        </div>

        {/* Step overview at bottom */}
        <div className="mt-6 grid grid-cols-7 gap-1">
          {STEPS.map((s) => (
            <div key={s.id} className="text-center">
              <div className={`w-6 h-6 mx-auto rounded-full flex items-center justify-center text-[9px] font-bold border ${
                s.id < currentStep
                  ? "bg-black text-white border-black"
                  : s.id === currentStep
                  ? "bg-white text-black border-black"
                  : "bg-white text-zinc-300 border-zinc-200"
              }`}>
                {s.id < currentStep ? "✓" : s.id}
              </div>
              <p className={`text-[8px] mt-1 font-bold tracking-wide ${s.id <= currentStep ? "text-zinc-700" : "text-zinc-300"}`}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {pickingLocation && (
        <LocationPicker
          initial={profile.location ? { lat: profile.location.lat, lng: profile.location.lng, fullAddress: profile.serviceArea, city: profile.city } : null}
          onConfirm={onPickLocation}
          onClose={() => setPickingLocation(false)}
        />
      )}
    </div>
  );
}
