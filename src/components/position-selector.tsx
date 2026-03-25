"use client";

import { useState } from "react";
import { UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserPosition } from "@/lib/types";

interface PositionSelectorProps {
  onSelect: (position: UserPosition) => void;
  onSkip: () => void;
  detectedParties?: string[];
}

const COMMON_ROLES = [
  "Buyer",
  "Seller",
  "Tenant",
  "Landlord",
  "Employer",
  "Employee",
  "Contractor",
  "Client",
  "Licensor",
  "Licensee",
  "Borrower",
  "Lender",
  "Investor",
  "Founder",
  "Service Provider",
  "Customer",
];

export default function PositionSelector({
  onSelect,
  onSkip,
  detectedParties,
}: PositionSelectorProps) {
  const [selectedRole, setSelectedRole] = useState("");
  const [customRole, setCustomRole] = useState("");
  const [description, setDescription] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const handleSubmit = () => {
    const role = showCustom ? customRole.trim() : selectedRole;
    if (!role) return;
    onSelect({
      role,
      customDescription: description.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)]">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">What is your role?</h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              This helps me tailor my analysis to your interests
            </p>
          </div>
        </div>

        {detectedParties && detectedParties.length > 0 && (
          <div className="mb-4 rounded-lg bg-[var(--muted)] p-3">
            <p className="text-xs font-medium text-[var(--muted-foreground)]">
              Parties detected in document:
            </p>
            <p className="mt-1 text-sm">
              {detectedParties.join(" / ")}
            </p>
          </div>
        )}

        {/* Role grid */}
        <div className="mb-4">
          <p className="mb-2 text-xs font-medium text-[var(--muted-foreground)]">
            Select your role:
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {COMMON_ROLES.map((role) => (
              <button
                key={role}
                onClick={() => {
                  setSelectedRole(role);
                  setShowCustom(false);
                }}
                className={cn(
                  "rounded-lg border px-2 py-1.5 text-xs transition-colors",
                  selectedRole === role && !showCustom
                    ? "border-[var(--ring)] bg-[var(--primary)] text-[var(--primary-foreground)]"
                    : "border-[var(--border)] hover:bg-[var(--accent)]"
                )}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* Custom role */}
        <div className="mb-4">
          {!showCustom ? (
            <button
              onClick={() => {
                setShowCustom(true);
                setSelectedRole("");
              }}
              className="text-xs text-[var(--muted-foreground)] underline underline-offset-2 hover:text-[var(--foreground)]"
            >
              Other role not listed...
            </button>
          ) : (
            <input
              type="text"
              value={customRole}
              onChange={(e) => setCustomRole(e.target.value)}
              placeholder="Enter your role..."
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[var(--ring)]"
              autoFocus
            />
          )}
        </div>

        {/* Additional context */}
        <div className="mb-5">
          <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
            Additional context (optional)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Small business owner, first-time renter, early-stage startup..."
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[var(--ring)]"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onSkip}
            className="flex-1 rounded-lg border border-[var(--border)] px-4 py-2 text-sm transition-colors hover:bg-[var(--accent)]"
          >
            Skip for now
          </button>
          <button
            onClick={handleSubmit}
            disabled={showCustom ? !customRole.trim() : !selectedRole}
            className="flex-1 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm text-[var(--primary-foreground)] transition-colors hover:opacity-90 disabled:opacity-30"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
