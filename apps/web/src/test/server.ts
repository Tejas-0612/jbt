import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/** The fake API: answers the app's real fetch() calls inside tests. */
export const server = setupServer(...handlers);
