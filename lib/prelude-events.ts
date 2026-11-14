import type { PreludeEvent } from "./prelude-types";

// The pre-wedding events. They live in the code, not the database.
// To change an event, edit this list and deploy.
//   audience "everyone": shown to every visitor.
//   audience "guests":   shown only after a guest signs in with a number on the list.
//   date: YYYY-MM-DD, or null to show "Date to be announced".
//   dressCode / locationUrl: optional. locationUrl must start with https://
export const PRELUDE_EVENTS: PreludeEvent[] = [
  {
    id: "haldi",
    title: "Haldi",
    date: "2026-11-15",
    time: "",
    venue: "",
    details: "",
    dressCode: "",
    locationUrl: "",
    audience: "guests",
    sortOrder: 1,
  },
  {
    id: "sangeet",
    title: "Sangeet",
    date: "2027-02-14",
    time: "",
    venue: "",
    details: "",
    dressCode: "",
    locationUrl: "",
    audience: "guests",
    sortOrder: 2,
  },
  {
    id: "pellikuturu",
    title: "Pellikuturu",
    date: "2027-02-20",
    time: "",
    venue: "Shapur Nagar, Hyderabad",
    details: "",
    dressCode: "",
    locationUrl: "",
    audience: "everyone",
    sortOrder: 3,
  },
  {
    id: "pellikoduku",
    title: "Pellikoduku",
    date: "2027-02-20",
    time: "",
    venue: "Indugupalli, NTR District, Andhra Pradesh",
    details: "",
    dressCode: "",
    locationUrl: "",
    audience: "everyone",
    sortOrder: 4,
  },
  {
    id: "marriage",
    title: "Marriage",
    date: "2027-02-21",
    time: "10:30 AM",
    venue: "LV Convention, Suchitra Rd, Beside Spring Fields Colony, Hyderabad",
    details: "",
    dressCode: "",
    locationUrl: "",
    audience: "everyone",
    sortOrder: 5,
  },
];
