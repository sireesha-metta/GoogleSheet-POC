import { authFetch } from "../utils/auth";

async function parseResponse(response) {
	const data = await response.json().catch(() => null);

	if (!response.ok || !data?.success) {
		return {
			success: false,
			message: data?.message || "Request failed.",
			data: data?.data || null,
		};
	}

	return {
		success: true,
		message: data?.message || "Success",
		data: data?.data ?? null,
	};
}

export async function getAdmins() {
	try {
		const response = await authFetch("/api/auth/admins", {
			method: "GET",
		});
		return parseResponse(response);
	} catch (error) {
		return {
			success: false,
			message: error.message || "Unable to fetch admins.",
			data: null,
		};
	}
}

export async function getRespondents() {
	try {
		const response = await authFetch("/api/auth/respondents", {
			method: "GET",
		});
		return parseResponse(response);
	} catch (error) {
		return {
			success: false,
			message: error.message || "Unable to fetch respondents.",
			data: null,
		};
	}
}

export async function createRespondent(payload) {
	try {
		const response = await authFetch("/api/auth/respondents", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(payload || {}),
		});

		return parseResponse(response);
	} catch (error) {
		return {
			success: false,
			message: error.message || "Unable to create respondent.",
			data: null,
		};
	}
}

export async function updateAdmin(id, payload) {
	try {
		const response = await authFetch(`/api/auth/admins/${id}`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(payload || {}),
		});

		return parseResponse(response);
	} catch (error) {
		return {
			success: false,
			message: error.message || "Unable to update admin.",
			data: null,
		};
	}
}

export async function updateRespondent(id, payload) {
	try {
		const response = await authFetch(`/api/auth/respondents/${id}`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(payload || {}),
		});

		return parseResponse(response);
	} catch (error) {
		return {
			success: false,
			message: error.message || "Unable to update respondent.",
			data: null,
		};
	}
}

export async function deleteAdmin(id) {
	try {
		const response = await authFetch(`/api/auth/admins/${id}`, {
			method: "DELETE",
		});

		return parseResponse(response);
	} catch (error) {
		return {
			success: false,
			message: error.message || "Unable to delete admin.",
			data: null,
		};
	}
}

export async function deleteRespondent(id) {
	try {
		const response = await authFetch(`/api/auth/respondents/${id}`, {
			method: "DELETE",
		});

		return parseResponse(response);
	} catch (error) {
		return {
			success: false,
			message: error.message || "Unable to delete respondent.",
			data: null,
		};
	}
}

export async function deleteSubmission(id) {
  try {
    const response = await authFetch(`/api/submissions/${id}`, {
      method: "DELETE",
    });

    return parseResponse(response);
  } catch (error) {
    return {
      success: false,
      message: error.message || "Unable to delete submission.",
      data: null,
    };
  }
}

export async function reactivateSubmission(id) {
  try {
    const response = await authFetch(`/api/submissions/${id}/reactivate`, {
      method: "PUT",
    });

    return parseResponse(response);
  } catch (error) {
    return {
      success: false,
      message: error.message || "Unable to reactivate submission.",
      data: null,
    };
  }
}

export async function downloadSubmissionsExcel() {
	try {
		const response = await authFetch("/api/admin/export/submissions", {
			method: "GET",
		});

		if (!response.ok) {
			return {
				success: false,
				message: "Unable to download submissions.",
				data: null,
			};
		}

		const blob = await response.blob();

		return {
			success: true,
			message: "Submissions downloaded.",
			data: blob,
		};
	} catch (error) {
		return {
			success: false,
			message: error.message || "Unable to download submissions.",
			data: null,
		};
	}
}

export async function downloadRespondentsExcel() {
	try {
		const response = await authFetch("/api/admin/export/respondents", {
			method: "GET",
		});

		if (!response.ok) {
			return {
				success: false,
				message: "Unable to download respondents.",
				data: null,
			};
		}

		const blob = await response.blob();

		return {
			success: true,
			message: "Respondents downloaded.",
			data: blob,
		};
	} catch (error) {
		return {
			success: false,
			message: error.message || "Unable to download respondents.",
			data: null,
		};
	}
}

export async function getSlotSettingsApi() {
	try {
		const response = await authFetch("/api/admin/slots/settings");
		const data = await response.json();
		return data;
	} catch (error) {
		return { success: false, message: error.message || "Failed to fetch slot settings." };
	}
}

export async function toggleSlotConfigApi(id, is_active) {
	try {
		const response = await authFetch("/api/admin/slots/config", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ id, is_active }),
		});
		return await response.json();
	} catch (error) {
		return { success: false, message: error.message || "Failed to update slot config." };
	}
}

export async function blockSlotApi(payload) {
	try {
		const response = await authFetch("/api/admin/slots/block", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});
		return await response.json();
	} catch (error) {
		return { success: false, message: error.message || "Failed to block slot." };
	}
}

export async function unblockSlotApi(id) {
	try {
		const response = await authFetch(`/api/admin/slots/block/${id}`, {
			method: "DELETE",
		});
		return await response.json();
	} catch (error) {
		return { success: false, message: error.message || "Failed to unblock slot." };
	}
}

export async function saveShiftApi(payload) {
	try {
		const response = await authFetch("/api/admin/shifts/config", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});
		return await response.json();
	} catch (error) {
		return { success: false, message: error.message || "Failed to save shift config." };
	}
}

export async function deleteShiftApi(id) {
	try {
		const response = await authFetch(`/api/admin/shifts/${id}`, {
			method: "DELETE",
		});
		return await response.json();
	} catch (error) {
		return { success: false, message: error.message || "Failed to delete shift config." };
	}
}
