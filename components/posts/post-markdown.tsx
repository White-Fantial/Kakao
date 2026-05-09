import Markdown from 'react-markdown';

type PostMarkdownProps = {
  body: string;
};

export function PostMarkdown({ body }: PostMarkdownProps) {
  return (
    <div className="space-y-3 text-base leading-7 break-words">
      <Markdown
        skipHtml
        components={{
          h1: ({ children }) => <h1 className="text-2xl font-semibold">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-semibold">{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg font-semibold">{children}</h3>,
          p: ({ children }) => <p className="whitespace-pre-wrap">{children}</p>,
          ul: ({ children }) => <ul className="list-disc space-y-1 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal space-y-1 pl-5">{children}</ol>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-zinc-300 pl-4 text-zinc-700">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="rounded bg-zinc-100 px-1 py-0.5 text-sm">{children}</code>
          ),
          pre: ({ children }) => (
            <pre className="overflow-x-auto rounded-md bg-zinc-900 p-3 text-sm text-zinc-100">
              {children}
            </pre>
          ),
        }}
      >
        {body}
      </Markdown>
    </div>
  );
}
