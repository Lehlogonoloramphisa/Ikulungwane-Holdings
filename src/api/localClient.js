const DB_KEY = "ikulungwane_local_db";
const USERS_KEY = "ikulungwane_local_users";
const SESSION_KEY = "ikulungwane_local_session";
const RESET_KEY = "ikulungwane_local_resets";
const AUTH_ENDPOINT = "/api/auth.php";
const SETUP_ENDPOINT = "/api/setup.php";
const CONTENT_ENDPOINT = "/api/content.php";
const UPLOAD_ENDPOINT = "/api/upload.php";

const ENTITY_NAMES = [
  "BlogPost",
  "Booking",
  "ContactMessage",
  "PortfolioProject",
  "Service",
  "SiteSettings",
  "TeamMember",
  "Testimonial",
  "User",
];

const memoryStore = new Map();

const getStorage = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const testKey = "__ikulungwane_storage_test__";
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return window.localStorage;
  } catch {
    return null;
  }
};

const clone = (value) => JSON.parse(JSON.stringify(value));

const readJson = (key, fallback) => {
  if (memoryStore.has(key)) {
    return clone(memoryStore.get(key));
  }

  const storage = getStorage();
  if (!storage) {
    return clone(fallback);
  }

  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : clone(fallback);
  } catch {
    return clone(fallback);
  }
};

const writeJson = (key, value) => {
  const copy = clone(value);
  memoryStore.set(key, copy);

  const storage = getStorage();
  if (!storage) {
    return;
  }

  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // Large image data URLs can exceed browser quota. Keep the in-memory copy
    // so the current session still works.
  }
};

const createInitialDb = () =>
  ENTITY_NAMES.reduce((db, entityName) => {
    db[entityName] = [];
    return db;
  }, {});

const getDb = () => {
  const db = readJson(DB_KEY, null);
  if (!db) {
    const initialDb = createInitialDb();
    writeJson(DB_KEY, initialDb);
    return initialDb;
  }

  ENTITY_NAMES.forEach((entityName) => {
    if (!Array.isArray(db[entityName])) {
      db[entityName] = [];
    }
  });

  return db;
};

const saveDb = (db) => writeJson(DB_KEY, db);

const makeId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const compareValues = (left, right) => {
  if (left === right) return 0;
  if (left === undefined || left === null || left === "") return 1;
  if (right === undefined || right === null || right === "") return -1;
  if (typeof left === "number" && typeof right === "number") {
    return left - right;
  }
  return String(left).localeCompare(String(right), undefined, { numeric: true });
};

const sortItems = (items, sortBy) => {
  if (!sortBy) {
    return items;
  }

  const descending = sortBy.startsWith("-");
  const field = descending ? sortBy.slice(1) : sortBy;

  return [...items].sort((a, b) => {
    const result = compareValues(a[field], b[field]);
    return descending ? -result : result;
  });
};

const limitItems = (items, limit) =>
  typeof limit === "number" ? items.slice(0, limit) : items;

const shouldUseLocalFallback = (error) =>
  error?.unavailable || error instanceof TypeError || [404, 503].includes(Number(error?.status));

const createEntityApi = (entityName) => ({
  async list(sortBy, limit) {
    try {
      const result = await contentEntityRequest("list", entityName, { sortBy, limit });
      if (Array.isArray(result.items)) return result.items;
    } catch (error) {
      if (!shouldUseLocalFallback(error)) throw error;
    }

    const db = getDb();
    return clone(limitItems(sortItems(db[entityName], sortBy), limit));
  },

  async filter(criteria = {}, sortBy, limit) {
    try {
      const result = await contentEntityRequest("filter", entityName, { criteria, sortBy, limit });
      if (Array.isArray(result.items)) return result.items;
    } catch (error) {
      if (!shouldUseLocalFallback(error)) throw error;
    }

    const db = getDb();
    const filtered = db[entityName].filter((item) =>
      Object.entries(criteria).every(([key, value]) => item[key] === value)
    );
    return clone(limitItems(sortItems(filtered, sortBy), limit));
  },

  async create(data) {
    try {
      const result = await contentEntityRequest("create", entityName, { data });
      if (result.item) return result.item;
    } catch (error) {
      if (!shouldUseLocalFallback(error)) throw error;
    }

    const db = getDb();
    const now = new Date().toISOString();
    const item = {
      ...data,
      id: data.id || makeId(),
      created_date: data.created_date || now,
      updated_date: now,
    };

    db[entityName] = [item, ...db[entityName]];
    saveDb(db);
    return clone(item);
  },

  async update(id, data) {
    try {
      const result = await contentEntityRequest("update", entityName, { id, data });
      if (result.item) return result.item;
    } catch (error) {
      if (!shouldUseLocalFallback(error)) throw error;
    }

    const db = getDb();
    const index = db[entityName].findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error(`${entityName} item was not found`);
    }

    const nextItem = {
      ...db[entityName][index],
      ...data,
      id,
      created_date: db[entityName][index].created_date,
      updated_date: new Date().toISOString(),
    };

    db[entityName][index] = nextItem;
    saveDb(db);
    return clone(nextItem);
  },

  async delete(id) {
    try {
      const result = await contentEntityRequest("delete", entityName, { id });
      if (result.success) return result;
    } catch (error) {
      if (!shouldUseLocalFallback(error)) throw error;
    }

    const db = getDb();
    db[entityName] = db[entityName].filter((item) => item.id !== id);
    saveDb(db);
    return { success: true };
  },
});

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const publicUser = (user) => {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
};

const getUsers = () => readJson(USERS_KEY, []);
const saveUsers = (users) => writeJson(USERS_KEY, users);

const createSession = (userId) => {
  const session = {
    token: makeId(),
    userId,
    created_date: new Date().toISOString(),
  };
  writeJson(SESSION_KEY, session);
  return session.token;
};

const getSessionUser = () => {
  const session = readJson(SESSION_KEY, null);
  if (!session?.userId) {
    return null;
  }

  return getUsers().find((user) => user.id === session.userId) || null;
};

const redirectTo = (url) => {
  if (typeof window !== "undefined" && url) {
    window.location.href = url;
  }
};

const parseApiJson = async (response) => {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    const error = new Error("Backend API is not available");
    error.unavailable = true;
    error.status = response.status;
    throw error;
  }
};

const backendRequest = async (endpoint, action, { method = "GET", body } = {}) => {
  const response = await fetch(`${endpoint}?action=${encodeURIComponent(action)}`, {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await parseApiJson(response);

  if (!response.ok) {
    const error = new Error(data.error || "Backend request failed");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

const getBackendInstallStatus = async () => {
  try {
    return await backendRequest(SETUP_ENDPOINT, "status");
  } catch (error) {
    if (error.unavailable || error instanceof TypeError) {
      return { available: false, installed: false };
    }
    throw error;
  }
};

const backendAuth = async (action, body) =>
  backendRequest(AUTH_ENDPOINT, action, {
    method: body ? "POST" : "GET",
    body,
  });

function contentEntityRequest(action, entity, payload = {}) {
  return backendRequest(CONTENT_ENDPOINT, action, {
    method: "POST",
    body: { entity, ...payload },
  });
}

const uploadToBackend = async (file) => {
  const body = new FormData();
  body.append("file", file);

  const response = await fetch(UPLOAD_ENDPOINT, {
    method: "POST",
    credentials: "include",
    body,
  });
  const data = await parseApiJson(response);

  if (!response.ok) {
    const error = new Error(data.error || "Upload failed");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

export const localApi = {
  entities: ENTITY_NAMES.reduce((entities, entityName) => {
    entities[entityName] = createEntityApi(entityName);
    return entities;
  }, {}),

  integrations: {
    Core: {
      UploadFile({ file }) {
        return new Promise((resolve, reject) => {
          if (!file) {
            reject(new Error("No file selected"));
            return;
          }

          uploadToBackend(file)
            .then(resolve)
            .catch((error) => {
              if (!shouldUseLocalFallback(error)) {
                reject(error);
                return;
              }

              if (typeof FileReader === "undefined") {
                resolve({ file_url: "" });
                return;
              }

              const reader = new FileReader();
              reader.onload = () => resolve({ file_url: reader.result });
              reader.onerror = () => reject(new Error("Unable to read file"));
              reader.readAsDataURL(file);
            });
        });
      },
    },
  },

  auth: {
    async me() {
      try {
        const result = await backendAuth("me");
        if (result.user) return result.user;
      } catch (error) {
        if (!error.unavailable && error.status === 401) {
          throw error;
        }
      }

      const user = getSessionUser();
      if (!user) {
        const error = new Error("Not signed in");
        error.status = 401;
        throw error;
      }

      return publicUser(user);
    },

    async loginViaEmailPassword(email, password) {
      try {
        const result = await backendAuth("login", { email, password });
        if (result.user) return result.user;
      } catch (error) {
        if (!error.unavailable && error.status) {
          throw error;
        }
      }

      const normalizedEmail = normalizeEmail(email);
      const user = getUsers().find(
        (item) => item.email === normalizedEmail && item.password === password
      );

      if (!user) {
        throw new Error("Invalid email or password");
      }

      createSession(user.id);
      return publicUser(user);
    },

    async hasAdminAccount() {
      try {
        const status = await getBackendInstallStatus();
        if (status.available) return Boolean(status.installed);
      } catch {
        // Fall back to local development storage.
      }

      return getUsers().some((user) => ["admin", "super_admin"].includes(user.role));
    },

    async createAdminAccount({ email, password, full_name }) {
      const normalizedEmail = normalizeEmail(email);
      if (!normalizedEmail) {
        throw new Error("Enter an admin email address");
      }

      if (!password || password.length < 8) {
        throw new Error("Use at least 8 characters for the admin password");
      }

      const users = getUsers();
      if (users.some((user) => ["admin", "super_admin"].includes(user.role))) {
        throw new Error("An admin account already exists. Log in instead.");
      }

      const now = new Date().toISOString();
      const existingIndex = users.findIndex((user) => user.email === normalizedEmail);
      const adminUser = existingIndex >= 0
        ? {
            ...users[existingIndex],
            email: normalizedEmail,
            password,
            full_name: full_name || users[existingIndex].full_name || "Studio Owner",
            role: "admin",
            verified: true,
            updated_date: now,
          }
        : {
            id: makeId(),
            email: normalizedEmail,
            password,
            full_name: full_name || "Studio Owner",
            role: "admin",
            verified: true,
            created_date: now,
            updated_date: now,
          };

      const nextUsers = existingIndex >= 0
        ? users.map((user, index) => (index === existingIndex ? adminUser : user))
        : [...users, adminUser];

      saveUsers(nextUsers);
      createSession(adminUser.id);
      return publicUser(adminUser);
    },

    async register({ email, password }) {
      const normalizedEmail = normalizeEmail(email);
      const users = getUsers();

      if (users.some((user) => user.email === normalizedEmail)) {
        throw new Error("An account with this email already exists");
      }

      const now = new Date().toISOString();
      const user = {
        id: makeId(),
        email: normalizedEmail,
        password,
        full_name: normalizedEmail.split("@")[0],
        role: "user",
        verified: false,
        created_date: now,
        updated_date: now,
      };

      saveUsers([...users, user]);
      return publicUser(user);
    },

    async verifyOtp({ email, otpCode }) {
      if (!otpCode || otpCode.length < 6) {
        throw new Error("Enter the 6 digit verification code");
      }

      const normalizedEmail = normalizeEmail(email);
      const users = getUsers();
      const user = users.find((item) => item.email === normalizedEmail);
      if (!user) {
        throw new Error("Account not found");
      }

      const verifiedUser = {
        ...user,
        verified: true,
        updated_date: new Date().toISOString(),
      };
      saveUsers(users.map((item) => (item.id === user.id ? verifiedUser : item)));

      return {
        access_token: createSession(user.id),
        user: publicUser(verifiedUser),
      };
    },

    setToken(token) {
      const session = readJson(SESSION_KEY, null);
      if (session) return;
      writeJson(SESSION_KEY, { token, created_date: new Date().toISOString() });
    },

    async resendOtp() {
      return { success: true };
    },

    async resetPasswordRequest(email) {
      const normalizedEmail = normalizeEmail(email);
      const user = getUsers().find((item) => item.email === normalizedEmail);
      if (user) {
        const resets = readJson(RESET_KEY, {});
        resets[makeId()] = user.id;
        writeJson(RESET_KEY, resets);
      }
      return { success: true };
    },

    async resetPassword({ resetToken, newPassword }) {
      const resets = readJson(RESET_KEY, {});
      const userId = resets[resetToken];
      if (!userId) {
        throw new Error("Invalid reset token");
      }

      const users = getUsers();
      saveUsers(
        users.map((user) =>
          user.id === userId
            ? { ...user, password: newPassword, updated_date: new Date().toISOString() }
            : user
        )
      );
      delete resets[resetToken];
      writeJson(RESET_KEY, resets);
      return { success: true };
    },

    loginWithProvider(provider, redirectUrl = "/") {
      const email = `${provider || "social"}@local.ikulungwane`;
      const users = getUsers();
      let user = users.find((item) => item.email === email);

      if (!user) {
        user = {
          id: makeId(),
          email,
          full_name: "Local Demo User",
          role: "user",
          verified: true,
          created_date: new Date().toISOString(),
          updated_date: new Date().toISOString(),
        };
        saveUsers([...users, user]);
      }

      createSession(user.id);
      redirectTo(redirectUrl);
    },

    logout(redirectUrl) {
      backendAuth("logout").catch(() => {});
      writeJson(SESSION_KEY, null);
      const storage = getStorage();
      storage?.removeItem(SESSION_KEY);
      if (redirectUrl) {
        redirectTo(redirectUrl);
      }
    },

    redirectToLogin(redirectUrl = "/") {
      const next = encodeURIComponent(redirectUrl);
      redirectTo(`/login?redirect=${next}`);
    },
  },
};
