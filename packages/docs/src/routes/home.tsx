/**
 * Docs home route — landing page for the documentation zone.
 *
 * Displays a welcome section with links to key documentation topics
 * and API references. Mounted at `/docs` via the micro-frontend proxy.
 *
 * @module routes/home
 */

import { DocsLayout } from '@docs/components/docs-layout';
import { Badge } from '@rainestack/ui/components/ui/badge';
import { Button } from '@rainestack/ui/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@rainestack/ui/components/ui/card';
import { Separator } from '@rainestack/ui/components/ui/separator';
import { AlertCircle, BookOpen, Clock, Code, Database, FileText, Package, Server, Shield } from 'lucide-react';
import { Link } from 'react-router';

// ---------------------------------------------------------------------------
// Documentation sections
// ---------------------------------------------------------------------------

const sections = [
	{
		icon: Server,
		title: 'Getting Started',
		description: 'Set up your local development environment, run the database, and start the dev server.',
		href: '/getting-started'
	},
	{
		icon: FileText,
		title: 'Monorepo Architecture',
		description: 'Package structure, dependency graph, Turborepo configuration, and build system.',
		href: '/monorepo'
	},
	{
		icon: Database,
		title: 'Database Guide',
		description: 'Prisma schema, PostgreSQL setup, actor transactions, and audit infrastructure.',
		href: '/database'
	},
	{
		icon: Code,
		title: 'API Development',
		description: 'oRPC routes, OpenAPI generation, type-safe clients, and TanStack Query integration.',
		href: '/api'
	},
	{
		icon: BookOpen,
		title: 'Micro-Frontends',
		description: 'Zone architecture, routing, development workflow, and deployment strategies.',
		href: '/microfrontends'
	},
	{
		icon: BookOpen,
		title: 'UI Components',
		description: 'shadcn/ui component library with Tailwind CSS theming and dark mode support.',
		href: '/ui-components'
	},
	{
		icon: Shield,
		title: 'Authentication',
		description: 'JWT tokens, OTP, OIDC providers (Google/GitHub), WebAuthn passkeys, and session management.',
		href: '/authentication'
	},
	{
		icon: Server,
		title: 'Error Handling',
		description: 'tryCatch utility, Prisma error handling, oRPC errors, and logging best practices.',
		href: '/error-handling'
	},
	{
		icon: Code,
		title: 'Temporal API',
		description: 'Modern date/time handling with the Temporal API polyfill across the stack.',
		href: '/temporal'
	}
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Home() {
	return (
		<DocsLayout>
			<div className="space-y-12">
				{/* Hero Section */}
				<section className="space-y-6 py-8">
					<div className="flex items-center gap-3 mb-4">
						<Badge variant="secondary" className="px-3 py-1">
							v1.0.0
						</Badge>
						<Badge variant="outline" className="px-3 py-1">
							TypeScript
						</Badge>
					</div>
					<div className="space-y-4">
						<h1 className="text-4xl font-bold tracking-tight lg:text-5xl">Welcome to RaineStack Documentation</h1>
						<p className="text-xl text-muted-foreground max-w-3xl">
							A modern, full-stack TypeScript monorepo powered by Bun, Turborepo, Prisma, and React. Everything you need
							to understand, extend, and deploy your application.
						</p>
					</div>
					<div className="flex flex-wrap gap-3 pt-4">
						<Link to="getting-started">
							<Button size="lg">
								<Package className="mr-2 size-4" />
								Get Started
							</Button>
						</Link>
						<a
							href={`https://client.scalar.com/?url=${encodeURIComponent(`${location.origin}/api/openapi.json`)}`}
							target="_blank"
							rel="noopener noreferrer"
						>
							<Button size="lg" variant="outline">
								<Code className="mr-2 size-4" />
								API Reference
							</Button>
						</a>
						<a href="https://github.com/yourusername/rainestack" target="_blank" rel="noopener noreferrer">
							<Button size="lg" variant="outline">
								View on GitHub
							</Button>
						</a>
					</div>
				</section>

				<Separator />

				{/* Quick Start */}
				<section className="space-y-4">
					<h2 className="text-2xl font-semibold tracking-tight">Quick Start</h2>
					<div className="rounded-lg border bg-muted/50 p-6 space-y-4">
						<pre className="text-sm overflow-x-auto">
							<code className="font-mono">
								{`# Install dependencies
bun install

# Start PostgreSQL
bun run db:start
bun run db:dev

# Start all development servers
bun run dev`}
							</code>
						</pre>
						<p className="text-sm text-muted-foreground">
							Your app will be available at{' '}
							<code className="text-foreground bg-muted px-1.5 py-0.5 rounded">http://localhost:3024</code>
						</p>
					</div>
				</section>

				<Separator />

				{/* Documentation Grid */}
				<section className="space-y-6">
					<div>
						<h2 className="text-2xl font-semibold tracking-tight mb-2">Documentation</h2>
						<p className="text-muted-foreground">
							Explore comprehensive guides and references to get the most out of RaineStack.
						</p>
					</div>
					<div className="grid gap-6 sm:grid-cols-2">
						{sections.map((section) => (
							<Link key={section.title} to={section.href} className="group">
								<Card className="h-full transition-all hover:shadow-lg hover:border-primary/50 hover:-translate-y-1">
									<CardHeader>
										<div className="flex items-start justify-between">
											<section.icon className="size-8 text-primary" />
										</div>
										<CardTitle className="mt-4 group-hover:text-primary transition-colors">{section.title}</CardTitle>
										<CardDescription className="line-clamp-2">{section.description}</CardDescription>
									</CardHeader>
									<CardContent>
										<span className="text-sm font-medium text-primary group-hover:underline">Read more →</span>
									</CardContent>
								</Card>
							</Link>
						))}
					</div>
				</section>

				<Separator />

				{/* Features Grid */}
				<section className="space-y-6">
					<div>
						<h2 className="text-2xl font-semibold tracking-tight mb-2">Key Features</h2>
						<p className="text-muted-foreground">What makes RaineStack different.</p>
					</div>
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						<Card>
							<CardHeader>
								<Shield className="size-6 text-primary mb-2" />
								<CardTitle className="text-lg">Type Safety First</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground">
									End-to-end TypeScript with full type inference from database to UI components.
								</p>
							</CardContent>
						</Card>
						<Card>
							<CardHeader>
								<Database className="size-6 text-primary mb-2" />
								<CardTitle className="text-lg">Audit Everything</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground">
									Automatic change tracking with actor attribution for full compliance.
								</p>
							</CardContent>
						</Card>
						<Card>
							<CardHeader>
								<Code className="size-6 text-primary mb-2" />
								<CardTitle className="text-lg">Contract-First APIs</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground">
									Define once with Zod, get validation, docs, and type-safe clients automatically.
								</p>
							</CardContent>
						</Card>
						<Card>
							<CardHeader>
								<Server className="size-6 text-primary mb-2" />
								<CardTitle className="text-lg">Micro-Frontends</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground">
									Independent React apps with shared infrastructure for scalable development.
								</p>
							</CardContent>
						</Card>
						<Card>
							<CardHeader>
								<Clock className="size-6 text-primary mb-2" />
								<CardTitle className="text-lg">Modern Date/Time</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground">
									Temporal API throughout the stack for timezone-aware, immutable date handling.
								</p>
							</CardContent>
						</Card>
						<Card>
							<CardHeader>
								<AlertCircle className="size-6 text-primary mb-2" />
								<CardTitle className="text-lg">Explicit Errors</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground">
									Type-safe error handling with discriminated unions via tryCatch utility.
								</p>
							</CardContent>
						</Card>
					</div>
				</section>
			</div>
		</DocsLayout>
	);
}
