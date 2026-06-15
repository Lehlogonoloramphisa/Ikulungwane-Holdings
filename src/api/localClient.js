const DB_KEY = "ikulungwane_local_db";
const USERS_KEY = "ikulungwane_local_users";
const SESSION_KEY = "ikulungwane_local_session";
const RESET_KEY = "ikulungwane_local_resets";

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

const createEntityApi = (entityName) => ({
  async list(sortBy, limit) {
    const db = getDb();
    return clone(limitItems(sortItems(db[entityName], sortBy), limit));
  },

  async filter(criteria = {}, sortBy, limit) {
    const db = getDb();
    const filtered = db[entityName].filter((item) =>
      Object.entries(criteria).every(([key, value]) => item[key] === value)
    );
    return clone(limitItems(sortItems(filtered, sortBy), limit));
  },

  async create(data) {
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

          if (typeof FileReader === "undefined") {
            resolve({ file_url: "" });
            return;
          }

          const reader = new FileReader();
          reader.onload = () => resolve({ file_url: reader.result });
          reader.onerror = () => reject(new Error("Unable to read file"));
          reader.readAsDataURL(file);
        });
      },
    },
  },

  auth: {
    async me() {
      const user = getSessionUser();
      if (!user) {
        const error = new Error("Not signed in");
        error.status = 401;
        throw error;
      }

      return publicUser(user);
    },

    async loginViaEmailPassword(email, password) {
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
        role: users.length === 0 ? "admin" : "user",
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
          role: users.length === 0 ? "admin" : "user",
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
      writeJson(SESSION_KEY, null);
      const storage = getStorage();
      storage?.removeItem(SESSION_KEY);
      if (redirectUrl) {
        redirectTo("/");
      }
    },

    redirectToLogin(redirectUrl = "/") {
      const next = encodeURIComponent(redirectUrl);
      redirectTo(`/login?redirect=${next}`);
    },
  },
};
