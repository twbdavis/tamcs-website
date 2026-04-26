// Links shown to everyone, signed in or not.
export const publicLinks = [
  { href: "/officers", label: "Officers" },
  { href: "/schedule", label: "Schedule" },
  { href: "/meet-results", label: "Meets" },
  { href: "/team-records", label: "Records" },
  { href: "/top-times", label: "Top Times" },
];

// Links only visitors see — current members don't need recruiting pages.
export const visitorLinks = [
  { href: "/about", label: "About" },
  { href: "/join-us", label: "Join Us" },
];

// Extra nav items that only show up once a user is signed in.
export const memberLinks = [{ href: "/forms", label: "Forms" }];
