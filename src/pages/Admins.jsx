import { useEffect, useMemo, useState } from "react";
import {
  PencilSquareIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  LockClosedIcon,
  RocketLaunchIcon,
} from "@heroicons/react/24/outline";
import { deleteAdmin, getAdmins, updateAdmin } from "../services/Api";
import { createAdminUser } from "../utils/auth";
import { validators } from "../utils/validation";
import FormInput from "../component/FormInput";

const EMPTY_EDIT_FORM = {
  firstName: "",
  lastName: "",
  mobile: "",
  email: "",
  status: "Active",
};

const PAGE_SIZE_OPTIONS = [5, 10, 20];

const SORT_LABELS = {
  firstName: "First Name",
  lastName: "Last Name",
  mobile: "Mobile",
  email: "Email",
  status: "Status",
};

const Admins = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM);
  const [actionBusyId, setActionBusyId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState("firstName");
  const [sortDir, setSortDir] = useState("asc");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [adminForm, setAdminForm] = useState({
    firstName: "",
    lastName: "",
    mobile: "",
    email: "",
    password: "",
  });
  const [adminCreateBusy, setAdminCreateBusy] = useState(false);
  const [adminCreateMessage, setAdminCreateMessage] = useState(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminErrors, setAdminErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    password: "",
  });

  const loadAdmins = async () => {
    setLoading(true);
    setError("");

    const result = await getAdmins();
    if (!result.success) {
      setError(result.message || "Unable to load admin users.");
      setAdmins([]);
      setLoading(false);
      return;
    }

    setAdmins(Array.isArray(result.data) ? result.data : []);
    setLoading(false);
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const beginEdit = (admin) => {
    setEditingId(admin.id);
    setEditForm({
      firstName: admin.firstName || "",
      lastName: admin.lastName || "",
      mobile: admin.mobile || "",
      email: admin.email || "",
      status: admin.status || "Active",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(EMPTY_EDIT_FORM);
  };

  const saveEdit = async (id) => {
    setActionBusyId(id);
    setError("");

    const payload = {
      firstName: String(editForm.firstName || "").trim(),
      lastName: String(editForm.lastName || "").trim(),
      mobile: String(editForm.mobile || "").trim(),
      email: String(editForm.email || "").trim().toLowerCase(),
      status: String(editForm.status || "Active"),
    };

    const result = await updateAdmin(id, payload);

    if (!result.success) {
      setError(result.message || "Unable to update admin user.");
      setActionBusyId(null);
      return;
    }

    setAdmins((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...payload } : row))
    );

    setActionBusyId(null);
    cancelEdit();
  };

  const removeAdmin = async (id, fullName) => {
    const ok = window.confirm(`Delete admin ${fullName}?`);
    if (!ok) return;

    setActionBusyId(id);
    setError("");

    const result = await deleteAdmin(id);
    if (!result.success) {
      setError(result.message || "Unable to delete admin user.");
      setActionBusyId(null);
      return;
    }

    setAdmins((prev) => prev.filter((row) => row.id !== id));
    setActionBusyId(null);
  };

  const filteredAndSortedAdmins = useMemo(() => {
    const q = String(searchQuery || "").trim().toLowerCase();

    const filtered = admins.filter((row) => {
      const matchesSearch =
        !q ||
        [row.firstName, row.lastName, row.mobile, row.email, row.status]
          .map((v) => String(v || "").toLowerCase())
          .some((v) => v.includes(q));

      const matchesStatus =
        statusFilter === "all" ||
        String(row.status || "").toLowerCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      const left = String(a?.[sortKey] || "").toLowerCase();
      const right = String(b?.[sortKey] || "").toLowerCase();
      const comparison = left.localeCompare(right, undefined, {
        numeric: true,
        sensitivity: "base",
      });

      return sortDir === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [admins, searchQuery, statusFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedAdmins.length / pageSize));

  const paginatedAdmins = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedAdmins.slice(start, start + pageSize);
  }, [filteredAndSortedAdmins, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const onSort = (key) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir("asc");
  };

  const sortIndicator = (key) => {
    if (sortKey !== key) return "";
    return sortDir === "asc" ? " ▲" : " ▼";
  };

  const getFieldError = (field, rawValue) => {
    const value = String(rawValue || "").trim();

    if (field === "firstName") return value ? "" : "First name is required";
    if (field === "lastName") return value ? "" : "Last name is required";

    if (field === "email") {
      if (!value) return "Email is required";
      return validators.email(value);
    }

    if (field === "mobile") {
      const digits = value.replace(/\D/g, "").slice(-10);
      if (!digits) return "Mobile number is required";
      return validators.mobile(digits);
    }

    if (field === "password") {
      if (!value) return "Password is required";
      return validators.password(value);
    }

    return "";
  };

  const handleAdminFormChange = (field, value) => {
    setAdminForm((prev) => {
      const next = { ...prev, [field]: value };
      setAdminErrors((prevErrors) => ({
        ...prevErrors,
        [field]: getFieldError(field, next[field]),
      }));
      return next;
    });
  };

  const openAdminModal = () => {
    setAdminCreateMessage(null);
    setAdminErrors({ firstName: "", lastName: "", email: "", mobile: "", password: "" });
    setShowAdminModal(true);
  };

  const closeAdminModal = () => {
    if (adminCreateBusy) return;
    setShowAdminModal(false);
  };

  const validateAdminForm = () => {
    const nextErrors = {
      firstName: "",
      lastName: "",
      email: "",
      mobile: "",
      password: "",
    };

    const firstName = String(adminForm.firstName || "").trim();
    const lastName = String(adminForm.lastName || "").trim();
    const email = String(adminForm.email || "").trim();
    const password = String(adminForm.password || "");
    const mobileDigits = String(adminForm.mobile || "").replace(/\D/g, "");
    const normalizedMobile = mobileDigits.slice(-10);

    if (!firstName) nextErrors.firstName = "First name is required";
    if (!lastName) nextErrors.lastName = "Last name is required";

    if (!email) {
      nextErrors.email = "Email is required";
    } else {
      const emailError = validators.email(email);
      if (emailError) nextErrors.email = emailError;
    }

    if (!normalizedMobile) {
      nextErrors.mobile = "Mobile number is required";
    } else {
      const mobileError = validators.mobile(normalizedMobile);
      if (mobileError) nextErrors.mobile = mobileError;
    }

    if (!password) {
      nextErrors.password = "Password is required";
    } else {
      const passwordError = validators.password(password);
      if (passwordError) nextErrors.password = passwordError;
    }

    setAdminErrors(nextErrors);
    return !Object.values(nextErrors).some(Boolean);
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();

    const isValid = validateAdminForm();
    if (!isValid) return;

    setAdminCreateBusy(true);
    setAdminCreateMessage(null);

    const result = await createAdminUser({
      firstName: String(adminForm.firstName || "").trim(),
      lastName: String(adminForm.lastName || "").trim(),
      email: String(adminForm.email || "").trim().toLowerCase(),
      mobile: String(adminForm.mobile || "").replace(/\D/g, "").slice(-10),
      password: String(adminForm.password || ""),
    });

    if (!result.success) {
      setAdminCreateMessage({ type: "error", text: result.message || "Unable to create admin user." });
      setAdminCreateBusy(false);
      return;
    }

    setAdminCreateBusy(false);
    setShowAdminModal(false);
    setAdminForm({ firstName: "", lastName: "", mobile: "", email: "", password: "" });
    setAdminErrors({ firstName: "", lastName: "", email: "", mobile: "", password: "" });
    await loadAdmins();
  };

  return (
    <div className="w-full">
       <div className="flex items-center justify-between bg-gradient-to-r from-[#1f2d3f] to-[#294a67]
                px-6 py-5 rounded-t-lg">
        <h1 className="text-2xl font-bold text-white"> LeanIn Admins</h1>
        <div className="flex items-center gap-3">
          <button type="button" onClick={loadAdmins}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100" >Refresh
          </button>
          <button type="button" onClick={() => setShowAdminModal(true)}
            className="rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600">
            Create Admin
          </button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4 pt-4">
        <input  type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search name, email, mobile" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" />

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}> {size} per page </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
            <tr>
              <th className="whitespace-nowrap bg-gradient-to-r from-[#1f2d3f] to-[#294a67]  text-center text-xs font-semibold text-white px-4 py-3">
                <button type="button" onClick={() => onSort("firstName")} className="font-semibold">
                  First Name{sortIndicator("firstName")}
                </button>
              </th>
              <th className="whitespace-nowrap bg-gradient-to-r from-[#1f2d3f] to-[#294a67]  text-center text-xs font-semibold text-white px-4 py-3">
                <button type="button" onClick={() => onSort("lastName")} className="font-semibold">
                  Last Name{sortIndicator("lastName")}
                </button>
              </th>
              <th className="whitespace-nowrap bg-gradient-to-r from-[#1f2d3f] to-[#294a67]  text-center text-xs font-semibold text-white px-4 py-3">
                <button type="button" onClick={() => onSort("mobile")} className="font-semibold">
                  Mobile{sortIndicator("mobile")}
                </button>
              </th>
              <th className="whitespace-nowrap bg-gradient-to-r from-[#1f2d3f] to-[#294a67]  text-center text-xs font-semibold text-white px-4 py-3">
                <button type="button" onClick={() => onSort("email")} className="font-semibold">
                  Email{sortIndicator("email")}
                </button>
              </th>
              <th className="whitespace-nowrap bg-gradient-to-r from-[#1f2d3f] to-[#294a67]  text-center text-xs font-semibold text-white px-4 py-3">
                <button type="button" onClick={() => onSort("status")} className="font-semibold">
                  Status{sortIndicator("status")}
                </button>
              </th>
              <th className="whitespace-nowrap bg-gradient-to-r from-[#1f2d3f] to-[#294a67]  text-center text-xs font-semibold text-white px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  Loading admins...
                </td>
              </tr>
            )}

            {!loading && filteredAndSortedAdmins.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No admins found.
                </td>
              </tr>
            )}

            {!loading &&
              paginatedAdmins.map((admin) => {
                const isEditing = editingId === admin.id;
                const isBusy = actionBusyId === admin.id;

                return (
                  <tr key={admin.id} className="border-t border-slate-100 even:bg-slate-50/40">
                    <td className="px-4 py-3 text-center">
                      {isEditing ? (
                        <input
                          value={editForm.firstName}
                          onChange={(e) =>
                            setEditForm((prev) => ({ ...prev, firstName: e.target.value }))
                          }
                          className="w-full rounded-md border border-slate-300 px-3 py-2"
                        />
                      ) : (
                        admin.firstName || "-"
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isEditing ? (
                        <input
                          value={editForm.lastName}
                          onChange={(e) =>
                            setEditForm((prev) => ({ ...prev, lastName: e.target.value }))
                          }
                          className="w-full rounded-md border border-slate-300 px-3 py-2"
                        />
                      ) : (
                        admin.lastName || "-"
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isEditing ? (
                        <input
                          value={editForm.mobile}
                          onChange={(e) =>
                            setEditForm((prev) => ({ ...prev, mobile: e.target.value }))
                          }
                          className="w-full rounded-md border border-slate-300 px-3 py-2"
                        />
                      ) : (
                        admin.mobile || "-"
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isEditing ? (
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) =>
                            setEditForm((prev) => ({ ...prev, email: e.target.value }))
                          }
                          className="w-full rounded-md border border-slate-300 px-3 py-2"
                        />
                      ) : (
                        admin.email || "-"
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isEditing ? (
                        <select
                          value={editForm.status}
                          onChange={(e) =>
                            setEditForm((prev) => ({ ...prev, status: e.target.value }))
                          }
                          className="w-full rounded-md border border-slate-300 px-3 py-2"
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${String(admin.status || "").toLowerCase() === "active"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-200 text-slate-700"
                            }`}
                        >
                          {admin.status || "Active"}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center gap-2 justify-center">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => saveEdit(admin.id)}
                              disabled={isBusy}
                              className="rounded-md border border-emerald-500 p-2 text-emerald-600 hover:bg-emerald-50 disabled:opacity-60"
                              title="Save"
                            >
                              <CheckIcon className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              disabled={isBusy}
                              className="rounded-md border border-slate-300 p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-60"
                              title="Cancel"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => beginEdit(admin)}
                              disabled={isBusy || editingId !== null}
                              className="rounded-md border border-blue-500 p-2 text-blue-600 hover:bg-blue-50 disabled:opacity-60"
                              title="Edit"
                            >
                              <PencilSquareIcon className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                removeAdmin(
                                  admin.id,
                                  `${admin.firstName || ""} ${admin.lastName || ""}`.trim() ||
                                  admin.email ||
                                  "this admin"
                                )
                              }
                              disabled={isBusy || editingId !== null}
                              className="rounded-md border border-red-500 p-2 text-red-600 hover:bg-red-50 disabled:opacity-60"
                              title="Delete"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          Showing {filteredAndSortedAdmins.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
          -
          {Math.min(currentPage * pageSize, filteredAndSortedAdmins.length)} of {filteredAndSortedAdmins.length}
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>

          <span className="text-sm text-slate-700">
            Page {currentPage} / {totalPages}
          </span>

          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-700/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-white/20 bg-gradient-to-br from-[#334a80] via-[#3d5fa3] to-[#2a3d66] p-8 shadow-2xl">
            <h2 className="mb-2 text-center text-2xl font-serif text-yellow-300">Create Admin Account</h2>
            <p className="mb-6 text-center text-sm text-white/80">Only admins can add new admin accounts.</p>

            {adminCreateMessage && (
              <div
                className={`mb-3 mt-3 rounded-lg px-3 py-2 text-sm ${adminCreateMessage.type === "error"
                  ? "border border-red-300/70 bg-red-900/20 text-red-100"
                  : "border border-emerald-300/70 bg-emerald-900/20 text-emerald-100"}`}
              >
                {adminCreateMessage.text}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleCreateAdmin}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-yellow-400" />
                  <FormInput
                    type="text"
                    name="firstName"
                    placeholder="First Name"
                    value={adminForm.firstName}
                    onChange={(e) => handleAdminFormChange("firstName", e.target.value)}
                    error={adminErrors.firstName}
                    showErrorInPlaceholder={true}
                  />
                </div>

                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-yellow-400" />
                  <FormInput
                    type="text"
                    name="lastName"
                    placeholder="Last Name"
                    value={adminForm.lastName}
                    onChange={(e) => handleAdminFormChange("lastName", e.target.value)}
                    error={adminErrors.lastName}
                    showErrorInPlaceholder={true}
                  />
                </div>
              </div>

              <div className="relative">
                <EnvelopeIcon className="absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-yellow-400" />
                <FormInput
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={adminForm.email}
                  onChange={(e) => handleAdminFormChange("email", e.target.value)}
                  error={adminErrors.email}
                  showErrorInPlaceholder={true}
                />
              </div>

              <div className="relative">
                <PhoneIcon className="absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-yellow-400" />
                <FormInput
                  type="tel"
                  name="mobile"
                  placeholder="Mobile Number"
                  value={adminForm.mobile}
                  onChange={(e) => handleAdminFormChange("mobile", e.target.value)}
                  error={adminErrors.mobile}
                  showErrorInPlaceholder={true}
                />
              </div>

              <div className="relative">
                <LockClosedIcon className="absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-yellow-400" />
                <FormInput
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={adminForm.password}
                  onChange={(e) => handleAdminFormChange("password", e.target.value)}
                  error={adminErrors.password}
                  showErrorInPlaceholder={true}
                />
              </div>

              <div className="flex justify-center gap-4 pt-2">
                <button
                  type="button"
                  className="rounded-lg bg-gray-500 px-6 py-2 text-white disabled:opacity-70"
                  onClick={closeAdminModal}
                  disabled={adminCreateBusy}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-b from-yellow-300 to-yellow-400 px-6 py-2 font-semibold text-black disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={adminCreateBusy}
                >
                  <RocketLaunchIcon className="h-5 w-5" />
                  {adminCreateBusy ? "Creating..." : "Register Here"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admins;