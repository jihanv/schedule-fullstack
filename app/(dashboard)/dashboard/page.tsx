import { SignedIn } from '@clerk/nextjs'
import React from 'react'


export default function page() {
    return (
        <>
            <div>Anyone Can See</div>
            <SignedIn>Only Signed In</SignedIn>
        </>

    )
}