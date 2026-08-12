const ALLOWED_UNIVERSITY_DOMAINS = [
  "live.vu.edu.au",
  "student.rmit.edu.au",
];

export function isAllowedUniversityEmail(email: string) {
  const domain = email.trim().toLowerCase().split("@")[1];

  return Boolean(domain && ALLOWED_UNIVERSITY_DOMAINS.includes(domain));
}

export function getUniversityEmailErrorMessage() {
  return "Use a university email from a pilot campus domain to sign up.";
}