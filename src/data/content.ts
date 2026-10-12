// All the editable content of the site lives here.

export const site = {
  firstName: "Stav",
  lastName: "Kdoshim",
  title: "Stav Kdoshim · Projects",
  description:
    "Stav Kdoshim: computer science student building software and exploring cyber security. Projects and contact.",
  email: "stavkd04@gmail.com",
  github: "https://github.com/stavkdo",
  linkedin: "https://www.linkedin.com/in/stav-kdoshim/",
};

/** A step in a project's "how it works" flow. */
export type Step = { label: string; note?: string };

export type Project = {
  title: string;
  /** Plain-language area, shown under the title */
  area: string;
  summary: string;
  tech: string[];
  repo: string;
  demo?: string;
  /** Optional credit for team projects */
  credit?: string;
  /** A screenshot (or two phone screenshots), or a flow of how it works */
  visual:
    | { kind: "image"; src: string; alt: string; width: number; height: number }
    | { kind: "phones"; shots: { src: string; alt: string }[] }
    | { kind: "flow"; steps: Step[] };
};

// Taken from github.com/stavkdo, most impressive first.
export const projects: Project[] = [
  {
    title: "Quantum-Ready TLS Proxy",
    area: "Cyber security · Cryptography",
    summary:
      "A proxy that sits between the browser and the sites it visits, and checks whether each connection is protected against future quantum computers. It builds its own secure handshake so it can use post-quantum encryption that standard tools don't support yet.",
    tech: ["Python", "TLS 1.3", "ML-KEM", "asyncio"],
    repo: "https://github.com/stavkdo/tls-proxy-server",
    visual: {
      kind: "flow",
      steps: [
        { label: "Browser", note: "visits a site" },
        { label: "Proxy", note: "intercepts the connection" },
        { label: "Quantum check", note: "classical or post-quantum?" },
        { label: "Website", note: "reached over the safest option" },
      ],
    },
  },
  {
    title: "Malware Detector",
    area: "Cyber security · Machine learning",
    summary:
      "A machine-learning model that looks at a Windows program and predicts whether it's malware. I trained and compared Random Forest, k-NN and LightGBM models on the EMBER dataset and packaged it with Docker.",
    tech: ["Python", "scikit-learn", "LightGBM", "Docker"],
    repo: "https://github.com/stavkdo/malware-detector",
    visual: {
      kind: "flow",
      steps: [
        { label: "Program file", note: "any Windows .exe" },
        { label: "Features", note: "extracted with EMBER" },
        { label: "Trained model", note: "Random Forest" },
        { label: "Verdict", note: "malware or safe" },
      ],
    },
  },
  {
    title: "Password Defence Lab",
    area: "Cyber security · Research",
    summary:
      "How well do login protections really hold up? We built a login system with switchable defences (account lockout, CAPTCHA and one-time codes) and different ways of storing passwords, then attacked it with brute force and password spraying to measure the difference.",
    tech: ["Python", "FastAPI", "React", "PostgreSQL"],
    repo: "https://github.com/stavkdo/introduction-to-cybersecurity",
    credit: "Course project with Ofir Sasson",
    visual: {
      kind: "flow",
      steps: [
        { label: "Attack script", note: "brute force & spraying" },
        { label: "Login server", note: "the target" },
        { label: "Defences", note: "lockout, CAPTCHA, codes" },
        { label: "Dashboard", note: "what held, what broke" },
      ],
    },
  },
  {
    title: "Record Library",
    area: "Web app · Full stack",
    summary:
      "A home for a vinyl collection. Search records from Discogs or add them by hand, browse by album or artist, and let it pick something to play.",
    tech: ["React", "TypeScript", "Python", "PostgreSQL"],
    repo: "https://github.com/stavkdo/record-library",
    demo: "https://record-library.vercel.app",
    visual: {
      kind: "image",
      src: "/projects/record-library.jpg",
      alt: "Record Library: a shared library of six records, with the libraries and the weekly record pick in the sidebar",
      width: 1912,
      height: 897,
    },
  },
  {
    title: "Job Application Tracker",
    area: "Automation · AI",
    summary:
      "Reads job application emails from Gmail, uses Google's Gemini AI to pull out the role, company and status, and keeps a Google Sheet up to date, so nothing gets lost during a job search.",
    tech: ["Python", "Gemini API", "Gmail & Sheets APIs", "Google Cloud"],
    repo: "https://github.com/stavkdo/job-application-tracker",
    visual: {
      kind: "flow",
      steps: [
        { label: "Gmail", note: "new application emails" },
        { label: "Gemini AI", note: "reads role, company, status" },
        { label: "Google Sheets", note: "always up to date" },
      ],
    },
  },
  {
    title: "Puzzle Games",
    area: "Web · Games",
    summary:
      "Two daily-style logic puzzles, Einstein's Zebra riddle and Lights Out, built from scratch with plain HTML, CSS and JavaScript, and illustrated with my own drawings.",
    tech: ["HTML", "CSS", "JavaScript", "SVG"],
    repo: "https://github.com/stavkdo/puzzle-games",
    demo: "https://zebra-puzzle.vercel.app",
    visual: {
      kind: "phones",
      shots: [
        { src: "/projects/puzzle-games.jpg", alt: "The Zebra puzzle: four houses, characters and pets, with clues below" },
        { src: "/projects/puzzle-games-2.jpg", alt: "Lights Out: a three-by-three grid of light bulbs" },
      ],
    },
  },
];

// The four strings of the cello, low to high, and the section each one opens.
export const strings = [
  { note: "C", id: "about", label: "About" },
  { note: "G", id: "projects", label: "Projects" },
  { note: "D", id: "puzzle", label: "Puzzle" },
  { note: "A", id: "contact", label: "Contact" },
] as const;
