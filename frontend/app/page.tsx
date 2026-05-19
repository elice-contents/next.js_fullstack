import { redirect } from "next/navigation";
import { bp } from "./lib/path";

export default function Home() {
  redirect(bp("/posts"));
}
