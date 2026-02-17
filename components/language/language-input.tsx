"use client";
import { detectBrowserLanguage, Language, useLanguage } from '@/stores/languageStore'
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect } from 'react';

function isLanguage(value: string): value is Language {
    return value === "japanese" || value === "english";
}


export default function LanguageInput() {
    const { uiLanguage, setUiLanguage, initUiLanguage } = useLanguage();
    useEffect(() => {
        initUiLanguage();
    }, [initUiLanguage]);
    return (
        <>
            <div className="pl-6 pb-4">
                <Tabs
                    value={uiLanguage}
                    onValueChange={(value) => {
                        if (isLanguage(value)) setUiLanguage(value);
                    }}
                >
                    <TabsList className="rounded-full bg-gray-300 p-1 shadow-inner">
                        <TabsTrigger
                            value="japanese"
                            className="rounded-full px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow"
                        >
                            日本語
                        </TabsTrigger>

                        <TabsTrigger
                            value="english"
                            className="rounded-full px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow"
                        >
                            English
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>
        </>
    );
}