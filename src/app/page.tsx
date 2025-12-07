import { redirect } from "next/navigation";
import { getServerSession } from "~/server/auth";

export default async function HomePage() {
  const session = await getServerSession();

  if (session) {
    redirect("/admin/restaurants");
  }

  redirect("/auth/login");
}

