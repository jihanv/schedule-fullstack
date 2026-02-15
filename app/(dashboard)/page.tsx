import { SignedIn, SignOutButton } from '@clerk/nextjs'
import React from 'react'


export default function page() {
    return (
        <>
            <div>Hi</div>
            <SignedIn>Only Signed In
                <SignOutButton />
            </SignedIn>
        </>

    )
}