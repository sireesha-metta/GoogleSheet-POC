import { useState, useEffect } from "react";
import { getSlotSettingsApi, toggleSlotConfigApi, blockSlotApi, unblockSlotApi, saveShiftApi, deleteShiftApi } from "../services/Api";

export default function SlotManagement() {
  const [configs, setConfigs] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Shift Form State
  const [shiftType, setShiftType] = useState("Morning Shift (08:30 AM - 12:30 PM)");
  const [startTime, setStartTime] = useState("09:00:00");
  const [endTime, setEndTime] = useState("13:00:00");
  const [maxCapacity, setMaxCapacity] = useState("15");
  const [editingShiftId, setEditingShiftId] = useState(null);
  const [submittingShift, setSubmittingShift] = useState(false);

  // Block Form State
  const [blockDate, setBlockDate] = useState("");
  const [blockTime, setBlockTime] = useState("ALL");
  const [blockReason, setBlockReason] = useState("");
  const [submittingBlock, setSubmittingBlock] = useState(false);

  const loadSettings = async () => {
    setLoading(true);
    setError("");
    const res = await getSlotSettingsApi();
    if (res.success) {
      setConfigs(res.configs || []);
      setBlocks(res.blocks || []);
      setShifts(res.shifts || []);
    } else {
      setError(res.message || "Failed to load slot settings.");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleShiftTypeChange = (selectedType) => {
    setShiftType(selectedType);
    const existing = shifts.find((s) => s.shift_type === selectedType);
    if (existing) {
      setEditingShiftId(existing.id);
      setStartTime(existing.start_time);
      setEndTime(existing.end_time);
      setMaxCapacity(existing.max_capacity || 15);
    } else {
      setEditingShiftId(null);
    }
  };

  useEffect(() => {
    if (shifts.length > 0) {
      const existing = shifts.find((s) => s.shift_type === shiftType);
      if (existing) {
        setEditingShiftId(existing.id);
        setStartTime(existing.start_time);
        setEndTime(existing.end_time);
        setMaxCapacity(existing.max_capacity || 15);
      }
    }
  }, [shifts]);

  const handleSaveShift = async (e) => {
    e.preventDefault();
    if (!shiftType || !startTime || !endTime) {
      setError("Please fill out shift type, start time, and end time.");
      return;
    }
    setSubmittingShift(true);
    setSuccessMsg("");
    setError("");

    const payload = {
      id: editingShiftId,
      shift_type: shiftType,
      start_time: startTime,
      end_time: endTime,
      // max_capacity: Number(maxCapacity) || 15,
      call_duration_mins: 20,
      grace_period_mins: 10,
      is_active: true,
    };

    const res = await saveShiftApi(payload);
    setSubmittingShift(false);
    if (res.success) {
      setSuccessMsg("Shift configuration saved successfully.");
      setEditingShiftId(null);
      loadSettings();
    } else {
      setError(res.message || "Failed to save shift configuration.");
    }
  };

  const handleEditShift = (s) => {
    setEditingShiftId(s.id);
    setShiftType(s.shift_type);
    setStartTime(s.start_time);
    setEndTime(s.end_time);
    setMaxCapacity(s.max_capacity || 15);
  };

  const handleDeleteShift = async (id) => {
    if (!window.confirm("Are you sure you want to delete this shift configuration?")) return;
    setSuccessMsg("");
    setError("");
    const res = await deleteShiftApi(id);
    if (res.success) {
      setSuccessMsg("Shift configuration deleted.");
      setShifts((prev) => prev.filter((s) => s.id !== id));
    } else {
      setError(res.message || "Failed to delete shift.");
    }
  };

  const todayISO = new Date().toISOString().split("T")[0];

  const handleCreateBlock = async (e) => {
    e.preventDefault();
    if (!blockDate) {
      setError("Please select a date to block.");
      return;
    }
    if (blockDate < todayISO) {
      setError("Cannot block a past date. Please select today or a future date.");
      return;
    }
    setSubmittingBlock(true);
    setSuccessMsg("");
    setError("");

    const payload = {
      block_date: blockDate,
      slot_time: blockTime === "ALL" ? null : blockTime,
      reason: blockReason,
    };

    const res = await blockSlotApi(payload);
    setSubmittingBlock(false);
    if (res.success) {
      setSuccessMsg("Date/Slot blocked successfully.");
      setBlockDate("");
      setBlockReason("");
      setBlockTime("ALL");
      loadSettings();
    } else {
      setError(res.message || "Failed to block slot.");
    }
  };

  const handleRemoveBlock = async (id) => {
    if (!window.confirm("Remove this block?")) return;
    setSuccessMsg("");
    setError("");
    const res = await unblockSlotApi(id);
    if (res.success) {
      setSuccessMsg("Block removed successfully.");
      setBlocks((prev) => prev.filter((b) => b.id !== id));
    } else {
      setError(res.message || "Failed to remove block.");
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-[#1f2d3f] to-[#294a67] px-6 py-5 rounded-t-lg">
        <div>
          <h1 className="text-2xl font-bold text-white">Shift & Availability Management</h1>
          <p className="text-sm text-slate-300 mt-1">Configure working shifts (20 min call + 10 min grace period) and block specific dates.</p>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {error && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-700">
            {successMsg}
          </div>
        )}

        {loading ? (
          <p className="py-8 text-center text-sm text-gray-500">Loading slot configuration...</p>
        ) : (
          <>
            {/* Section 1: Shift Configuration Form */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Shift Configuration</h2>
                  <p className="text-xs text-slate-500">Set start time, end time, and capacity. Exploration time is fixed to <strong>20 min</strong> with <strong>10 min grace period</strong>.</p>
                </div>
              </div>

              <form onSubmit={handleSaveShift} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Shift Type</label>
                  <select
                    value={shiftType}
                    onChange={(e) => handleShiftTypeChange(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Morning Shift (08:30 AM - 12:30 PM)">Morning Shift (08:30 AM - 12:30 PM)</option>
                    <option value="Afternoon Shift (02:00 PM - 05:00 PM)">Afternoon Shift (02:00 PM - 05:00 PM)</option>
                    <option value="Evening Shift (06:00 PM - 09:00 PM)">Evening Shift (06:00 PM - 09:00 PM)</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Start Time (HH:mm:ss)</label>
                    <input
                      type="text"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      placeholder="09:00:00"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">End Time (HH:mm:ss)</label>
                    <input
                      type="text"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      placeholder="13:00:00"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Exploration Time</label>
                    <input
                      type="text"
                      value="20 mins"
                      readOnly
                      className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2.5 text-sm font-semibold text-slate-700 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Grace Period</label>
                    <input
                      type="text"
                      value="10 mins"
                      readOnly
                      className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2.5 text-sm font-semibold text-slate-700 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Max Patients Capacity / Shift</label>
                    <input
                      type="number"
                      value={maxCapacity}
                      onChange={(e) => setMaxCapacity(e.target.value)}
                      placeholder="15"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={submittingShift}
                    className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
                  >
                    {submittingShift ? "Saving..." : editingShiftId ? "Update Shift Configuration" : "Save Shift Configuration"}
                  </button>
                  {editingShiftId && (
                    <button
                      type="button"
                      onClick={() => setEditingShiftId(null)}
                      className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Active Configured Shifts List */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-3">Configured Shifts</h2>
              {shifts.length === 0 ? (
                <p className="text-xs text-slate-500 py-2">No shift configurations found.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {shifts.map((s) => (
                    <div key={s.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-sm text-slate-800">{s.shift_type}</h3>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Active</span>
                      </div>
                      <div className="text-xs text-slate-600 space-y-1">
                        <p>🕒 <strong>Time Window:</strong> {s.start_time} – {s.end_time}</p>
                        {/* <p>👥 <strong>Max Capacity:</strong> {s.max_capacity} Patients</p> */}
                        <p>⏱️ <strong>Exploration:</strong> 20 min (+ 10 min grace)</p>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => handleEditShift(s)}
                          className="px-3 py-1 rounded bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200 hover:bg-blue-100"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteShift(s.id)}
                          className="px-3 py-1 rounded bg-red-50 text-red-700 text-xs font-semibold border border-red-200 hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 2: Block Date or Specific Slot */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-2">Block Date or Specific Slot</h2>
              <p className="text-xs text-slate-500 mb-4">Mark a specific date or individual time slot as unavailable (e.g. for holidays or meetings).</p>

              <form onSubmit={handleCreateBlock} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Select Date</label>
                  <input
                    type="date"
                    min={todayISO}
                    value={blockDate}
                    onChange={(e) => setBlockDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Time Slot</label>
                  <select
                    value={blockTime}
                    onChange={(e) => setBlockTime(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ALL">Entire Day (All Slots)</option>
                    {configs.map((c) => (
                      <option key={c.id} value={c.slot_time}>
                        {c.slot_time}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Reason (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Out of office, Holiday"
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={submittingBlock}
                    className="w-full rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-amber-600 disabled:opacity-60"
                  >
                    {submittingBlock ? "Blocking..." : "Block Slot / Date"}
                  </button>
                </div>
              </form>
            </div>

            {/* Section 3: Blocked Slots List */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-2">Active Blocked Dates & Slots</h2>
              {blocks.length === 0 ? (
                <p className="text-xs text-slate-500 py-4">No custom blocked dates or slots.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700">
                        <th className="p-3 text-left">Blocked Date</th>
                        <th className="p-3 text-left">Time Slot</th>
                        <th className="p-3 text-left">Reason</th>
                        <th className="p-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {blocks.map((b) => (
                        <tr key={b.id} className="border-t border-slate-200 hover:bg-slate-50">
                          <td className="p-3 font-semibold text-slate-800">{b.block_date}</td>
                          <td className="p-3">
                            {b.slot_time ? (
                              <span className="px-2 py-1 rounded bg-amber-100 text-amber-800 font-semibold">{b.slot_time}</span>
                            ) : (
                              <span className="px-2 py-1 rounded bg-red-100 text-red-800 font-semibold">Entire Day</span>
                            )}
                          </td>
                          <td className="p-3 text-slate-600">{b.reason || "—"}</td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveBlock(b.id)}
                              className="px-3 py-1 rounded border border-red-300 bg-red-50 text-red-700 font-semibold hover:bg-red-100"
                            >
                              Unblock
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
