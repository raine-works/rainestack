/**
 * Professional documentation layout component.
 *
 * Provides a sidebar navigation, table of contents, breadcrumbs,
 * and responsive mobile menu for documentation pages.
 *
 * @module components/docs-layout
 */

import { Button } from '@rainestack/ui/components/ui/button';
import { ScrollArea } from '@rainestack/ui/components/ui/scroll-area';
import { Separator } from '@rainestack/ui/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@rainestack/ui/components/ui/sheet';
import { cn } from '@rainestack/ui/lib/utils';
import {
	AlertCircle,
	BookOpen,
	Clock,
	Code,
	Database,
	FileText,
	Home,
	Menu,
	Package,
	Server,
	Shield
} from 'lucide-react';
import { Link, useLocation } from 'react-router';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NavSection {
	title: string;
	items: NavItem[];
}

interface NavItem {
	title: string;
	href: string;
	icon?: React.ComponentType<{ className?: string }>;
}

// ---------------------------------------------------------------------------
// Navigation Structure
// ---------------------------------------------------------------------------

const navigation: NavSection[] = [
	{
		title: 'Getting Started',
		items: [
			{ title: 'Introduction', href: '/', icon: Home },
			{ title: 'Installation', href: '/getting-started', icon: Package }
		]
	},
	{
		title: 'Core Concepts',
		items: [
			{ title: 'Monorepo Architecture', href: '/monorepo', icon: FileText },
			{ title: 'Database Guide', href: '/database', icon: Database },
			{ title: 'API Development', href: '/api', icon: Code },
			{ title: 'Micro-Frontends', href: '/microfrontends', icon: Server }
		]
	},
	{
		title: 'Features',
		items: [
			{ title: 'UI Components', href: '/ui-components', icon: BookOpen },
			{ title: 'Authentication', href: '/authentication', icon: Shield },
			{ title: 'Error Handling', href: '/error-handling', icon: AlertCircle },
			{ title: 'Temporal API', href: '/temporal', icon: Clock }
		]
	}
];

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
	const location = useLocation();
	const currentPath = location.pathname;

	return (
		<nav className="space-y-6">
			{navigation.map((section) => (
				<div key={section.title}>
					<h4 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
						{section.title}
					</h4>
					<div className="space-y-1">
						{section.items.map((item) => {
							const isActive = currentPath === item.href;
							const Icon = item.icon;

							return (
								<Link
									key={item.href}
									to={item.href}
									onClick={onNavigate}
									className={cn(
										'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all',
										'hover:bg-accent hover:text-accent-foreground',
										isActive ? 'bg-primary text-primary-foreground font-medium' : 'text-muted-foreground'
									)}
								>
									{Icon && <Icon className="size-4 shrink-0" />}
									<span>{item.title}</span>
								</Link>
							);
						})}
					</div>
				</div>
			))}
		</nav>
	);
}

function Sidebar() {
	return (
		<aside className="fixed top-14 z-30 hidden h-[calc(100vh-3.5rem)] w-64 shrink-0 border-r bg-background md:sticky md:block">
			<ScrollArea className="h-full py-6 px-4">
				<NavLinks />
			</ScrollArea>
		</aside>
	);
}

function MobileNav() {
	return (
		<Sheet>
			<SheetTrigger>
				<Button variant="outline" size="icon" className="md:hidden">
					<Menu className="size-5" />
					<span className="sr-only">Toggle navigation</span>
				</Button>
			</SheetTrigger>
			<SheetContent side="left" className="w-64 p-0">
				<div className="flex h-14 items-center border-b px-4">
					<Link to="/" className="flex items-center gap-2 font-semibold">
						<BookOpen className="size-5" />
						<span>Documentation</span>
					</Link>
				</div>
				<ScrollArea className="h-[calc(100vh-3.5rem)] py-6 px-4">
					<NavLinks onNavigate={() => document.body.click()} />
				</ScrollArea>
			</SheetContent>
		</Sheet>
	);
}

function Breadcrumbs() {
	const location = useLocation();
	const pathSegments = location.pathname.split('/').filter(Boolean);

	if (pathSegments.length <= 1) return null;

	return (
		<nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
			<Link to="/" className="hover:text-foreground transition-colors">
				Documentation
			</Link>
			{pathSegments.slice(1).map((segment, index) => {
				const href = `/${pathSegments.slice(0, index + 2).join('/')}`;
				const isLast = index === pathSegments.length - 2;
				const title = segment
					.split('-')
					.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
					.join(' ');

				return (
					<span key={segment} className="flex items-center gap-2">
						<span>/</span>
						{isLast ? (
							<span className="text-foreground font-medium">{title}</span>
						) : (
							<Link to={href} className="hover:text-foreground transition-colors">
								{title}
							</Link>
						)}
					</span>
				);
			})}
		</nav>
	);
}

// ---------------------------------------------------------------------------
// Main Layout
// ---------------------------------------------------------------------------

interface DocsLayoutProps {
	children: React.ReactNode;
}

export function DocsLayout({ children }: DocsLayoutProps) {
	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
			<header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
				<div className="container flex h-14 items-center justify-between">
					<div className="flex items-center gap-4">
						<MobileNav />
						<Link to="/" className="flex items-center gap-2 font-semibold">
							<BookOpen className="size-5" />
							<span className="hidden sm:inline">RaineStack Docs</span>
						</Link>
					</div>

					<div className="flex items-center gap-2">
						<Link to="/">
							<Button variant="ghost" size="sm">
								<Home className="mr-2 size-4" />
								Back to App
							</Button>
						</Link>
						<Separator orientation="vertical" className="h-6" />
						<a
							href={`https://client.scalar.com/?url=${encodeURIComponent(`${location.origin}/api/openapi.json`)}`}
							target="_blank"
							rel="noopener noreferrer"
						>
							<Button variant="ghost" size="sm">
								<Code className="mr-2 size-4" />
								API Reference
							</Button>
						</a>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<div className="container flex-1">
				<div className="flex gap-6 lg:gap-10">
					<Sidebar />

					{/* Content Area */}
					<main className="flex-1 py-6 lg:py-8">
						<div className="mx-auto max-w-3xl">
							<Breadcrumbs />
							{children}
						</div>
					</main>

					{/* Right Sidebar - Table of Contents (future) */}
					<aside className="hidden xl:block w-64 shrink-0">
						<div className="sticky top-20 py-6">
							<h4 className="mb-2 text-sm font-semibold">On This Page</h4>
							<div className="text-sm text-muted-foreground">
								<p className="py-1">Table of contents coming soon...</p>
							</div>
						</div>
					</aside>
				</div>
			</div>

			{/* Footer */}
			<footer className="border-t">
				<div className="container py-6 md:py-8">
					<div className="flex flex-col items-center justify-between gap-4 md:flex-row">
						<p className="text-center text-sm text-muted-foreground md:text-left">
							Built with RaineStack. Documentation powered by Markdown.
						</p>
						<div className="flex items-center gap-4">
							<a
								href="https://github.com/yourusername/rainestack"
								target="_blank"
								rel="noopener noreferrer"
								className="text-sm text-muted-foreground hover:text-foreground transition-colors"
							>
								GitHub
							</a>
							<Separator orientation="vertical" className="h-4" />
							<Link
								to="/getting-started"
								className="text-sm text-muted-foreground hover:text-foreground transition-colors"
							>
								Get Started
							</Link>
						</div>
					</div>
				</div>
			</footer>
		</div>
	);
}
