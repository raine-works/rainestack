/**
 * Root application component for the docs micro-frontend.
 *
 * Owns the top-level routing for the `/docs` zone. This app is served
 * independently via the Turborepo microfrontends proxy and handles
 * all routes under the `/docs` prefix.
 *
 * @module app
 */

import { DocsLayout } from '@docs/components/docs-layout';
import { DocPage } from '@docs/routes/doc-page';
import { Home } from '@docs/routes/home';
import { BrowserRouter, Link, Route, Routes } from 'react-router';

export function App() {
	return (
		<BrowserRouter basename="/docs">
			<Routes>
				<Route index element={<Home />} />
				<Route path="getting-started" element={<DocPage slug="getting-started" />} />
				<Route path="monorepo" element={<DocPage slug="monorepo" />} />
				<Route path="database" element={<DocPage slug="database" />} />
				<Route path="api" element={<DocPage slug="api" />} />
				<Route path="microfrontends" element={<DocPage slug="microfrontends" />} />
				<Route path="ui-components" element={<DocPage slug="ui-components" />} />
				<Route path="authentication" element={<DocPage slug="authentication" />} />
				<Route path="error-handling" element={<DocPage slug="error-handling" />} />
				<Route path="temporal" element={<DocPage slug="temporal" />} />
				<Route
					path="*"
					element={
						<DocsLayout>
							<div className="py-12 text-center">
								<h1 className="text-4xl font-bold mb-4">Page Not Found</h1>
								<p className="text-muted-foreground mb-6">The documentation page you're looking for doesn't exist.</p>
								<Link to="/" className="text-primary hover:underline">
									Back to documentation
								</Link>
							</div>
						</DocsLayout>
					}
				/>
			</Routes>
		</BrowserRouter>
	);
}
