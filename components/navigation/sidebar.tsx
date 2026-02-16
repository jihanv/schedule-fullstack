"use client"
import { useState } from "react";
import LanguageSelector from "@/components/language/language-input";
import { Button } from "../ui/button";
import { SignOutButton } from "@clerk/nextjs";

export default function SideBar() {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <>
            {/* Backdrop only on mobile when open */}
            {!collapsed && (
                <div
                    className="fixed inset-0 z-40 bg-black/30 sm:hidden"
                    onClick={() => setCollapsed(true)}
                />
            )}
            <div
                className={[
                    "border-r bg-accent transition-all duration-300 ease-in-out",
                    // mobile: overlay drawer
                    !collapsed
                        ? "fixed top-0 left-0 z-50 w-[60%] h-dvh sm:sticky sm:inset-auto sm:z-auto sm:w-60"
                        : "fixed top-0 left-0 z-50 w-16 h-dvh sm:sticky sm:inset-auto sm:z-auto sm:w-16",
                ].join(" ")}
            >
                {/* Header / toggle */}
                <div className="h-14 flex items-center justify-between px-2">
                    <button
                        onClick={() => setCollapsed((v) => !v)}
                        className="p-2 rounded hover:bg-gray-100"
                        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        <MenuIcon />
                    </button>
                </div>
                {!collapsed && <LanguageSelector />}
                {!collapsed &&
                    <div className="pl-6 pb-4">
                        <Button asChild><SignOutButton /></Button>
                    </div>}
            </div>
        </>
    )
}

function MenuIcon() {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            className="text-gray-700"
        >
            <path
                d="M4 6h16M4 12h16M4 18h16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            />
        </svg>
    );
}