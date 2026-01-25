import type { GetServerSideProps } from 'next';
import Head from 'next/head';

import Layout from '@/components/Layout';

type BoardDetailProps = {
  id: string;
};

export default function BoardDetail({ id }: BoardDetailProps) {
  return (
    <>
      <Head>
        <title>Board Details - TaskSync</title>
        <meta name="description" content="View and manage your task board" />
      </Head>
      <Layout title={`Board ${id}`} description="Manage tasks and collaborate with your team">
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-2xl font-bold">Board Details</h2>
          <p className="text-gray-600">Board ID: {id}</p>
          <p className="mt-4 text-sm text-gray-500">
            This page is under construction. Full board functionality will be implemented soon.
          </p>
        </div>
      </Layout>
    </>
  );
}

// eslint-disable-next-line @typescript-eslint/require-await
export const getServerSideProps: GetServerSideProps<BoardDetailProps> = async (context) => {
  const { id } = context.params as { id: string };

  return {
    props: {
      id,
    },
  };
};
