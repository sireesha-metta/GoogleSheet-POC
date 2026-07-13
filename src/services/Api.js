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
