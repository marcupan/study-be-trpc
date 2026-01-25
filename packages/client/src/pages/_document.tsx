import { Head, Html, Main, NextScript } from 'next/document';

export default function Document() {
  // Type assertion needed due to React 19 stricter types with Next.js 16.1.4
  // See: https://github.com/vercel/next.js/discussions/74985
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const HeadComponent = Head as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const NextScriptComponent = NextScript as any;

  return (
    <Html lang="en">
      <HeadComponent />
      <body>
        <Main />
        <NextScriptComponent />
      </body>
    </Html>
  );
}
