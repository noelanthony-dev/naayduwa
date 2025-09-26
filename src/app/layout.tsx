import "@/app/globals.css";
import { CalendarProvider } from "@/store/useCalendarStore";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <CalendarProvider>{children}</CalendarProvider>
      </body>
    </html>
  );
}