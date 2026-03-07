import { FacultyProtectedRoute } from '@/components/faculty/FacultyProtectedRoute';
import { FacultySidebar } from '@/components/faculty/FacultySidebar';

export default function FacultyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FacultyProtectedRoute>
      <div className="flex min-h-screen bg-background">
        <FacultySidebar />
        <main className="flex-1 overflow-auto">
          <div className="p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </FacultyProtectedRoute>
  );
}
