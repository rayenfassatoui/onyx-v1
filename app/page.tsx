"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LockScreen } from "@/components/vault/lock-screen";

export default function Home() {
	const router = useRouter();
	const [mode, setMode] = React.useState<"login" | "register">("login");

	const handleUnlock = () => {
		router.push("/dashboard");
	};

	return (
		<LockScreen 
			onUnlock={handleUnlock} 
			mode={mode} 
			onModeChange={setMode}
		/>
	);
}
