import React from "react";

export default function AdminPageHeader({ eyebrow, title, description, count, actions }) {
  return (
    <section className="admin-page-header">
      <div>
        {eyebrow && <p className="admin-eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {(description || count !== undefined) && (
          <p>
            {description}
            {count !== undefined && (
              <span>{description ? " " : ""}{count}</span>
            )}
          </p>
        )}
      </div>
      {actions && <div className="admin-page-actions">{actions}</div>}
    </section>
  );
}
