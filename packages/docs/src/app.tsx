/**
 * Root application component for the docs micro-frontend.
 *
 * Owns the top-level routing for the `/docs` zone. This app is served
 * independently via the Turborepo microfrontends proxy and handles
 * all routes under the `/docs` prefix.
 *
 * @module app
 */

import { Layout } from '@docs/components/layout';
import { Home } from '@docs/routes/home';
import { NotFound } from '@rainestack/ui/components/blocks/not-found';
import { BrowserRouter, Route, Routes } from 'react-router';

export function App() {
	return (
		<BrowserRouter basename="/docs">
			<Routes>
				<Route element={<Layout />}>
					<Route index element={<Home />} />
					<Route path="*" element={<NotFound homeHref="/docs" homeLabel="Back to docs" />} />
				</Route>
			</Routes>
		</BrowserRouter>
	);
}
