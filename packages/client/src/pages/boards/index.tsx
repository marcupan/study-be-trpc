import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { trpc } from '../../utils/trpc';

export default function BoardsList() {
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardDescription, setNewBoardDescription] = useState('');
  const [error, setError] = useState('');

  // Fetch all boards
  const { data: boardsData, isLoading, refetch } = trpc.board.getAll.useQuery();

  // Create board mutation
  const createBoardMutation = trpc.board.create.useMutation({
    onSuccess: () => {
      setIsCreateModalOpen(false);
      setNewBoardName('');
      setNewBoardDescription('');
      refetch();
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const handleCreateBoard = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newBoardName) {
      setError('Board name is required');
      return;
    }

    createBoardMutation.mutate({
      name: newBoardName,
      description: newBoardDescription || undefined,
    });
  };

  return (
    <Layout title="Your Boards">
      <div className="mb-6 flex justify-between items-center">
        <p className="text-gray-500">
          Manage your task boards and collaborations
        </p>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn btn-primary"
        >
          Create New Board
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-10">
          <p className="text-gray-500">Loading your boards...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Owned Boards */}
          {boardsData?.owned && boardsData.owned.length > 0 ? (
            boardsData.owned.map((board) => (
              <Link
                href={`/boards/${board.id}`}
                key={board.id}
                className="card hover:shadow-lg transition-shadow"
              >
                <h3 className="text-lg font-semibold text-gray-900">
                  {board.name}
                </h3>
                {board.description && (
                  <p className="mt-1 text-gray-500 text-sm line-clamp-2">
                    {board.description}
                  </p>
                )}
                <div className="mt-4 flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    Created{' '}
                    {new Date(board.createdAt).toLocaleDateString()}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Owner
                  </span>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full text-center py-10">
              <p className="text-gray-500">
                You don't have any boards yet. Create one to get started!
              </p>
            </div>
          )}

          {/* Collaborated Boards */}
          {boardsData?.collaborated && boardsData.collaborated.length > 0 && (
            <>
              <div className="col-span-full mt-8 mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Shared with you
                </h2>
              </div>
              {boardsData.collaborated.map((board) => (
                <Link
                  href={`/boards/${board.id}`}
                  key={board.id}
                  className="card hover:shadow-lg transition-shadow"
                >
                  <h3 className="text-lg font-semibold text-gray-900">
                    {board.name}
                  </h3>
                  {board.description && (
                    <p className="mt-1 text-gray-500 text-sm line-clamp-2">
                      {board.description}
                    </p>
                  )}
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      Owner: {board.owner.name || board.owner.email}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {board.accessLevel === 'write' ? 'Can Edit' : 'Read Only'}
                    </span>
                  </div>
                </Link>
              ))}
            </>
          )}
        </div>
      )}

      {/* Create Board Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Create New Board
            </h3>
            <form onSubmit={handleCreateBoard}>
              <div className="mb-4">
                <label
                  htmlFor="board-name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Board Name
                </label>
                <input
                  type="text"
                  id="board-name"
                  className="input w-full"
                  placeholder="Enter board name"
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  required
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="board-description"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Description (Optional)
                </label>
                <textarea
                  id="board-description"
                  className="input w-full"
                  placeholder="Enter board description"
                  rows={3}
                  value={newBoardDescription}
                  onChange={(e) => setNewBoardDescription(e.target.value)}
                />
              </div>

              {error && (
                <div className="text-red-500 text-sm mb-4">{error}</div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={createBoardMutation.isLoading}
                >
                  {createBoardMutation.isLoading
                    ? 'Creating...'
                    : 'Create Board'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
