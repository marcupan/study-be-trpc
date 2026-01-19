import { authRouter } from './auth';
import { boardRouter } from './board';
import { collaborationRouter } from './collaboration';
import { taskRouter } from './task';
import { router } from '../trpc';

export const appRouter = router({
  auth: authRouter,
  board: boardRouter,
  task: taskRouter,
  collaboration: collaborationRouter,
});

// Export type definition of API
export type AppRouter = typeof appRouter;
