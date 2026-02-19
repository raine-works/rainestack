/**
 * Home route — landing page for the web shell.
 *
 * Displays a welcome hero section with quick links to explore the
 * API and documentation. This is the default route mounted at `/`.
 *
 * @module routes/home
 */

import { Button } from '@rainestack/ui/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@rainestack/ui/components/ui/card';
import { BookOpen, Code, Database, Layers, Rocket, Zap } from 'lucide-react';

// ---------------------------------------------------------------------------
// Feature cards
// ---------------------------------------------------------------------------

const features = [
	{
		icon: Layers,
		title: 'Turborepo Monorepo',
		description: 'All packages, apps, and shared libraries in a single repository with blazing-fast builds.'
	},
	{
		icon: Database,
		title: 'Prisma + PostgreSQL',
		description: 'Type-safe database access with audit triggers, LISTEN/NOTIFY, and automatic change tracking.'
	},
	{
		icon: Zap,
		title: 'oRPC + OpenAPI',
		description: 'End-to-end type-safe API with auto-generated OpenAPI spec and contract-driven clients.'
	},
	{
		icon: Code,
		title: 'Micro-Frontends',
		description: 'Independent React apps served through a unified proxy with shared UI components.'
	},
	{
		icon: Rocket,
		title: 'Bun Runtime',
		description: 'Lightning-fast server powered by Bun with hot-reloading and native TypeScript support.'
	},
	{
		icon: BookOpen,
		title: 'ShadCN UI',
		description: 'Beautiful, accessible components built with Tailwind CSS, Radix, and class-variance-authority.'
	}
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Home() {
	return (
		<div className="flex min-h-screen flex-col">
			{/* Hero */}
			<section className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-24 text-center">
				<div className="flex flex-col items-center gap-4">
					<h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
						Raine<span className="text-primary">Stack</span>
					</h1>
					<p className="max-w-xl text-lg text-muted-foreground">
						A full-stack monorepo starter with Turborepo, React micro-frontends, oRPC, Prisma, and ShadCN UI &mdash;
						ready to build on.
					</p>
				</div>

				<div className="flex gap-3">
					<a href="/docs">
						<Button size="lg" variant="outline">
							<BookOpen className="size-4" />
							Documentation
						</Button>
					</a>
				</div>
			</section>

			{/* Features */}
			<section className="mx-auto w-full max-w-5xl px-6 pb-24">
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{features.map((feature) => (
						<Card key={feature.title} className="transition-shadow hover:shadow-md">
							<CardHeader>
								<feature.icon className="size-8 text-primary" />
								<CardTitle className="mt-2">{feature.title}</CardTitle>
								<CardDescription>{feature.description}</CardDescription>
							</CardHeader>
							<CardContent />
						</Card>
					))}
				</div>
			</section>

			{/* Footer */}
			<footer className="border-t py-6 text-center text-sm text-muted-foreground">
				<p>
					RaineStack &middot; Built with{' '}
					<a
						href="https://turbo.build"
						className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
						target="_blank"
						rel="noopener noreferrer"
					>
						Turborepo
					</a>
					,{' '}
					<a
						href="https://orpc.unnoq.com"
						className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
						target="_blank"
						rel="noopener noreferrer"
					>
						oRPC
					</a>
					, and{' '}
					<a
						href="https://ui.shadcn.com"
						className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
						target="_blank"
						rel="noopener noreferrer"
					>
						shadcn/ui
					</a>
				</p>
			</footer>
		</div>
	);
}
