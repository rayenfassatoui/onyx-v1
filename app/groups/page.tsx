import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { GroupsClient } from "./client";

export default async function GroupsPage() {
	const session = await getSession();
	if (!session) {
		redirect("/");
	}

	return <GroupsClient session={session} />;
}
