import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { trpc } from '../../utils/trpc';

export default function BoardDetail() {
  const router = useRouter();
  const { id } = router.query;
  const boardId = typeof id === 'string' ? id : '';

  // Fetch board details
  const {
    data: board,
    isLoading: isBoardLoading,
    error: boardError,
  } = trpc.board.getById.useQuery(
    { id: boardId },
    {
      enabled: !!boardId,
      retry: false,
      onError: (error) => {
        console.error('Error fetching board:', error);
      },
    }
  );

  // Fetch tasks for the board
  const {
    data: tasks,
    isLoading: isTasksLoading,
    refetch: refetchTasks,
  } = trpc.task.getByBoardId.useQuery(
    { boardId },
    {
      enabled: !!boardId,
      retry: false,
      onError: (error) => {
        console.error('Error fetching tasks:', error);
      },
    }
  );

  // Group tasks by status
  const tasksByStatus = {
    Todo: tasks?.filter((task) => task.status === 'Todo') || [],
    InProgress: tasks?.filter((task) => task.status === 'InProgress') || [],
    Done: tasks?.filter((task) => task.status === 'Done') || [],
  };

  // Handle loading state
  if (isBoardLoading || isTasksLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Loading board...</p>
        </div>
      </Layout>
    );
  }

  // Handle error state
  if (boardError) {
    return (
      <Layout>
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
          <h3 className="text-lg font-medium">Error</h3>
          <p>{boardError.message}</p>
          <button
            onClick={() => router.push('/boards')}
            className="mt-4 text-sm text-blue-600 hover:text-blue-800"
          >
            Back to Boards
          </button>
        </div>
      </Layout>
    );
  }

  // Handle case where board is not found
  if (!board) {
    return (
      <Layout>
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md p-4">
          <h3 className="text-lg font-medium">Board Not Found</h3>
          <p>The board you're looking for doesn't exist or you don't have access to it.</p>
          <button
            onClick={() => router.push('/boards')}
            className="mt-4 text-sm text-blue-600 hover:text-blue-800"
          >
            Back to Boards
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={board.name}>
      {/* Board description */}
      {board.description && (
        <div className="mb-6">
          <p className="text-gray-600">{board.description}</p>
        </div>
      )}

      {/* Board info */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="bg-white shadow rounded-md p-4 flex-1">
          <h3 className="text-sm font-medium text-gray-500">Owner</h3>
          <p className="mt-1">{board.owner.name || board.owner.email}</p>
        </div>
        <div className="bg-white shadow rounded-md p-4 flex-1">
          <h3 className="text-sm font-medium text-gray-500">Created</h3>
          <p className="mt-1">{new Date(board.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="bg-white shadow rounded-md p-4 flex-1">
          <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
          <p className="mt-1">{new Date(board.updatedAt).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Tasks */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Tasks</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Todo column */}
          <div className="bg-gray-50 rounded-md p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Todo</h3>
            {tasksByStatus.Todo.length > 0 ? (
              <div className="space-y-4">
                {tasksByStatus.Todo.map((task) => (
                  <div key={task.id} className="bg-white shadow rounded-md p-4">
                    <h4 className="text-md font-medium text-gray-900">{task.title}</h4>
                    {task.description && (
                      <p className="mt-1 text-sm text-gray-500">{task.description}</p>
                    )}
                    {task.assignee && (
                      <div className="mt-2 flex items-center">
                        <span className="text-xs text-gray-500">
                          Assigned to: {task.assignee.name || task.assignee.email}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No tasks in this column</p>
            )}
          </div>

          {/* In Progress column */}
          <div className="bg-gray-50 rounded-md p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">In Progress</h3>
            {tasksByStatus.InProgress.length > 0 ? (
              <div className="space-y-4">
                {tasksByStatus.InProgress.map((task) => (
                  <div key={task.id} className="bg-white shadow rounded-md p-4">
                    <h4 className="text-md font-medium text-gray-900">{task.title}</h4>
                    {task.description && (
                      <p className="mt-1 text-sm text-gray-500">{task.description}</p>
                    )}
                    {task.assignee && (
                      <div className="mt-2 flex items-center">
                        <span className="text-xs text-gray-500">
                          Assigned to: {task.assignee.name || task.assignee.email}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No tasks in this column</p>
            )}
          </div>

          {/* Done column */}
          <div className="bg-gray-50 rounded-md p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Done</h3>
            {tasksByStatus.Done.length > 0 ? (
              <div className="space-y-4">
                {tasksByStatus.Done.map((task) => (
                  <div key={task.id} className="bg-white shadow rounded-md p-4">
                    <h4 className="text-md font-medium text-gray-900">{task.title}</h4>
                    {task.description && (
                      <p className="mt-1 text-sm text-gray-500">{task.description}</p>
                    )}
                    {task.assignee && (
                      <div className="mt-2 flex items-center">
                        <span className="text-xs text-gray-500">
                          Assigned to: {task.assignee.name || task.assignee.email}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No tasks in this column</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
