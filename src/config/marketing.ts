/**
 * Marketing Configuration
 *
 * Marketing copy for landing pages and promotional content.
 * Separate from BRANDING to keep identity vs. messaging distinct.
 *
 * - BRANDING: Who we are (name, logo, links)
 * - MARKETING: What we say (headlines, descriptions, CTAs)
 */

import { BRANDING } from "./branding";

export const MARKETING = {
  /**
   * Hero section on landing page
   */
  hero: {
    badge: `${BRANDING.name} Pioneers Preview`,
    title: "Build the Future of Learning",
    subtitle: `Help us build ${BRANDING.name} V2.`,
    lead: `You're early. This is a preview of the next generation of ${BRANDING.name} — contribution-centered learning on Cardano. Explore, experiment, break things. Your feedback shapes what we ship.`,
    primaryCta: {
      text: "Enter the App",
      href: "/dashboard",
    },
    secondaryCta: {
      text: "What is Pioneers?",
      href: `${BRANDING.links.docs}/docs/pioneers`,
    },
  },

  /**
   * Playground section explaining the demo
   */
  playground: {
    title: "This is a playground",
    description:
      "We're building in public. This demo connects to Cardano Preprod so you can test real features without real stakes. Nothing here costs ADA. Data may reset. That's the point.",
  },

  /**
   * Two paths section
   */
  twoPaths: {
    title: "Two ways to explore",
    discover: {
      title: "Discover",
      description: `Browse courses and projects. See how ${BRANDING.name} structures learning and contribution.`,
      links: [
        { text: "Browse Courses", href: "/course" },
        { text: "Browse Projects", href: "/project" },
      ],
    },
    create: {
      title: "Create",
      description:
        "Try the creator tools. Build a course, define modules, publish tasks to a project.",
      links: [
        { text: "Course Studio", href: "/studio/course" },
        { text: "Project Studio", href: "/studio/project" },
      ],
    },
  },

  /**
   * Pioneer program callout
   */
  pioneers: {
    title: "What are Pioneers?",
    description: [
      "Following patterns from Gimbalabs in 2021, we're inviting early adopters to shape Andamio V2 before mainnet. This isn't just beta testing — it's co-creation.",
      "Your questions become documentation. Your bugs become fixes. Your ideas become features.",
    ],
    linkText: "Read the Pioneers documentation",
    linkHref: `${BRANDING.links.docs}/docs/pioneers`,
  },

  /**
   * Preprod warning
   */
  preprodWarning: {
    title: "This is Cardano Preprod",
    description:
      "Use a preprod wallet. Transactions are free. Data may be wiped during development.",
  },

  /**
   * Final CTA section
   */
  finalCta: {
    title: "Ready?",
    description: "Connect a preprod wallet and start exploring.",
    buttonText: "Go to Dashboard",
    buttonHref: "/dashboard",
  },

  /**
   * Timeline info
   */
  timeline: {
    preprodLaunch: "Preprod launch: January 2026",
    mainnetLaunch: "Mainnet launch: February 2026",
  },

  /**
   * Landing page hero section
   */
  landingHero: {
    headline: "📚 → ✅ → 🚪",
    subtext: "Complete courses. Earn credentials. Unlock funded projects.",
    enterCta: "Enter",
    browseCta: "Browse",
    launchCta: "Launch a Project",
  },

  /**
   * Landing page cards - three entry paths (legacy, kept for compatibility)
   */
  landingCards: {
    explore: {
      title: "Explore",
      description:
        "Browse courses and projects. No wallet required.",
    },
    signIn: {
      title: "Sign In",
      description:
        "Returning user? Connect your wallet to pick up where you left off.",
    },
    getStarted: {
      title: "Get Started",
      description:
        "New here? Connect a wallet and create your access token to begin.",
    },
  },

  /**
   * Footer content
   */
  footer: {
    brandText: `${BRANDING.name} Pioneer Preview`,
    links: [
      { text: "Docs", href: `${BRANDING.links.docs}/docs/pioneers`, external: true },
      {
        text: BRANDING.links.website.replace("https://", ""),
        href: BRANDING.links.website,
        external: true,
      },
      { text: "Sitemap", href: "/sitemap", external: false },
    ],
  },

  /**
   * LLM disclaimer alert
   */
  disclaimer: {
    text: "This is a preview build. Some text may change before launch.",
  },
} as const;

export type Marketing = typeof MARKETING;
