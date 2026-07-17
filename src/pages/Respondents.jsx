// const Respondents = () => {
//   return (
//     <div>
//       <h1 className="text-3xl font-bold">Respondents</h1>
//     </div>
//   );
// };

// export default Respondents;



import { useEffect, useMemo, useState } from "react";
import { PencilSquareIcon,TrashIcon,CheckIcon,XMarkIcon,UserIcon,PhoneIcon,EnvelopeIcon,LockClosedIcon,QuestionMarkCircleIcon,
  EyeIcon,EyeSlashIcon,RocketLaunchIcon,} from "@heroicons/react/24/outline";
import { createRespondent, deleteRespondent, getRespondents, updateRespondent } from "../services/Api";
import { getUserRole } from "../utils/auth";
import { validators } from "../utils/validation";
import { INITIAL_REGISTER_ERRORS, INITIAL_REGISTER_FORM } from "../types/register.types";
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

const Respondents = () => {
  const isAdmin = getUserRole() === "admin";
  const [respondents, setRespondents] = useState([]);
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState(INITIAL_REGISTER_FORM);
  const [createErrors, setCreateErrors] = useState(INITIAL_REGISTER_ERRORS);
  const [createBusy, setCreateBusy] = useState(false);
  const [showCreatePassword, setShowCreatePassword] = useState(false);

  const loadRespondents = async () => {
    setLoading(true);
    setError("");

    const result = await getRespondents();
    if (!result.success) {
      setError(result.message || "Unable to load respondents.");
      setRespondents([]);
      setLoading(false);
      return;
    }

    setRespondents(Array.isArray(result.data) ? result.data : []);
    setLoading(false);
  };

  useEffect(() => {
    loadRespondents();
  }, []);

  const beginEdit = (respondent) => {
    setEditingId(respondent.id);
    setEditForm({
      firstName: respondent.firstName || "",
      lastName: respondent.lastName || "",
      mobile: respondent.mobile || "",
      email: respondent.email || "",
      status: respondent.status || "Active",
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

    const result = await updateRespondent(id, payload);

    if (!result.success) {
      setError(result.message || "Unable to update respondent.");
      setActionBusyId(null);
      return;
    }

    setRespondents((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...payload } : row))
    );

    setActionBusyId(null);
    cancelEdit();
  };

  const removeRespondent = async (id, fullName) => {
    const ok = window.confirm(`Delete respondent ${fullName}?`);
    if (!ok) return;

    setActionBusyId(id);
    setError("");

    const result = await deleteRespondent(id);
    if (!result.success) {
      setError(result.message || "Unable to delete respondent.");
      setActionBusyId(null);
      return;
    }

    setRespondents((prev) => prev.filter((row) => row.id !== id));
    setActionBusyId(null);
  };

  const filteredAndSortedRespondents = useMemo(() => {
    const q = String(searchQuery || "").trim().toLowerCase();

    const filtered = respondents.filter((row) => {
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
  }, [respondents, searchQuery, statusFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedRespondents.length / pageSize));

  const paginatedRespondents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedRespondents.slice(start, start + pageSize);
  }, [filteredAndSortedRespondents, currentPage, pageSize]);

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

  const validateCreateForm = (form) => {
    const nextErrors = {
      firstName: "",
      lastName: "",
      mobile: "",
      email: "",
      password: "",
      confirmPassword: "",
    };

    if (!String(form.firstName || "").trim()) {
      nextErrors.firstName = "First Name is required";
    }

    if (!String(form.lastName || "").trim()) {
      nextErrors.lastName = "Last Name is required";
    }

    const email = String(form.email || "").trim();
    if (!email) {
      nextErrors.email = "Email is required";
    } else {
      const emailError = validators.email(email);
      if (emailError) nextErrors.email = emailError;
    }

    // const mobile = String(form.mobile || "").trim().replace(/\D/g, "").slice(-10);
    // if (!mobile) {
    //   nextErrors.mobile = "Mobile Number is required";
    // } else {
    //   const mobileError = validators.mobile(mobile);
    //   if (mobileError) nextErrors.mobile = mobileError;
    // }

    const password = String(form.password || "");
    if (!password) {
      nextErrors.password = "Password is required";
    } else {
      const passwordError = validators.password(password);
      if (passwordError) nextErrors.password = passwordError;
    }

    if (!String(form.confirmPassword || "")) {
      nextErrors.confirmPassword = "Confirm Password is required";
    } else if (String(form.confirmPassword) !== password) {
      nextErrors.confirmPassword = "Passwords do not match";
    }

    setCreateErrors(nextErrors);
    return !Object.values(nextErrors).some(Boolean);
  };

  const handleCreateChange = (e) => {
    const { name, value } = e.target;
    setCreateForm((prev) => ({ ...prev, [name]: value }));
    setCreateErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const closeCreateModal = () => {
    if (createBusy) return;
    setShowCreateModal(false);
    setCreateForm(INITIAL_REGISTER_FORM);
    setCreateErrors(INITIAL_REGISTER_ERRORS);
    setShowCreatePassword(false);
  };

  const handleCreateRespondent = async () => {
    if (!isAdmin) {
      setError("Only admin can create respondents.");
      return;
    }

    const isValid = validateCreateForm(createForm);
    if (!isValid) return;

    setCreateBusy(true);
    setError("");

    const payload = {
      ...createForm,
      firstName: String(createForm.firstName || "").trim(),
      lastName: String(createForm.lastName || "").trim(),
      email: String(createForm.email || "").trim().toLowerCase(),
      mobile: String(createForm.mobile || "").trim().replace(/\D/g, "").slice(-10),
    };

    const result = await createRespondent(payload);
    if (!result.success) {
      setCreateBusy(false);
      setError(result.message || "Unable to create respondent.");
      return;
    }

    setCreateBusy(false);
    closeCreateModal();
    await loadRespondents();
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between bg-gradient-to-r from-[#1f2d3f] to-[#294a67] px-6 py-5 rounded-t-lg">
        <h1 className="text-2xl font-bold text-white"> LeanIn Respondents </h1>
        <div className="flex items-center gap-3">
          <button type="button"   onClick={loadRespondents}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100" >Refresh
          </button>
          <button
            type="button"
            onClick={() => {
              if (!isAdmin) {
                setError("Only admin can create respondents.");
                return;
              }
              setShowCreateModal(true);
            }}
            disabled={!isAdmin}
            className="rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Create Respondent
          </button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4 pt-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search name, email, mobile"
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        {/* <select value={sortKey}  onChange={(e) => onSort(e.target.value)}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" >
          {Object.entries(SORT_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              Sort: {label}
            </option>
          ))}
        </select> */}

        <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size} per page
            </option>
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
              <th className="whitespace-nowrap bg-gradient-to-r from-[#1f2d3f] to-[#294a67] text-center text-xs font-semibold text-white px-4 py-3">
                <button type="button" onClick={() => onSort("lastName")} className="font-semibold">
                  Last Name{sortIndicator("lastName")}
                </button>
              </th>
              {/* <th className="whitespace-nowrap bg-gradient-to-r from-[#1f2d3f] to-[#294a67] text-center text-xs font-semibold text-white px-4 py-3">
                <button type="button" onClick={() => onSort("mobile")} className="font-semibold">
                  Mobile{sortIndicator("mobile")}
                </button>
              </th> */}
              <th className="whitespace-nowrap bg-gradient-to-r from-[#1f2d3f] to-[#294a67] text-center text-xs font-semibold text-white px-4 py-3">
                <button type="button" onClick={() => onSort("email")} className="font-semibold">
                  Email{sortIndicator("email")}
                </button>
              </th>
              <th className="whitespace-nowrap bg-gradient-to-r from-[#1f2d3f] to-[#294a67] text-center text-xs font-semibold text-white px-4 py-3">
                <button type="button" onClick={() => onSort("status")} className="font-semibold">
                  Status{sortIndicator("status")}
                </button>
              </th>
              <th className="whitespace-nowrap bg-gradient-to-r from-[#1f2d3f] to-[#294a67] text-center text-xs font-semibold text-white px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  Loading Respondents...
                </td>
              </tr>
            )}

            {!loading && filteredAndSortedRespondents.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No respondents found.
                </td>
              </tr>
            )}

            {!loading &&
              paginatedRespondents.map((respondent) => {
                const isEditing = editingId === respondent.id;
                const isBusy = actionBusyId === respondent.id;

                return (
                  <tr key={respondent.id} className="border-t border-slate-100 even:bg-slate-50/40">
                    <td className="text-center  px-4 py-3">
                      {isEditing ? (
                        <input
                          value={editForm.firstName}
                          onChange={(e) =>
                            setEditForm((prev) => ({ ...prev, firstName: e.target.value }))
                          }
                          className="w-full rounded-md border border-slate-300 px-3 py-2"
                        />
                      ) : (
                        respondent.firstName || "-"
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
                        respondent.lastName || "-"
                      )}
                    </td>
                    {/* <td className="px-4 py-3 text-center">
                      {isEditing ? (
                        <input
                          value={editForm.mobile}
                          onChange={(e) =>
                            setEditForm((prev) => ({ ...prev, mobile: e.target.value }))
                          }
                          className="w-full rounded-md border border-slate-300 px-3 py-2"
                        />
                      ) : (
                        respondent.mobile || "-"
                      )}
                    </td> */}
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
                        respondent.email || "-"
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
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${String(respondent.status || "").toLowerCase() === "active"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-200 text-slate-700"
                            }`}
                        >
                          {respondent.status || "Active"}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center gap-2 justify-center">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => saveEdit(respondent.id)}
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
                              onClick={() => beginEdit(respondent)}
                              disabled={isBusy || editingId !== null}
                              className="rounded-md border border-blue-500 p-2 text-blue-600 hover:bg-blue-50 disabled:opacity-60"
                              title="Edit"
                            >
                              <PencilSquareIcon className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                removeRespondent(
                                  respondent.id,
                                  `${respondent.firstName || ""} ${respondent.lastName || ""}`.trim() ||
                                  respondent.email ||
                                  "this respondent"
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
          Showing {filteredAndSortedRespondents.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
          -
          {Math.min(currentPage * pageSize, filteredAndSortedRespondents.length)} of {filteredAndSortedRespondents.length}
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

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-700/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-white/20 bg-gradient-to-br from-[#334a80] via-[#3d5fa3] to-[#2a3d66] p-8 shadow-2xl">
            <h2 className="text-center text-2xl font-serif text-yellow-300 mb-6">
              Create Your Leadership Assessment Account
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-yellow-400 z-10" />
                  <FormInput
                    type="text"
                    name="firstName"
                    placeholder="First Name"
                    value={createForm.firstName}
                    onChange={handleCreateChange}
                    error={createErrors.firstName}
                    showErrorInPlaceholder={true}
                  />
                </div>

                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-yellow-400 z-10" />
                  <FormInput
                    type="text"
                    name="lastName"
                    placeholder="Last Name"
                    value={createForm.lastName}
                    onChange={handleCreateChange}
                    error={createErrors.lastName}
                    showErrorInPlaceholder={true}
                  />
                </div>
              </div>

              {/* <div className="relative">
                <PhoneIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-yellow-400 z-10" />
                <FormInput
                  type="tel"
                  name="mobile"
                  placeholder="Mobile Number"
                  value={createForm.mobile}
                  onChange={handleCreateChange}
                  error={createErrors.mobile}
                  showErrorInPlaceholder={true}
                />
              </div> */}

              <div className="relative">
                <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-yellow-400 z-10" />
                <FormInput
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={createForm.email}
                  onChange={handleCreateChange}
                  error={createErrors.email}
                  showErrorInPlaceholder={true}
                />
              </div>

              <div className="relative">
                <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-yellow-400 z-10" />
                <FormInput
                  type={showCreatePassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={createForm.password}
                  onChange={handleCreateChange}
                  error={createErrors.password}
                  showErrorInPlaceholder={true}
                />
                <button
                  type="button"
                  onClick={() => setShowCreatePassword((prev) => !prev)}
                  className="absolute right-10 top-1/2 -translate-y-1/2 text-white/95"
                >
                  {showCreatePassword ? <EyeSlashIcon className="h-6 w-6" /> : <EyeIcon className="h-6 w-6" />}
                </button>
              </div>

              <div className="relative">
                <QuestionMarkCircleIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-yellow-400 z-10" />
                <FormInput
                  type={showCreatePassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={createForm.confirmPassword}
                  onChange={handleCreateChange}
                  error={createErrors.confirmPassword}
                  showErrorInPlaceholder={true}
                />
                <button
                  type="button"
                  onClick={() => setShowCreatePassword((prev) => !prev)}
                  className="absolute right-10 top-1/2 -translate-y-1/2 text-white/95"
                >
                  {showCreatePassword ? <EyeSlashIcon className="h-6 w-6" /> : <EyeIcon className="h-6 w-6" />}
                </button>
              </div>
            </div>

            <div className="flex justify-center gap-4 pt-6">
              <button
                type="button"
                onClick={closeCreateModal}
                disabled={createBusy}
                className="px-6 py-2 rounded-lg bg-gray-500 text-white disabled:opacity-70"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleCreateRespondent}
                disabled={createBusy}
                className="inline-flex items-center gap-2 px-6 py-2 rounded-lg text-black font-semibold bg-gradient-to-b from-yellow-300 to-yellow-400 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <RocketLaunchIcon className="h-5 w-5" />
                {createBusy ? "Registering..." : "Register Here"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Respondents;