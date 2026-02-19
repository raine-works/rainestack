/**
 * Markdown content renderer component.
 *
 * Renders markdown content with syntax highlighting, GitHub-flavored markdown,
 * and automatic heading anchors.
 *
 * @module components/markdown-content
 */

import { cn } from '@rainestack/ui/lib/utils';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';

interface MarkdownContentProps {
	content: string;
	className?: string;
}

export function MarkdownContent({ content, className }: MarkdownContentProps) {
	return (
		<div
			className={cn(
				// Base prose styling
				'prose prose-slate dark:prose-invert max-w-none',

				// Headings - professional hierarchy
				'prose-headings:scroll-mt-20 prose-headings:font-semibold prose-headings:tracking-tight',
				'prose-h1:text-4xl prose-h1:font-bold prose-h1:mb-6 prose-h1:mt-2',
				'prose-h2:text-2xl prose-h2:font-semibold prose-h2:mt-12 prose-h2:mb-4 prose-h2:border-b prose-h2:pb-3',
				'prose-h3:text-xl prose-h3:font-semibold prose-h3:mt-8 prose-h3:mb-3',
				'prose-h4:text-lg prose-h4:font-semibold prose-h4:mt-6 prose-h4:mb-2',

				// Paragraphs and text
				'prose-p:leading-7 prose-p:my-4 prose-p:text-muted-foreground',
				'prose-lead:text-xl prose-lead:text-muted-foreground',
				'prose-strong:font-semibold prose-strong:text-foreground',

				// Links - subtle primary color
				'prose-a:text-primary prose-a:font-medium prose-a:no-underline prose-a:transition-colors',
				'hover:prose-a:underline hover:prose-a:text-primary/80',

				// Inline code - distinct background
				'prose-code:rounded prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5',
				'prose-code:text-sm prose-code:font-mono prose-code:text-foreground',
				'prose-code:before:content-none prose-code:after:content-none',
				'prose-code:border prose-code:border-border/50',

				// Code blocks - elevated appearance
				'prose-pre:bg-muted prose-pre:border prose-pre:rounded-lg prose-pre:p-4',
				'prose-pre:overflow-x-auto prose-pre:my-6 prose-pre:shadow-sm',
				'prose-pre:ring-1 prose-pre:ring-border/50',

				// Blockquotes - distinctive styling
				'prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-6 prose-blockquote:py-1',
				'prose-blockquote:italic prose-blockquote:text-muted-foreground prose-blockquote:my-6',
				'prose-blockquote:bg-muted/30 prose-blockquote:rounded-r',

				// Lists - proper spacing
				'prose-ul:my-6 prose-ul:list-disc prose-ul:pl-6 prose-ul:space-y-2',
				'prose-ol:my-6 prose-ol:list-decimal prose-ol:pl-6 prose-ol:space-y-2',
				'prose-li:text-muted-foreground',
				'prose-li:marker:text-primary',

				// Tables - clean and modern
				'prose-table:my-8 prose-table:w-full prose-table:border-collapse prose-table:rounded-lg prose-table:overflow-hidden',
				'prose-table:shadow-sm prose-table:border prose-table:border-border',
				'prose-thead:bg-muted/50',
				'prose-th:border prose-th:border-border prose-th:bg-muted prose-th:px-4 prose-th:py-3',
				'prose-th:text-left prose-th:text-sm prose-th:font-semibold prose-th:text-foreground',
				'prose-td:border prose-td:border-border prose-td:px-4 prose-td:py-3 prose-td:text-sm',
				'prose-tbody:divide-y prose-tbody:divide-border',

				// Images and media
				'prose-img:rounded-lg prose-img:border prose-img:border-border prose-img:my-8 prose-img:shadow-md',

				// Horizontal rules
				'prose-hr:my-12 prose-hr:border-border',

				className
			)}
		>
			<ReactMarkdown
				remarkPlugins={[remarkGfm]}
				rehypePlugins={[
					rehypeRaw,
					rehypeSanitize,
					rehypeSlug,
					[
						rehypeAutolinkHeadings,
						{
							behavior: 'wrap',
							properties: {
								className: ['anchor']
							}
						}
					]
				]}
				components={{
					// Custom link component to handle internal links
					a: ({ href, children, ...props }) => {
						// Check if it's an internal link
						if (href?.startsWith('./') || href?.startsWith('/docs/')) {
							const to = href.startsWith('./') ? href.slice(2).replace('.md', '') : href.replace('.md', '');
							return (
								<Link to={to} {...props}>
									{children}
								</Link>
							);
						}

						// External link
						return (
							<a href={href} target="_blank" rel="noopener noreferrer" {...props}>
								{children}
							</a>
						);
					},

					// Custom code block component
					code: ({ className, children, ...props }) => {
						const match = /language-(\w+)/.exec(className || '');
						const isInline = !match;

						if (isInline) {
							return (
								<code className={className} {...props}>
									{children}
								</code>
							);
						}

						return (
							<code className={cn('block', className)} {...props}>
								{children}
							</code>
						);
					},

					// Custom table components with better styling
					table: ({ children, ...props }) => (
						<div className="my-6 w-full overflow-x-auto">
							<table {...props}>{children}</table>
						</div>
					)
				}}
			>
				{content}
			</ReactMarkdown>
		</div>
	);
}
