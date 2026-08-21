export default function ParentPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* 
        This is a shared layout for the parent portal.
        Later, we can add a persistent Sidebar or Navbar here for authenticated users.
      */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  )
}
