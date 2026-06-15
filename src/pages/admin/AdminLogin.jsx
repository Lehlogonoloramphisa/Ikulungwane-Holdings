import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { localApi } from "@/api/localClient";
import { useAuth } from "@/lib/AuthContext";
import { applyBrandingVariables } from "@/lib/branding";
import { useCms } from "@/lib/cms";
import { getSetupStatus } from "@/lib/setupApi";

const safeAdminRedirect = (value) => {
  const isAdminPath = value === "/admin" || value?.startsWith("/admin/") || value?.startsWith("/admin?");

  if (!value || !isAdminPath || value.startsWith("/admin/login")) {
    return "/admin";
  }

  return value;
};

export default function AdminLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { authChecked, checkUserAuth, isAuthenticated, user } = useAuth();
  const cms = useCms();
  const redirectTo = useMemo(() => safeAdminRedirect(searchParams.get("redirect")), [searchParams]);

  const [checkingSetup, setCheckingSetup] = useState(true);
  const [setupMode, setSetupMode] = useState(false);
  const [fullName, setFullName] = useState("Studio Owner");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    applyBrandingVariables(cms.global.branding);
  }, [cms.global.branding]);

  useEffect(() => {
    let mounted = true;

    getSetupStatus()
      .then((status) => {
        if (!mounted) return;
        if (status.available && !status.installed) {
          navigate("/setup", { replace: true });
          return;
        }
        if (status.available && status.installed) {
          setSetupMode(false);
          return;
        }

        localApi.auth.hasAdminAccount()
          .then((exists) => {
            if (mounted) setSetupMode(!exists);
          })
          .catch(() => {
            if (mounted) setSetupMode(false);
          })
          .finally(() => {
            if (mounted) setCheckingSetup(false);
          });
      })
      .catch(() => {
        if (mounted) setSetupMode(false);
      })
      .finally(() => {
        if (mounted) setCheckingSetup(false);
      });

    return () => {
      mounted = false;
    };
  }, [navigate]);

  useEffect(() => {
    if (authChecked && isAuthenticated && user?.role === "admin") {
      navigate(redirectTo, { replace: true });
    }
  }, [authChecked, isAuthenticated, navigate, redirectTo, user?.role]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const adminUser = setupMode
        ? await localApi.auth.createAdminAccount({ email, password, full_name: fullName })
        : await localApi.auth.loginViaEmailPassword(email, password);

      if (adminUser.role !== "admin") {
        localApi.auth.logout();
        throw new Error("This account is not an admin account.");
      }

      await checkUserAuth({ silent: true });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || "Unable to access admin");
      if (String(err.message || "").includes("already exists")) {
        setSetupMode(false);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-login-shell min-h-screen">
      <section className="admin-login-wrap">
        <div className="admin-login-art" aria-hidden="true">
          <div className="admin-login-art-frame">
            <span>IK</span>
            <strong>Studio Control</strong>
            <p>Portfolio, bookings, pages, settings, and client enquiries in one curated workspace.</p>
          </div>
          <div className="admin-login-art-strip">
            <span>Portfolio</span>
            <span>Bookings</span>
            <span>Settings</span>
          </div>
        </div>

        <div className="admin-login-panel">
          <Link to="/" className="admin-login-back">
            <ArrowLeft className="h-4 w-4" />
            Website
          </Link>

          <div className="admin-login-heading">
            <div className="admin-login-mark">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <p className="admin-eyebrow">{setupMode ? "First Time Setup" : "Admin Access"}</p>
            <h1>{setupMode ? "Create your owner login." : "Sign in to admin."}</h1>
            <p>
              {setupMode
                ? "Create the protected studio owner account before editing the website."
                : "Use your studio owner credentials to manage content and client requests."}
            </p>
          </div>

          {error && <div className="admin-login-error">{error}</div>}

          <form className="admin-login-form" onSubmit={handleSubmit}>
            {setupMode && (
              <div className="admin-login-field">
                <Label htmlFor="admin-name">Owner name</Label>
                <div>
                  <UserRound className="h-4 w-4" />
                  <Input
                    id="admin-name"
                    autoComplete="name"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Studio Owner"
                  />
                </div>
              </div>
            )}

            <div className="admin-login-field">
              <Label htmlFor="admin-email">Email address</Label>
              <div>
                <Mail className="h-4 w-4" />
                <Input
                  id="admin-email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="owner@ikulungwane.com"
                  required
                />
              </div>
            </div>

            <div className="admin-login-field">
              <Label htmlFor="admin-password">Password</Label>
              <div>
                <Lock className="h-4 w-4" />
                <Input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={setupMode ? "new-password" : "current-password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter password"
                  minLength={setupMode ? 8 : undefined}
                  required
                />
                <button
                  type="button"
                  className="admin-login-password"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {setupMode && <span>Use at least 8 characters.</span>}
            </div>

            <Button type="submit" className="admin-login-primary" disabled={loading || checkingSetup}>
              {loading || checkingSetup ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Please wait
                </>
              ) : (
                <>
                  {setupMode ? "Create admin login" : "Enter admin"}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}
