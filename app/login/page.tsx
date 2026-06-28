import { redirect } from "next/navigation"

/**
 * Apex login is removed in the subdomain model — authentication happens on each
 * shop's own subdomain (e.g. https://vanity-salon.mibookia.com/login). Anyone
 * hitting mibookia.com/login is sent to the marketing home.
 */
export default function LoginPage() {
  redirect("/")
}
