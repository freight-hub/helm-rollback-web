// https://github.com/Paratron/hookrouter/blob/e0ceb4a6ed495a59754351aff6ad54ce5c124512/src/title.js#L11

import { useEffect } from "react";

/**
 * This hook will set the window title, when a component gets mounted.
 * When the component gets unmounted, the previously used title will be restored.
 */
export const useTitle = (inString: string) => {
	useEffect(() => {
		const previousTitle = document.title;
		document.title = inString;
		return () => {
			document.title = previousTitle;
		};
	});
};
