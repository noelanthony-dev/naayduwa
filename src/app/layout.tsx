import "@/app/globals.css";
import { CalendarProvider } from "@/store/useCalendarStore";
import { AuthProvider } from "@/auth/AuthProvider";

export const metadata = {
  title: "Naay Duwa?",
  description: "Pickleball Calendar",
  icons: {
    icon: "/favicon.svg", // points to the SVG in /public
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <AuthProvider>
          <CalendarProvider>{children}</CalendarProvider>
        </AuthProvider>
      </body>
    </html>
  );
}