import React from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { ArrowLeft, Loader2, LogOut, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { isAdminRole } from "@/lib/roles";

const adminLoginUrl = (location) => {
  const requestedPath = `${location.pathname}${location.search || ""}`;
  return `/admin/login?redirect=${encodeURIComponent(requestedPath)}`;
};

export default function AdminGate({ children }) {
  const location = useLocation();
  const { authChecked, isAuthenticated, isLoadingAuth, logout, user } = useAuth();

  if (!authChecked || isLoadingAuth) {
    return (
      <div className="admin-login-shell min-h-screen">
        <div className="admin-login-loading">
          <Loader2 className="h-5 w-5 animate-spin" />
          Checking admin access
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={adminLoginUrl(location)} replace />;
  }

  if (!isAdminRole(user?.role)) {
    return (
      <div className="admin-login-shell min-h-screen">
        <section className="admin-access-denied">
          <div className="admin-login-mark">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <p className="admin-eyebrow">Restricted Area</p>
          <h1>This account cannot access admin.</h1>
          <p>
            You are signed in as {user?.email || "a standard user"}. Use the studio owner account to manage
            content, bookings, settings, and page builder changes.
          </p>
          <div className="admin-login-actions">
            <Button
              type="button"
              className="admin-login-primary"
              onClick={() => {
                logout(false);
                window.location.href = "/admin/login";
              }}
            >
              <LogOut className="h-4 w-4" />
              Sign in as admin
            </Button>
            <Button asChild variant="outline" className="admin-login-secondary">
              <Link to="/">
                <ArrowLeft className="h-4 w-4" />
                Back to website
              </Link>
            </Button>
          </div>
        </section>
      </div>
    );
  }

  return children;
}
