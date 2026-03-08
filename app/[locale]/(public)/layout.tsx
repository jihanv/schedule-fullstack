import type { Metadata } from "next";
import "../globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import {
    SidebarProvider,
    SidebarTrigger,
    SidebarInset,
} from "@/components/ui/sidebar";
import { PublicSidebar } from "@/components/public-sidebar";


export const metadata: Metadata = {
    title: "ClassMate",
    description: "",
};
const locales = ["en", "ja"] as const;

// type LayoutProps = {
//   children: React.ReactNode,
//   params: Promise<{ locale: string }>;
// }
export default async function RootLayout({
    children,
    params,
}: LayoutProps<"/[locale]">) {
    const { locale } = await params;
    if (!hasLocale(locales, locale)) notFound();

    setRequestLocale(locale);
    const messages = await getMessages();

    return (


        <ClerkProvider>
            <NextIntlClientProvider locale={locale} messages={messages}>
                <SidebarProvider>
                    <PublicSidebar />
                    <SidebarInset>
                        <header className="flex h-14 items-center px-4">
                            <SidebarTrigger />
                        </header>
                        <main className="min-w-0">
                            <div className="mx-auto w-full px-6">

                                {children}
                            </div>
                        </main>
                    </SidebarInset>
                </SidebarProvider>
            </NextIntlClientProvider>
        </ClerkProvider>


    );
}
