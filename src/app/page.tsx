import MonthCalendar from "@/components/Calendar/MonthCalendar";
import AddEventModal from "@/components/modals/AddEventModal";
import EventDetailsModal from "@/components/modals/EventDetailsModal";
import Header from "@/components/Header";
import Toast from "@/components/ui/Toast";

export default function Page() {
  return (
    <main className="min-h-screen bg-bg">
      <Header />
      <section className="w-full px-0 md:px-4 py-1 md:py-6">
        <div className="space-y-6">
          <MonthCalendar />
        </div>
        <AddEventModal />
        <EventDetailsModal />
        <Toast />
      </section>
    </main>
  );
}