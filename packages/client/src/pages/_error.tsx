import type { NextPageContext } from 'next';
import Head from 'next/head';
import Link from 'next/link';

type ErrorProps = {
  statusCode?: number;
};

function Error({ statusCode }: ErrorProps) {
  const title = statusCode === 404 ? 'Page Not Found' : 'An Error Occurred';
  const description =
    statusCode === 404
      ? 'The page you are looking for could not be found'
      : 'Sorry, something went wrong on our end';

  return (
    <>
      <Head>
        <title>
          {statusCode} - {title} | TaskSync
        </title>
        <meta name="description" content={description} />
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full text-center space-y-6 p-8">
          <div className="space-y-2">
            <h1 className="text-9xl font-bold text-gray-900">{statusCode ?? 'Error'}</h1>
            <h2 className="text-3xl font-bold text-gray-700">{title}</h2>
            <p className="text-gray-500">{description}</p>
            {statusCode === 500 && (
              <p className="text-sm text-gray-400 mt-4">
                Our team has been notified and is working to fix the issue.
              </p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/boards"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go to Boards
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;
