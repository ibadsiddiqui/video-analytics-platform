"use client";

import React from "react";
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import { LogIn, UserPlus } from "lucide-react";
import { ROUTES } from "@/config/routes";

export default function AuthButton(): React.JSX.Element {
  const { isSignedIn } = useUser();

  if (isSignedIn) {
    return (
      <div className="flex items-center gap-2">
        <UserButton
          afterSignOutUrl={ROUTES.HOME}
          appearance={{
            elements: {
              avatarBox: "w-10 h-10",
            },
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <SignInButton mode="modal">
        <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors hover:bg-slate-100/50 rounded-lg">
          <LogIn className="w-4 h-4" />
          <span className="hidden sm:inline">Sign In</span>
        </button>
      </SignInButton>

      <SignUpButton mode="modal">
        <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 rounded-lg transition-all hover:shadow-lg hover:shadow-primary-500/30">
          <UserPlus className="w-4 h-4" />
          <span className="hidden sm:inline">Sign Up</span>
        </button>
      </SignUpButton>
    </div>
  );
}
