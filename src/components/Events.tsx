import { useEffect, useMemo, useState } from "react";

export type EventStatus = "UPCOMING" | "ONGOING" | "DONE";

export interface EventItem {
  id: number;
  title: string;
  description: string;
  location: string;
  startDateTime: string;
  endDateTime: string;
  image: string;
}

const EVENTS_PER_PAGE = 9;
const CARD_HEIGHT = 430;
const GRID_GAP = 24;
const STATUS_FILTERS: Array<EventStatus | "ALL"> = [
  "ALL",
  "UPCOMING",
  "ONGOING",
  "DONE",
];

// =====================
// Utils
// =====================
const getEventStatus = (
  startDateTime: string,
  endDateTime: string
): EventStatus => {
  const now = new Date();
  const start = new Date(startDateTime);
  const end = new Date(endDateTime);

  if (now < start) return "UPCOMING";
  if (now >= start && now <= end) return "ONGOING";
  return "DONE";
};

// =====================
// Mock Data
// =====================
const MOCK_EVENTS: EventItem[] = [
  {
    id: 1,
    title: "Poetry Night",
    description: "An evening of spoken word and poetry.",
    location: "Books n Cafe – Main Hall",
    startDateTime: "2026-03-10T18:00:00",
    endDateTime: "2026-03-10T21:00:00",
    image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?&w=600",
  },
  {
    id: 2,
    title: "Coffee Brewing Workshop",
    description: "Learn professional coffee brewing techn;alskd;falk;dflka;lskdf;alk;falk;slkdf;alksdf;alkf;laksd;flak;ldsfka;lsdkf;alspdfaipsdfa;sdlkf;alkds;fak;fak;iques.",
    location: "Books n Cafe – Bar Area",
    startDateTime: "2026-03-05T09:00:00",
    endDateTime: "2026-03-05T12:00:00",
    image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?&w=600",
  },
  ...Array.from({ length: 15 }).map((_, i) => ({
    id: i + 3,
    title: `Community Event ${i + 1}`,
    description:
      "A community gathering with talks, food, and networking.",
    location: "Books n Cafe",
    startDateTime: `2026-03-${((i % 28) + 1)
      .toString()
      .padStart(2, "0")}T${(8 + (i % 10))
        .toString()
        .padStart(2, "0")}:00:00`,
    endDateTime: `2026-03-${((i % 28) + 1)
      .toString()
      .padStart(2, "0")}T${(10 + (i % 10))
        .toString()
        .padStart(2, "0")}:00:00`,
    image: "https://images.unsplash.com/photo-1492724441997-5dc865305da7?&w=600",
  })),
];

// =====================
// Component
// =====================
const Events: React.FC = () => {
  const [events] = useState<EventItem[]>(MOCK_EVENTS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<EventStatus | "ALL">("ALL");
  const [selectedEvent, setSelectedEvent] =
    useState<(EventItem & { status: EventStatus }) | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const eventsWithStatus = useMemo(
    () =>
      events.map((e) => ({
        ...e,
        status: getEventStatus(e.startDateTime, e.endDateTime),
      })),
    [events]
  );

  const filteredEvents = useMemo(() => {
    return eventsWithStatus.filter((event) => {
      const matchesSearch = event.title
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "ALL" || event.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [eventsWithStatus, search, statusFilter]);

  useEffect(() => setCurrentPage(1), [search, statusFilter]);

  const totalPages = Math.ceil(filteredEvents.length / EVENTS_PER_PAGE);

  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * EVENTS_PER_PAGE;
    return filteredEvents.slice(start, start + EVENTS_PER_PAGE);
  }, [filteredEvents, currentPage]);

  return (
    <section className="px-6 py-12 max-w-7xl mx-auto">
      <h1 className="mb-6 text-4xl font-bold text-amber-500">
        Events & Gatherings
      </h1>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search events..."
          className="w-full rounded bg-neutral-900 px-4 py-2 text-white"
        />

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as EventStatus | "ALL")
          }
          className="rounded bg-neutral-900 px-3 py-2 text-white"
        >
          {STATUS_FILTERS.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
      </div>

      {/* Grid (fixed height like Books) */}
      <div
        style={{
          minHeight:
            Math.ceil(EVENTS_PER_PAGE / 3) * CARD_HEIGHT + GRID_GAP * 2,
        }}
      >
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {paginatedEvents.map((event) => (
            <div
              key={event.id}
              className="rounded-xl bg-neutral-800 overflow-hidden flex flex-col"
            >
              <img
                src={event.image}
                alt={event.title}
                className="h-64 w-full object-cover"
              />

              <div className="p-5 flex flex-col flex-1">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-amber-400">{event.location}</span>
                  <span
                    className={
                      event.status === "UPCOMING"
                        ? "text-emerald-400"
                        : event.status === "ONGOING"
                          ? "text-amber-400"
                          : "text-neutral-400"
                    }
                  >
                    {event.status}
                  </span>
                </div>

                <h2 className="text-white font-semibold">{event.title}</h2>

                <p className="text-neutral-400 text-sm mt-1">
                  {new Date(event.startDateTime).toLocaleDateString()} •{" "}
                  {new Date(event.startDateTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>

                <p className="text-neutral-400 text-sm mt-2 line-clamp-3">
                  {event.description}
                </p>

                <button
                  onClick={() => setSelectedEvent(event)}
                  className="mt-auto w-full rounded bg-amber-500 py-2 text-neutral-900 font-semibold"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="px-4 py-2 rounded bg-neutral-700 text-white disabled:opacity-50"
          >
            Prev
          </button>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="px-4 py-2 rounded bg-neutral-700 text-white disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-neutral-900 rounded-xl max-w-4xl w-full overflow-hidden">
            <div className="p-6">
              <img
                src={selectedEvent.image}
                alt={selectedEvent.title}
                className="h-75 w-full object-cover rounded"
              />

              <div className="mt-4 space-y-2">
                <h2 className="text-2xl font-bold text-white">
                  {selectedEvent.title}
                </h2>
                <p className="text-neutral-400">
                  📍 {selectedEvent.location}
                </p>
                <p className="text-neutral-400 text-sm">
                  🕒{" "}
                  {new Date(
                    selectedEvent.startDateTime
                  ).toLocaleString()}{" "}
                  –{" "}
                  {new Date(
                    selectedEvent.endDateTime
                  ).toLocaleTimeString()}
                </p>
                <p className="text-neutral-300 text-sm">
                  {selectedEvent.description}
                </p>

                <button
                  onClick={() => setSelectedEvent(null)}
                  className="w-full py-3 rounded bg-neutral-800 text-white hover:bg-neutral-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Events;
