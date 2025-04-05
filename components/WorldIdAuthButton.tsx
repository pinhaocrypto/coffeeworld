"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useWorldId } from "./minikit-provider"; 
import { useRouter } from "next/navigation";

export default function WorldIdAuthButton() {
  const { data: session, status } = useSession();
  const { open, isLoading, errorMsg } = useWorldId(); 
  const router = useRouter(); 

  const showSignIn = status === "unauthenticated";
  const showSignOut = status === "authenticated";
  const buttonDisabled = status === "loading" || isLoading; 

  const handleSignIn = () => {
    if (open) {
      console.log("Opening IDKit Widget...");
      open(); 
    } else {
      console.error("IDKit open function not available.");
    }
  };

  const handleSignOut = async () => {
    console.log("Signing out...");
    await signOut({ redirect: false }); 
    // router.push('/'); 
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      {showSignIn && (
        <button
          className={`px-4 py-2 rounded-md text-white font-medium ${buttonDisabled ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
          onClick={handleSignIn}
          disabled={buttonDisabled || !open} 
        >
          {isLoading ? "Verifying..." : "Sign In with World ID"}
        </button>
      )}

      {showSignOut && (
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">Welcome!</span>
          <button
            className={`px-4 py-2 rounded-md text-white font-medium ${buttonDisabled ? 'bg-gray-400' : 'bg-red-600 hover:bg-red-700'}`}
            onClick={handleSignOut}
            disabled={buttonDisabled}
          >
            {isLoading ? "Signing out..." : "Sign Out"}
          </button>
        </div>
      )}

      {errorMsg && (
        <p className="text-sm text-red-600">Error: {errorMsg}</p>
      )}
      
      {status === 'loading' && <p className="text-sm text-gray-500">Loading session...</p>} 
    </div>
  );
}
