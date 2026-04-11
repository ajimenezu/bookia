"use client"

import { track } from "@vercel/analytics"

type CtaLocation =
  | "nav"
  | "hero"
  | "benefits"
  | "demo"
  | "plans"
  | "footer"

type CtaAction =
  | "start-trial"
  | "view-demo"
  | "open-admin"
  | "open-plans"
  | "open-faq"
  | "schedule-demo"
  | "contact-sales"

export function trackCtaClick(action: CtaAction, location: CtaLocation) {
  track("cta_click", {
    action,
    location,
  })
}

export function trackPlanClick(planName: string, billingCycle: "monthly" | "yearly") {
  track("plan_click", {
    planName,
    billingCycle,
  })
}
