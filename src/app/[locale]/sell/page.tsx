import { redirect } from "next/navigation";

// Peer-to-peer selling isn't offered yet — keep the route alive but send
// visitors to the coming-soon page instead of a sell flow that doesn't exist.
export default function SellPage() {
  redirect("/coming-soon");
}
