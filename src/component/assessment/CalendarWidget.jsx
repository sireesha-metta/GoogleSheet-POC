import { useState, useMemo, useEffect } from "react";
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, CheckCircle, ExternalLink, Loader2 } from "lucide-react";

function formatTime12h(timeStr, shiftTypeHint = "") {
  if (!timeStr) return "";
  const parts = timeStr.trim().split(":");
  let h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  const hint = (shiftTypeHint || "").toLowerCase();
  if ((hint.includes("afternoon") || hint.includes("evening")) && h < 12) {
    h += 12;
  }
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  const hh = String(h).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  return `${hh}:${mm} ${ampm}`;
}

export default function CalendarWidget({ profile, onConfirm, onBack, isSubmitting = false, submitError = "" }) {
  const [localSubmitting, setLocalSubmitting] = useState(false);
  const isLoading = isSubmitting || localSubmitting;

  useEffect(() => {
    if (submitError) {
      setLocalSubmitting(false);
    }
  }, [submitError]);
  const today = useMemo(() => new Date(), []);

  const minMonth = useMemo(() => new Date(today.getFullYear(), today.getMonth(), 1), [today]);
  const maxMonth = useMemo(() => new Date(today.getFullYear(), today.getMonth() + 3, 1), [today]);

  const [currentMonthDate, setCurrentMonthDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(() => {
    const target = new Date(today);
    target.setDate(target.getDate() + 1);
    while (target.getDay() === 0 || target.getDay() === 6) {
      target.setDate(target.getDate() + 1);
    }
    return target;
  });
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedTimeZone, setSelectedTimeZone] = useState("India,Asia/Kolkata");
  const [selectedShift, setSelectedShift] = useState("MORNING");
  const [viewMode, setViewMode] = useState("calendar");

  const isTodaySelected = useMemo(() => {
    if (!selectedDate) return false;
    const now = new Date();
    return (
      selectedDate.getFullYear() === now.getFullYear() &&
      selectedDate.getMonth() === now.getMonth() &&
      selectedDate.getDate() === now.getDate()
    );
  }, [selectedDate]);

  const currentMinutesToday = useMemo(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }, []);

  const [slotData, setSlotData] = useState({
    slots: [],
    allConfiguredSlots: [],
    bookedSlots: [],
    blockedSlots: [],
    shifts: [],
    loadingSlots: true,
  });

  const filteredSlots = useMemo(() => {
    const baseSlots = slotData.allConfiguredSlots || [];
    if (selectedShift === "ALL") return baseSlots;

    const parseToMins = (str, shiftTypeHint = "") => {
      if (!str) return -1;
      const lower = str.toLowerCase().trim();
      const isPm = lower.includes("pm");
      const isAm = lower.includes("am");
      const cleaned = lower.replace(/(am|pm)/g, "").trim();
      const parts = cleaned.split(":");
      let hours = parseInt(parts[0], 10) || 0;
      const mins = parseInt(parts[1], 10) || 0;
      if (isPm && hours < 12) hours += 12;
      if (isAm && hours === 12) hours = 0;
      const hint = (shiftTypeHint || "").toLowerCase();
      if (!isAm && !isPm && (hint.includes("afternoon") || hint.includes("evening")) && hours < 12) {
        hours += 12;
      }
      return hours * 60 + mins;
    };

    // Find shift in database configurations
    const matchedShift = (slotData.shifts || []).find((s) => {
      if (selectedShift === "MORNING" && s.shift_type.toLowerCase().includes("morning")) return true;
      if (selectedShift === "AFTERNOON" && s.shift_type.toLowerCase().includes("afternoon")) return true;
      if (selectedShift === "EVENING" && s.shift_type.toLowerCase().includes("evening")) return true;
      return s.shift_type === selectedShift;
    });

    if (matchedShift && matchedShift.start_time && matchedShift.end_time) {
      const shiftHint = matchedShift.shift_type;
      const startMins = parseToMins(matchedShift.start_time, shiftHint);
      const endMins = parseToMins(matchedShift.end_time, shiftHint);

      if (startMins >= 0 && endMins > startMins) {
        return baseSlots.filter((slot) => {
          const slotMins = parseToMins(slot);
          return slotMins >= startMins && slotMins < endMins;
        });
      }
    }

    return baseSlots.filter((slot) => {
      const lower = slot.toLowerCase();
      const isAm = lower.includes("am");
      const isPm = lower.includes("pm");
      const hour = parseInt(lower, 10);

      if (selectedShift === "MORNING") {
        if (isAm && (hour >= 8 && hour <= 11)) return true;
        if (isPm && hour === 12) return true;
        return false;
      }
      if (selectedShift === "AFTERNOON") {
        if (isPm && (hour >= 1 && hour <= 5)) return true;
        return false;
      }
      if (selectedShift === "EVENING") {
        if (isPm && (hour >= 6 && hour <= 11)) return true;
        return false;
      }
      return true;
    });
  }, [slotData.allConfiguredSlots, slotData.shifts, selectedShift]);

  useEffect(() => {
    setSelectedTime("");
  }, [selectedShift, selectedDate]);

  const monthYearLabel = useMemo(() => {
    return currentMonthDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, [currentMonthDate]);

  const isPrevMonthDisabled = useMemo(() => {
    return (
      currentMonthDate.getFullYear() < minMonth.getFullYear() ||
      (currentMonthDate.getFullYear() === minMonth.getFullYear() &&
        currentMonthDate.getMonth() <= minMonth.getMonth())
    );
  }, [currentMonthDate, minMonth]);

  const isNextMonthDisabled = useMemo(() => {
    return (
      currentMonthDate.getFullYear() > maxMonth.getFullYear() ||
      (currentMonthDate.getFullYear() === maxMonth.getFullYear() &&
        currentMonthDate.getMonth() >= maxMonth.getMonth())
    );
  }, [currentMonthDate, maxMonth]);

  const handlePrevMonth = () => {
    if (!isPrevMonthDisabled) {
      setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    }
  };

  const handleNextMonth = () => {
    if (!isNextMonthDisabled) {
      setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    }
  };

  const calendarDays = useMemo(() => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];

    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ key: `blank-${i}`, isBlank: true });
    }

    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const dateObj = new Date(year, month, dayNum);

      const checkDate = new Date(year, month, dayNum);
      checkDate.setHours(0, 0, 0, 0);

      const todayDate = new Date(today);
      todayDate.setHours(0, 0, 0, 0);

      const isPast = checkDate < todayDate;

      const maxAllowedDate = new Date(today);
      maxAllowedDate.setMonth(maxAllowedDate.getMonth() + 3);
      maxAllowedDate.setHours(23, 59, 59, 999);
      const isBeyondLimit = checkDate > maxAllowedDate;

      const dayOfWeek = checkDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      const isDisabled = isPast || isBeyondLimit || isWeekend;
      const isSelected =
        selectedDate &&
        selectedDate.getFullYear() === year &&
        selectedDate.getMonth() === month &&
        selectedDate.getDate() === dayNum;

      const isToday =
        today.getFullYear() === year &&
        today.getMonth() === month &&
        today.getDate() === dayNum;

      days.push({ key: `day-${dayNum}`, dayNum, dateObj, isDisabled, isSelected, isToday, });
    }

    return days;
  }, [currentMonthDate, selectedDate, today]);

  const formattedSelectedDate = useMemo(() => {
    if (!selectedDate) return "";
    return selectedDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }, [selectedDate]);

  useEffect(() => {
    if (!formattedSelectedDate) return;
    let active = true;
    const fetchSlots = async () => {
      setSlotData((prev) => ({ ...prev, loadingSlots: true }));
      try {
        let res;
        try {
          res = await fetch(`/api/available-slots?date=${encodeURIComponent(formattedSelectedDate)}`);
          if (!res.ok) throw new Error("Relative fetch failed");
        } catch (e) {
          res = await fetch(`http://localhost:5000/api/available-slots?date=${encodeURIComponent(formattedSelectedDate)}`);
        }
        const json = await res.json();
        if (active && json.success) {
          const avail = json.slots || [];
          const allConf = json.allConfiguredSlots || [];
          const booked = json.bookedSlots || [];
          const blocked = json.blockedSlots || [];

          setSlotData({
            slots: avail,
            allConfiguredSlots: allConf,
            bookedSlots: booked,
            blockedSlots: blocked,
            shifts: json.shifts || [],
            loadingSlots: false,
          });
        }
      } catch (e) {
        if (active) setSlotData((prev) => ({ ...prev, loadingSlots: false }));
      }
    };
    fetchSlots();
    return () => { active = false; };
  }, [formattedSelectedDate]);

  const calendlyMonthParam = useMemo(() => {
    if (!selectedDate) return "2026-09";
    const yyyy = selectedDate.getFullYear();
    const mm = String(selectedDate.getMonth() + 1).padStart(2, "0");
    return `${yyyy}-${mm}`;
  }, [selectedDate]);

  const fullName = `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim() || "Participant";
  const userEmail = profile?.email || "";

  const calendlyUrl = `https://calendly.com/leanin-coaching/30min?month=${calendlyMonthParam}&background_color=1C1C1C&text_color=E7D9CB&primary_color=C8A85B&name=${encodeURIComponent(fullName)}&email=${encodeURIComponent(userEmail)}`;

  useEffect(() => {
    const handleMessage = (e) => {
      if (e.data && e.data.event === "calendly.event_scheduled") {
        console.log("Calendly event scheduled:", e.data);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleConfirmSubmission = () => {
    if (isLoading) return;
    if (!selectedTime) {
      alert("Please select an available discussion time slot before submitting.");
      return;
    }
    setLocalSubmitting(true);

    const bookingDetails = {
      scheduledDate: formattedSelectedDate,
      scheduledTime: selectedTime,
      timeZone: selectedTimeZone,
      calendarUrl: "https://calendly.com/leanin-coaching/30min",
      rescheduleUrl: "https://calendly.com/leanin-coaching/30min",
      cancelUrl: "https://calendly.com/leanin-coaching/30min",
    };

    onConfirm(bookingDetails);
  };

  return (
    <section className="min-h-screen bg-[#1c1c1c] text-[#c8a85b]" style={{ fontFamily: '"Aptos", "Trebuchet MS", sans-serif' }}>
      <div className="mx-auto flex min-h-screen max-w-6xl items-center px-4 py-8">
        <div className="w-full max-w-4xl mx-auto">

          <div className="mb-6">
            <p className="mb-2 text-xs md:text-sm font-semibold uppercase tracking-[6px] text-[#cd3cd3]">
              LEAN IN COACHING
            </p>
            <h1 className="text-2xl md:text-4xl font-bold leading-tight text-[#c8a85b]">
              Schedule Discussion & Complete Assessment
            </h1>
            <p className="mt-2 text-base text-gray-400">
              Select your preferred date & time slot for your 20 mins Discussion with Lorraine Burns.
            </p>
          </div>

          {/* <div className="mb-6 flex gap-3"> */}
          {/* <button type="button" onClick={() => setViewMode("calendar")}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${viewMode === "calendar" ? "bg-[#c8a85b] text-[#1c1c1c]"
                  : "border border-[#3a3a3a] bg-[#1f1f1f] text-[#c8a85b] hover:border-[#c8a85b]"
                }`} >
              <CalendarIcon size={16} className="inline mr-2" /> Interactive Calendar
            </button> */}
          {/* <button type="button" onClick={() => setViewMode("calendly")}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${viewMode === "calendly" ? "bg-[#c8a85b] text-[#1c1c1c]"
                  : "border border-[#3a3a3a] bg-[#1f1f1f] text-[#c8a85b] hover:border-[#c8a85b]"
                }`} >
            </button> */}
          {/* </div> */}

          <div className="rounded-2xl border border-[#cd3cd3] bg-[#262626] p-6 md:p-8 shadow-2xl">
            {viewMode === "calendar" ? (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

                <div className="md:col-span-7 border-b md:border-b-0 md:border-r border-[#3a3a3a] pb-6 md:pb-0 md:pr-6">

                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-[#c8a85b]">{monthYearLabel}</h2>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={handlePrevMonth} disabled={isPrevMonthDisabled}
                        title="Previous month (previous months disabled)"
                        className="rounded-lg border border-[#3a3a3a] bg-[#1f1f1f] p-2 text-[#c8a85b] hover:bg-[#313131] disabled:opacity-30 disabled:cursor-not-allowed transition" >
                        <ChevronLeft size={18} />
                      </button>
                      <span className="text-xs text-gray-400 font-mono">Up to 3 months</span>
                      <button type="button" onClick={handleNextMonth} disabled={isNextMonthDisabled}
                        title="Next month (max 3 months ahead)" className="rounded-lg border border-[#3a3a3a] bg-[#1f1f1f] p-2 text-[#c8a85b] hover:bg-[#313131] disabled:opacity-30 disabled:cursor-not-allowed transition">
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center font-semibold text-xs text-gray-400 mb-2">
                    <span>Sun</span>
                    <span>Mon</span>
                    <span>Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                    <span>Fri</span>
                    <span>Sat</span>
                  </div>

                  <div className="grid grid-cols-7 gap-1.5 text-center">
                    {calendarDays.map((cell) => {
                      if (cell.isBlank) {
                        return <div key={cell.key} className="h-10 w-full" />;
                      }

                      return (
                        <button key={cell.key} type="button" disabled={cell.isDisabled} onClick={() => setSelectedDate(cell.dateObj)} className={`h-10 w-full rounded-xl text-sm font-medium transition-all flex items-center justify-center ${cell.isSelected ? "bg-[#c8a85b] text-[#1c1c1c] font-bold shadow-lg scale-105"
                          : cell.isDisabled ? "text-gray-600 bg-[#1a1a1a]/50 cursor-not-allowed line-through opacity-40"
                            : "bg-[#1f1f1f] text-[#E7D9CB] border border-[#3a3a3a] hover:border-[#c8a85b] hover:bg-[#313131]"
                          }`} >
                          {cell.dayNum}
                        </button>
                      );
                    })}
                  </div>

                  {/* <p className="mt-4 text-xs text-gray-400 italic text-center">
                    * Past dates, weekends (Sat & Sun), and months before current are disabled. Selection is limited up to 3 months into the future.
                  </p> */}
                  <div className="space-y-3 pt-4 m-4">
                    <button type="button" onClick={onBack} className="rounded-full border border-[#cd3cd3] px-6 py-2.5 text-sm font-semibold text-[#c8a85b] transition hover:bg-[#cd3cd3]/10">
                      Back to Questions
                    </button>
                  </div>
                </div>

                <div className="md:col-span-5 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-[#c8a85b] mb-1"> Selected Date  </h3>
                    <p className="text-sm font-semibold text-white mb-4 bg-[#1f1f1f] border border-[#3a3a3a] rounded-lg p-2.5 flex items-center gap-2">
                      <CalendarIcon size={16} className="text-[#c8a85b]" />
                      {formattedSelectedDate}
                    </p>

                    <div className="mb-4">
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Shift Type</label>
                      <select
                        value={selectedShift}
                        onChange={(e) => setSelectedShift(e.target.value)}
                        className="w-full rounded-lg border border-[#3a3a3a] bg-[#1f1f1f] p-2.5 text-xs text-[#E7D9CB] focus:border-[#c8a85b] outline-none"
                      >
                        {slotData.loadingSlots || !slotData.shifts || slotData.shifts.length === 0 ? (
                          <option value="MORNING">Loading shift configurations...</option>
                        ) : (
                          slotData.shifts.map((s) => {
                            const rawName = s.shift_type.split("(")[0].trim();
                            const timeLabel = (s.start_time && s.end_time) ? `${formatTime12h(s.start_time, s.shift_type)} - ${formatTime12h(s.end_time, s.shift_type)}` : "";
                            const displayLabel = timeLabel ? `${rawName} (${timeLabel})` : s.shift_type;
                            const valueKey = rawName.toUpperCase().includes("MORNING") ? "MORNING" : rawName.toUpperCase().includes("AFTERNOON") ? "AFTERNOON" : rawName.toUpperCase().includes("EVENING") ? "EVENING" : s.shift_type;

                            return (
                              <option key={s.id || s.shift_type} value={valueKey}>
                                {displayLabel}
                              </option>
                            );
                          })
                        )}
                        <option value="ALL">All Shifts</option>
                      </select>
                    </div>

                    <h3 className="text-lg font-bold text-[#c8a85b] mb-2 flex items-center gap-2">
                      <Clock size={18} /> Select Discussion Time
                    </h3>

                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {slotData.loadingSlots ? (
                        <div className="col-span-2 flex items-center justify-center py-8 text-[#c8a85b] gap-2 text-xs font-semibold">
                          <Loader2 className="animate-spin" size={18} /> Loading available time slots...
                        </div>
                      ) : filteredSlots.length === 0 ? (
                        <div className="col-span-2 py-6 text-center text-xs text-gray-400">
                          No time slots available for this shift.
                        </div>
                      ) : (
                        filteredSlots.map((slot) => {
                          const parseSlotMins = (str) => {
                            if (!str) return -1;
                            const lower = str.toLowerCase().trim();
                            const isPm = lower.includes("pm");
                            const isAm = lower.includes("am");
                            const cleaned = lower.replace(/(am|pm)/g, "").trim();
                            const parts = cleaned.split(":");
                            let hours = parseInt(parts[0], 10) || 0;
                            const mins = parseInt(parts[1], 10) || 0;
                            if (isPm && hours < 12) hours += 12;
                            if (isAm && hours === 12) hours = 0;
                            return hours * 60 + mins;
                          };

                          const isBooked = slotData.bookedSlots.includes(slot);
                          const isBlocked = slotData.blockedSlots.includes(slot);
                          const isPastSlotToday = isTodaySelected && parseSlotMins(slot) <= currentMinutesToday;
                          const isDisabled = isBooked || isBlocked || isPastSlotToday;

                          return (
                            <button
                              key={slot}
                              type="button"
                              disabled={isDisabled}
                              onClick={() => setSelectedTime(slot)}
                              className={`rounded-lg py-2 px-3 text-xs md:text-sm font-semibold transition border flex flex-col items-center justify-center ${
                                selectedTime === slot
                                  ? "bg-[#c8a85b] text-[#1c1c1c] border-[#c8a85b]"
                                  : isDisabled
                                  ? "bg-[#1a1a1a]/50 text-gray-600 border-[#3a3a3a] cursor-not-allowed opacity-40 line-through"
                                  : "bg-[#1f1f1f] text-[#E7D9CB] border-[#3a3a3a] hover:border-[#c8a85b]"
                              }`}
                            >
                              <span>{slot}</span>
                              {isBooked ? (
                                <span className="text-[10px] text-red-400 no-underline font-normal">Booked</span>
                              ) : isBlocked ? (
                                <span className="text-[10px] text-yellow-500 no-underline font-normal">Unavailable</span>
                              ) : isPastSlotToday ? (
                                <span className="text-[10px] text-gray-500 no-underline font-normal">Passed</span>
                              ) : null}
                            </button>
                          );
                        })
                      )}
                    </div>

                    <div className="mb-6">
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Time Zone </label>
                      <select value={selectedTimeZone} onChange={(e) => setSelectedTimeZone(e.target.value)}
                        className="w-full rounded-lg border border-[#3a3a3a] bg-[#1f1f1f] p-2.5 text-xs text-[#E7D9CB] focus:border-[#c8a85b] outline-none" >
                        <option value="India, Sri Lanka Time">India, Asia/Kolkata (IST, GMT+5:30)</option>
                        <option value="London, UK (BST, GMT+1)">London, UK (BST, GMT+1)</option>
                        <option value="Eastern Time (US & Canada)">Eastern Time (US & Canada)</option>
                        <option value="Pacific Time (US & Canada)">Pacific Time (US & Canada)</option>
                        <option value="Singapore Time (SGT)">Singapore Time (SGT, GMT+8)</option>
                      </select>
                    </div>

                    {/* <div className="rounded-xl border border-[#3a3a3a] bg-[#1f1f1f] p-4 text-xs text-gray-300 space-y-1 mb-6">
                      <p className="font-bold text-[#c8a85b] text-sm mb-1">Appointment Summary:</p>
                      <p>• <strong>Topic:</strong> 20 mins Discussion with Lorraine Burns</p>
                      <p>• <strong>Participant:</strong> {fullName} ({userEmail || "No email provided"})</p>
                      <p>• <strong>Schedule:</strong> {selectedTime} ({selectedTimeZone}) on {formattedSelectedDate}</p>
                    </div> */}
                  </div>

                  {submitError && (
                    <div className="mb-4 rounded-xl border border-red-500/50 bg-red-900/30 p-3 text-xs text-red-200">
                      {submitError}
                    </div>
                  )}

                  <div className="space-y-3 pt-4 border-t border-[#3a3a3a]">
                    <button type="button" onClick={handleConfirmSubmission} disabled={isLoading}
                      className="w-full rounded-full bg-[#c8a85b] py-3.5 px-6 font-bold text-[#1c1c1c] transition hover:bg-[#d8b96b] shadow-lg flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed" >
                      {isLoading ? (
                        <>
                          <Loader2 size={18} className="animate-spin" /> Submitting Assessment...
                        </>
                      ) : (
                        <>
                          <CheckCircle size={18} /> Confirm & Submit Assessment
                        </>
                      )}
                    </button>

                    {/* <button type="button" onClick={onBack}
                      className="w-full rounded-full border border-[#cd3cd3] bg-transparent py-2.5 px-6 text-sm font-semibold text-[#c8a85b] transition hover:bg-[#cd3cd3]/10" >
                      Back to Questions
                    </button> */}
                  </div>
                </div>

              </div>
            ) : (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm text-gray-300">
                    Showing Calendly page for <strong>{monthYearLabel}</strong>
                  </p>
                  <button type="button" onClick={handleConfirmSubmission} disabled={isLoading} className="rounded-full bg-[#c8a85b] px-5 py-2 text-xs font-bold text-[#1c1c1c] transition hover:bg-[#d8b96b] disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5"  >
                    {isLoading ? <><Loader2 size={14} className="animate-spin" /> Submitting...</> : "Done & Submit Assessment →"}
                  </button>
                </div>
                <div className="w-full rounded-xl overflow-hidden border border-[#3a3a3a] bg-[#1c1c1c]">
                  <iframe src={calendlyUrl} width="100%" height="650" frameBorder="0" title="Calendly Scheduling Page"
                    className="w-full" />
                </div>
                <div className="mt-4 flex justify-between">

                  <button type="button" onClick={handleConfirmSubmission} disabled={isLoading} className="rounded-full bg-[#c8a85b] px-6 py-2.5 text-sm font-bold text-[#1c1c1c] transition hover:bg-[#d8b96b] disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2">
                    {isLoading ? <><Loader2 size={16} className="animate-spin" /> Submitting Assessment...</> : "Confirm & Complete Assessment"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
