// components/HeaderAuth.tsx
"use client";

import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export default function HeaderAuth() {
    return (
        <header style={{ display: "flex", justifyContent: "flex-end", padding: 0 }}>
            <SignedOut>
                <SignInButton />
            </SignedOut>

            <SignedIn>
                <UserButton />
            </SignedIn>
        </header>
    );
}