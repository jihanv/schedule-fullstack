// components/HeaderAuth.tsx
"use client";

import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export default function HeaderAuth() {
    return (
        <header className="bg-accent h-14" style={{ display: "flex", justifyContent: "flex-end", padding: 16 }}>
            <SignedOut>
                <SignInButton />
            </SignedOut>

            <SignedIn>
                <UserButton />
            </SignedIn>
        </header>
    );
}