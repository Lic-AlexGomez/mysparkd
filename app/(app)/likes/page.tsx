"use client"
import { redirect } from "next/navigation"
export default function LikesRedirect() {
  redirect("/matches?tab=likes")
}
