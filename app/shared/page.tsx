import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { SharedPromptsClient } from "./client";

export default async function SharedPage() {
	const session = await getSession();
	if (!session) {
		redirect("/");
	}

	return <SharedPromptsClient />;
}
