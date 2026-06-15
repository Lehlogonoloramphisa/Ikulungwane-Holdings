const SETUP_ENDPOINT = import.meta.env?.VITE_SETUP_ENDPOINT || "/api/setup.php";

const parseJsonResponse = async (response) => {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    const error = new Error("Setup API did not return JSON. On local Vite, PHP endpoints will not run; test setup on cPanel/PHP hosting.");
    error.status = response.status;
    error.unavailable = true;
    throw error;
  }
};

const setupRequest = async (action, { method = "GET", body } = {}) => {
  const response = await fetch(`${SETUP_ENDPOINT}?action=${encodeURIComponent(action)}`, {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    const error = new Error(data.error || "Setup request failed.");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

export const getSetupStatus = async () => {
  try {
    return await setupRequest("status");
  } catch (error) {
    if (error.unavailable || error instanceof TypeError) {
      return {
        available: false,
        installed: false,
        canReopenSetup: false,
        message: error.message || "Setup API is not available.",
      };
    }
    throw error;
  }
};

export const getSetupRequirements = async () => setupRequest("requirements");

export const testDatabaseConnection = async (database) =>
  setupRequest("test-database", {
    method: "POST",
    body: { database },
  });

export const installSystem = async (payload) =>
  setupRequest("install", {
    method: "POST",
    body: payload,
  });
