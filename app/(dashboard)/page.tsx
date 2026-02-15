import { Button } from '@/components/ui/button'
import { SignOutButton } from '@clerk/nextjs'
import React from 'react'


export default function page() {
    return (
        <>
            <div>Hi</div>
            <Button asChild><SignOutButton /></Button>
        </>

    )
}