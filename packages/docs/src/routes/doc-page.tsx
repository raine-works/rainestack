/**
 * Dynamic documentation page component.
 *
 * Fetches markdown content from the docs directory and renders it
 * with the MarkdownContent component. Handles loading and error states.
 *
 * @module routes/doc-page
 */

import { DocsLayout } from '@docs/components/docs-layout';
import { MarkdownContent } from '@docs/components/markdown-content';
import { Alert, AlertDescription, AlertTitle } from '@rainestack/ui/components/ui/alert';
import { Button } from '@rainestack/ui/components/ui/button';
import { Skeleton } from '@rainestack/ui/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';

interface DocPageProps {
	slug: string;
}

export function DocPage({ slug }: DocPageProps) {
	const [content, setContent] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let mounted = true;

		async function fetchMarkdown() {
			setLoading(true);
			setError(null);

			try {
				// Fetch markdown from the docs directory in the repository
				// In development, we'll fetch from the raw GitHub URL or a local endpoint
				// In production, the markdown files should be served statically
				const response = await fetch(`/docs/${slug}.md`);

				if (!response.ok) {
					throw new Error(`Failed to load documentation: ${response.statusText}`);
				}

				const text = await response.text();

				if (mounted) {
					setContent(text);
				}
			} catch (err) {
				if (mounted) {
					setError(err instanceof Error ? err.message : 'Failed to load documentation');
				}
			} finally {
				if (mounted) {
					setLoading(false);
				}
			}
		}

		fetchMarkdown();

		return () => {
			mounted = false;
		};
	}, [slug]);

	if (loading) {
		return (
			<DocsLayout>
				<div className="space-y-6">
					<Skeleton className="h-12 w-3/4" />
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-2/3" />
					<Skeleton className="h-48 w-full" />
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-5/6" />
				</div>
			</DocsLayout>
		);
	}

	if (error || !content) {
		return (
			<DocsLayout>
				<Alert variant="destructive">
					<AlertCircle className="size-4" />
					<AlertTitle>Error Loading Documentation</AlertTitle>
					<AlertDescription>{error || 'Documentation not found'}</AlertDescription>
				</Alert>
				<div className="mt-6">
					<Link to="/">
						<Button variant="outline">Back to Documentation</Button>
					</Link>
				</div>
			</DocsLayout>
		);
	}

	return (
		<DocsLayout>
			<MarkdownContent content={content} />
		</DocsLayout>
	);
}
