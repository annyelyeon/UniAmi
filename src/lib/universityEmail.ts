export const ALLOWED_UNIVERSITY_DOMAINS = [
  "live.vu.edu.au",
  "student.rmit.edu.au",
] as const;

export const UNIVERSITY_EMAIL_LOOKUP = {
  "live.vu.edu.au": {
    university: "Victoria University",
    campuses: [
      "Footscray Park",
      "Footscray Nicholson",
      "City Tower",
      "St Albans",
      "Werribee",
      "Sunshine",
    ],
  },
  "student.rmit.edu.au": {
    university: "RMIT University",
    campuses: ["Melbourne City", "Bundoora", "Brunswick"],
  },
} as const;

export function isAllowedUniversityEmail(email: string) {
  const domain = email.trim().toLowerCase().split("@")[1];

  return Boolean(
    domain &&
      ALLOWED_UNIVERSITY_DOMAINS.includes(domain as (typeof ALLOWED_UNIVERSITY_DOMAINS)[number])
  );
}

export function getUniversityEmailErrorMessage(email?: string) {
  const domain = email?.trim().toLowerCase().split("@")[1];

  if (!email) {
    return "Enter your university email address to continue.";
  }

  if (!domain) {
    return "Use a valid email address with a university domain.";
  }

  if (
    domain &&
    !ALLOWED_UNIVERSITY_DOMAINS.includes(domain as (typeof ALLOWED_UNIVERSITY_DOMAINS)[number])
  ) {
    return "This sign-up is only available for Victoria University and RMIT University pilot emails ending in live.vu.edu.au or student.rmit.edu.au.";
  }

  return "Use a university email from a supported pilot domain to sign up.";
}