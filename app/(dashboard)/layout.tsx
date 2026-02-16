import SideBar from "@/components/navigation/sidebar";



export default function Layout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (

        <>
            <div className="flex flex-row">
                <SideBar />
                <main className="flex-1 ">
                    <div className="w-full px-6 mx-auto lg:w-[80%] bg-red-100 ">
                        {children}
                    </div>
                </main>
            </div>

        </>

    );
}
