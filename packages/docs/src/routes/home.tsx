/**
 * Docs home route — landing page for the documentation zone.
 *
 * Displays a welcome section with links to key documentation topics
 * and API references. Mounted at `/docs` via the micro-frontend proxy.
 *
 * @module routes/home
 */

import { Button } from '@rainestack/ui/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@rainestack/ui/components/ui/card';
import { BookOpen, Code, Database, FileText, Server, Shield } from 'lucide-react';
import { Link } from 'react-router';

// ---------------------------------------------------------------------------
// Documentation sections
// ---------------------------------------------------------------------------

const sections = [
	{
		icon: Server,
		title: 'Getting Started',
		description: 'Set up your local development environment, run the database, and start the dev server.'
	},
	{
		icon: Code,
		title: 'API Reference',
		description: 'Explore the auto-generated OpenAPI specification and oRPC contract for all endpoints.',
		href: '/docs/api'
	},
	{
		icon: Database,
		title: 'Database',
		description: 'Prisma schema, migrations, LISTEN/NOTIFY triggers, and audit infrastructure.'
	},
	{
		icon: Shield,
		title: 'Authentication',
		description: 'JWT-based auth flow, token refresh, and actor-tracked transactions for audit trails.'
	},
	{
		icon: FileText,
		title: 'Architecture',
		description: 'Monorepo structure, micro-frontend proxy, package responsibilities, and data flow.'
	},
	{
		icon: BookOpen,
		title: 'UI Components',
		description: 'Shared ShadCN component library with Tailwind CSS theming and dark mode support.'
	}
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Home() {
	return (
		<div className="flex min-h-screen flex-col">
			{/* Hero */}
			<section className="flex flex-col items-center justify-center gap-6 px-6 py-20 text-center">
				<div className="flex flex-col items-center gap-3">
					<div className="flex items-center gap-2">
						<BookOpen className="size-10 text-primary" />
						<h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
							Raine<span className="text-primary">Stack</span> Docs
						</h1>
					</div>
					<p className="max-w-lg text-lg text-muted-foreground">
						Everything you need to understand, extend, and deploy the RaineStack full-stack monorepo.
					</p>
				</div>

				<div className="flex gap-3">
					<a
						href={`https://client.scalar.com/?url=${encodeURIComponent(`${location.origin}/api/openapi.json`)}`}
						target="_blank"
						rel="noopener noreferrer"
					>
						<Button size="lg">
							<Code className="size-4" />
							API Reference
						</Button>
					</a>
					<a href="/">
						<Button size="lg" variant="outline">
							Back to App
						</Button>
					</a>
				</div>
			</section>

			{/* Documentation sections */}
			<section className="mx-auto w-full max-w-5xl px-6 pb-20">
				<h2 className="mb-6 text-2xl font-semibold tracking-tight">Documentation</h2>
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{sections.map((section) => (
						<Card key={section.title} className="transition-shadow hover:shadow-md">
							<CardHeader>
								<section.icon className="size-7 text-primary" />
								<CardTitle className="mt-2">{section.title}</CardTitle>
								<CardDescription>{section.description}</CardDescription>
							</CardHeader>
							<CardContent>
								{section.href && (
									<Link to={section.href.replace('/docs/', '')}>
										<Button variant="link" size="sm" className="h-auto p-0">
											View &rarr;
										</Button>
									</Link>
								)}
							</CardContent>
						</Card>
					))}
				</div>
			</section>

			{/* Footer */}
			<footer className="mt-auto border-t py-6 text-center text-sm text-muted-foreground">
				<p>RaineStack Documentation</p>
			</footer>
		</div>
	);
}
