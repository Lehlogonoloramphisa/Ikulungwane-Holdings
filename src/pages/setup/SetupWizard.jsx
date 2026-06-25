import { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Database,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Link2,
  Loader2,
  Lock,
  Mail,
  Phone,
  Server,
  ShieldCheck,
  Sparkles,
  Upload,
  UserRound,
  XCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  getSetupRequirements,
  getSetupStatus,
  installSystem,
  testDatabaseConnection,
} from "@/lib/setupApi";
import { normalizeMediaUrl } from "@/lib/media";

const STEP_ROUTES = {
  welcome: "/setup",
  database: "/setup/database",
  admin: "/setup/admin",
  site: "/setup/site",
  finish: "/setup/finish",
};

const WIZARD_STEPS = [
  { number: "01", label: "Welcome", route: STEP_ROUTES.welcome },
  { number: "02", label: "System Requirements", route: STEP_ROUTES.welcome },
  { number: "03", label: "Database Setup", route: STEP_ROUTES.database },
  { number: "04", label: "Admin Account", route: STEP_ROUTES.admin },
  { number: "05", label: "Website Settings", route: STEP_ROUTES.site },
  { number: "06", label: "Finish Installation", route: STEP_ROUTES.finish },
];

const requirementLabels = {
  php: "PHP 8.0 or newer",
  pdo: "PDO extension",
  pdo_mysql: "PDO MySQL driver",
  json: "JSON extension",
  sessions: "PHP sessions",
  config_writable: "Writable API config folder",
};

const defaultDatabase = {
  host: "localhost",
  port: "3306",
  name: "",
  username: "",
  password: "",
};

const defaultAdmin = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const defaultSite = {
  siteName: "Ikulungwane Holdings",
  logo: "",
  phone: "",
  email: "",
  address: "",
  whatsapp: "",
};

const getActiveStepIndex = (pathname, welcomeAccepted) => {
  if (pathname.startsWith(STEP_ROUTES.finish)) return 5;
  if (pathname.startsWith(STEP_ROUTES.site)) return 4;
  if (pathname.startsWith(STEP_ROUTES.admin)) return 3;
  if (pathname.startsWith(STEP_ROUTES.database)) return 2;
  return welcomeAccepted ? 1 : 0;
};

function SetupField({ label, value, onChange, type = "text", icon: Icon, placeholder, required = true, multiline = false, autoComplete = "off" }) {
  return (
    <div className="setup-field">
      <Label>{label}</Label>
      <div>
        {Icon && <Icon className="h-4 w-4" />}
        {multiline ? (
          <Textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} />
        ) : (
          <Input
            type={type}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            required={required}
            autoComplete={autoComplete}
          />
        )}
      </div>
    </div>
  );
}

function SetupButton({ children, variant = "primary", ...props }) {
  return (
    <button type="button" className={`setup-button is-${variant}`} {...props}>
      {children}
    </button>
  );
}

export default function SetupWizard({ installStatus }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState(installStatus || { loading: true, available: false, installed: false });
  const [welcomeAccepted, setWelcomeAccepted] = useState(false);
  const [requirements, setRequirements] = useState(null);
  const [requirementsLoading, setRequirementsLoading] = useState(false);
  const [database, setDatabase] = useState(defaultDatabase);
  const [dbTest, setDbTest] = useState({ tested: false, ok: false, message: "" });
  const [dbTesting, setDbTesting] = useState(false);
  const [admin, setAdmin] = useState(defaultAdmin);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [site, setSite] = useState(defaultSite);
  const [logoUrl, setLogoUrl] = useState("");
  const [installing, setInstalling] = useState(false);
  const [installError, setInstallError] = useState("");

  const activeStepIndex = getActiveStepIndex(location.pathname, welcomeAccepted);
  const activeStep = WIZARD_STEPS[activeStepIndex];
  const canReopen = Boolean(status.canReopenSetup && new URLSearchParams(location.search).get("reopen") === "1");
  const requirementsPassed = requirements?.items?.every((item) => item.ok || !item.required);
  const adminValid = admin.fullName.trim() && admin.email.trim() && admin.password.length >= 8 && admin.password === admin.confirmPassword;
  const siteValid = site.siteName.trim() && site.email.trim();
  const previewLogo = normalizeMediaUrl(site.logo);

  useEffect(() => {
    let mounted = true;

    getSetupStatus()
      .then((nextStatus) => {
        if (mounted) setStatus({ loading: false, ...nextStatus });
      })
      .catch(() => {
        if (mounted) setStatus({ loading: false, available: false, installed: false });
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (activeStepIndex === 1 && !requirements && !requirementsLoading) {
      setRequirementsLoading(true);
      getSetupRequirements()
        .then(setRequirements)
        .catch((error) => {
          setRequirements({
            available: false,
            items: [],
            message: error.message || "Unable to check system requirements.",
          });
        })
        .finally(() => setRequirementsLoading(false));
    }
  }, [activeStepIndex, requirements, requirementsLoading]);

  const updateDatabase = (key, value) => {
    setDatabase((current) => ({ ...current, [key]: value }));
    setDbTest({ tested: false, ok: false, message: "" });
  };

  const updateAdmin = (key, value) => setAdmin((current) => ({ ...current, [key]: value }));
  const updateSite = (key, value) => setSite((current) => ({ ...current, [key]: value }));

  const handleLogoUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateSite("logo", reader.result || "");
    reader.readAsDataURL(file);
  };

  const handleLogoUrl = () => {
    const nextLogo = normalizeMediaUrl(logoUrl);
    if (!nextLogo) return;
    updateSite("logo", nextLogo);
    setLogoUrl("");
  };

  const handleDatabaseTest = async () => {
    setDbTesting(true);
    setDbTest({ tested: false, ok: false, message: "" });

    try {
      const result = await testDatabaseConnection(database);
      setDbTest({ tested: true, ok: true, message: result.message || "Database connection successful." });
    } catch (error) {
      setDbTest({ tested: true, ok: false, message: error.message || "Database connection failed." });
    } finally {
      setDbTesting(false);
    }
  };

  const handleInstall = async () => {
    setInstalling(true);
    setInstallError("");

    try {
      await installSystem({
        database,
        admin: {
          full_name: admin.fullName,
          email: admin.email,
          password: admin.password,
        },
        site,
      });
      navigate("/admin/login", { replace: true });
    } catch (error) {
      setInstallError(error.message || "Installation failed.");
    } finally {
      setInstalling(false);
    }
  };

  const maskedDatabaseSummary = useMemo(() => ({
    Host: database.host,
    Port: database.port,
    Database: database.name,
    Username: database.username,
    Password: database.password ? "Saved securely on the server" : "Missing",
  }), [database]);

  if (!status.loading && status.available && status.installed && !canReopen) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <main className="setup-shell">
      <section className="setup-frame">
        <aside className="setup-rail">
          <div className="setup-brand">
            <span>IK</span>
            <div>
              <strong>Ikulungwane Installer</strong>
              <p>Secure cPanel setup wizard</p>
            </div>
          </div>

          <div className="setup-step-list">
            {WIZARD_STEPS.map((step, index) => (
              <button
                key={`${step.number}-${step.label}`}
                type="button"
                className={index === activeStepIndex ? "is-active" : index < activeStepIndex ? "is-complete" : ""}
                disabled={index > activeStepIndex}
              >
                <span>{step.number}</span>
                <strong>{step.label}</strong>
              </button>
            ))}
          </div>
        </aside>

        <section className="setup-panel">
          <div className="setup-panel-heading">
            <p className="admin-eyebrow">Step {activeStep.number}</p>
            <h1>{activeStep.label}</h1>
          </div>

          {activeStepIndex === 0 && (
            <div className="setup-copy">
              <Sparkles className="setup-hero-icon" />
              <h2>Install the system properly before opening admin.</h2>
              <p>
                This wizard will test the server, connect to your cPanel MySQL database, create the required tables, create the first super admin, save the website settings, and lock setup after installation.
              </p>
              {!status.available && (
                <div className="setup-alert is-warning">
                  The setup backend is not running in this environment. Upload the built site to cPanel/PHP hosting to complete installation.
                </div>
              )}
              <SetupButton onClick={() => setWelcomeAccepted(true)}>
                Check Requirements
                <ArrowRight className="h-4 w-4" />
              </SetupButton>
            </div>
          )}

          {activeStepIndex === 1 && (
            <div className="setup-copy">
              <Server className="setup-hero-icon" />
              <h2>Server requirements</h2>
              <p>The installer needs PHP, PDO MySQL, sessions, JSON support, and a writable API config folder.</p>

              <div className="setup-requirements">
                {requirementsLoading ? (
                  <div className="setup-loading-row">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Checking server requirements
                  </div>
                ) : requirements?.items?.length ? (
                  requirements.items.map((item) => (
                    <div key={item.key} className={item.ok ? "is-ok" : "is-fail"}>
                      {item.ok ? <CheckCircle2 /> : <XCircle />}
                      <span>{requirementLabels[item.key] || item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                  ))
                ) : (
                  <div className="setup-alert is-warning">
                    {requirements?.message || "Unable to read requirements. This is expected on the local Vite server because PHP does not run there."}
                  </div>
                )}
              </div>

              <div className="setup-actions">
                <SetupButton variant="ghost" onClick={() => setWelcomeAccepted(false)}>
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </SetupButton>
                <SetupButton onClick={() => navigate(STEP_ROUTES.database)} disabled={requirements?.items?.length && !requirementsPassed}>
                  Database Setup
                  <ArrowRight className="h-4 w-4" />
                </SetupButton>
              </div>
            </div>
          )}

          {activeStepIndex === 2 && (
            <div className="setup-form-section">
              <div className="setup-form-grid">
                <SetupField label="Database host" icon={Server} value={database.host} onChange={(value) => updateDatabase("host", value)} placeholder="localhost" />
                <SetupField label="Database port" icon={Database} value={database.port} onChange={(value) => updateDatabase("port", value)} placeholder="3306" />
                <SetupField label="Database name" icon={Database} value={database.name} onChange={(value) => updateDatabase("name", value)} placeholder="cpaneluser_database" />
                <SetupField label="Database username" icon={UserRound} value={database.username} onChange={(value) => updateDatabase("username", value)} placeholder="cpaneluser_dbuser" />
                <SetupField label="Database password" icon={Lock} type="password" value={database.password} onChange={(value) => updateDatabase("password", value)} placeholder="Database password" />
              </div>

              {dbTest.tested && (
                <div className={`setup-alert ${dbTest.ok ? "is-success" : "is-error"}`}>
                  {dbTest.message}
                </div>
              )}

              <div className="setup-actions">
                <SetupButton variant="ghost" onClick={() => navigate(STEP_ROUTES.welcome)}>
                  <ArrowLeft className="h-4 w-4" />
                  Requirements
                </SetupButton>
                <SetupButton variant="ghost" onClick={handleDatabaseTest} disabled={dbTesting}>
                  {dbTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                  Test Connection
                </SetupButton>
                <SetupButton onClick={() => navigate(STEP_ROUTES.admin)} disabled={!dbTest.ok}>
                  Admin Account
                  <ArrowRight className="h-4 w-4" />
                </SetupButton>
              </div>
            </div>
          )}

          {activeStepIndex === 3 && (
            <div className="setup-form-section">
              <div className="setup-form-grid">
                <SetupField label="Admin full name" icon={UserRound} value={admin.fullName} onChange={(value) => updateAdmin("fullName", value)} placeholder="Studio Owner" autoComplete="name" />
                <SetupField label="Admin email" icon={Mail} type="email" value={admin.email} onChange={(value) => updateAdmin("email", value)} placeholder="owner@example.com" autoComplete="email" />
                <div className="setup-field">
                  <Label>Admin password</Label>
                  <div>
                    <Lock className="h-4 w-4" />
                    <Input
                      type={showAdminPassword ? "text" : "password"}
                      value={admin.password}
                      onChange={(event) => updateAdmin("password", event.target.value)}
                      placeholder="At least 8 characters"
                      autoComplete="new-password"
                    />
                    <button type="button" className="setup-password-toggle" onClick={() => setShowAdminPassword((value) => !value)} aria-label={showAdminPassword ? "Hide password" : "Show password"}>
                      {showAdminPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <SetupField label="Confirm password" icon={Lock} type={showAdminPassword ? "text" : "password"} value={admin.confirmPassword} onChange={(value) => updateAdmin("confirmPassword", value)} placeholder="Repeat password" autoComplete="new-password" />
              </div>

              {admin.password && admin.password.length < 8 && <div className="setup-alert is-warning">Use at least 8 characters for the admin password.</div>}
              {admin.confirmPassword && admin.password !== admin.confirmPassword && <div className="setup-alert is-error">Passwords do not match.</div>}

              <div className="setup-actions">
                <SetupButton variant="ghost" onClick={() => navigate(STEP_ROUTES.database)}>
                  <ArrowLeft className="h-4 w-4" />
                  Database
                </SetupButton>
                <SetupButton onClick={() => navigate(STEP_ROUTES.site)} disabled={!adminValid}>
                  Website Settings
                  <ArrowRight className="h-4 w-4" />
                </SetupButton>
              </div>
            </div>
          )}

          {activeStepIndex === 4 && (
            <div className="setup-form-section">
              <div className="setup-logo-row">
                <div className="setup-logo-preview">
                  {previewLogo ? <img src={previewLogo} alt="Uploaded logo preview" /> : <ImageIcon />}
                </div>
                <label className="setup-upload-button">
                  <Upload className="h-4 w-4" />
                  Upload Logo
                  <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(event) => handleLogoUpload(event.target.files?.[0])} />
                </label>
              </div>
              <div className="setup-logo-link-row">
                <Input
                  value={logoUrl}
                  onChange={(event) => setLogoUrl(event.target.value)}
                  placeholder="Paste logo URL or Google Drive share link"
                />
                <button type="button" onClick={handleLogoUrl}>
                  <Link2 className="h-4 w-4" />
                  Use Link
                </button>
              </div>

              <div className="setup-form-grid">
                <SetupField label="Site name" icon={Sparkles} value={site.siteName} onChange={(value) => updateSite("siteName", value)} placeholder="Ikulungwane Holdings" />
                <SetupField label="Site email" icon={Mail} type="email" value={site.email} onChange={(value) => updateSite("email", value)} placeholder="info@example.com" />
                <SetupField label="Phone" icon={Phone} value={site.phone} onChange={(value) => updateSite("phone", value)} placeholder="+27 ..." required={false} />
                <SetupField label="WhatsApp number" icon={Phone} value={site.whatsapp} onChange={(value) => updateSite("whatsapp", value)} placeholder="+27 ..." required={false} />
                <div className="md:col-span-2">
                  <SetupField label="Address" multiline value={site.address} onChange={(value) => updateSite("address", value)} placeholder="Business address" required={false} />
                </div>
              </div>

              <div className="setup-actions">
                <SetupButton variant="ghost" onClick={() => navigate(STEP_ROUTES.admin)}>
                  <ArrowLeft className="h-4 w-4" />
                  Admin
                </SetupButton>
                <SetupButton onClick={() => navigate(STEP_ROUTES.finish)} disabled={!siteValid}>
                  Finish Installation
                  <ArrowRight className="h-4 w-4" />
                </SetupButton>
              </div>
            </div>
          )}

          {activeStepIndex === 5 && (
            <div className="setup-form-section">
              <div className="setup-summary-grid">
                <div>
                  <h2>Database</h2>
                  {Object.entries(maskedDatabaseSummary).map(([key, value]) => (
                    <p key={key}><span>{key}</span><strong>{value || "Missing"}</strong></p>
                  ))}
                </div>
                <div>
                  <h2>Admin</h2>
                  <p><span>Name</span><strong>{admin.fullName}</strong></p>
                  <p><span>Email</span><strong>{admin.email}</strong></p>
                  <p><span>Password</span><strong>Will be hashed in the database</strong></p>
                </div>
                <div>
                  <h2>Website</h2>
                  <p><span>Site</span><strong>{site.siteName}</strong></p>
                  <p><span>Email</span><strong>{site.email}</strong></p>
                  <p><span>Phone</span><strong>{site.phone || "Not set"}</strong></p>
                </div>
              </div>

              <div className="setup-install-list">
                {["Test database connection", "Create database tables", "Create first super admin", "Save website settings", "Mark system as installed"].map((item) => (
                  <div key={item}>
                    {installing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              {installError && <div className="setup-alert is-error">{installError}</div>}

              <div className="setup-actions">
                <SetupButton variant="ghost" onClick={() => navigate(STEP_ROUTES.site)} disabled={installing}>
                  <ArrowLeft className="h-4 w-4" />
                  Website Settings
                </SetupButton>
                <SetupButton onClick={handleInstall} disabled={installing || !dbTest.ok || !adminValid || !siteValid}>
                  {installing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  {installing ? "Installing..." : "Complete Installation"}
                </SetupButton>
              </div>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
