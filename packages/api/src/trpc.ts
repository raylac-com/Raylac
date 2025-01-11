import * as Sentry from '@sentry/node';
import { initTRPC } from '@trpc/server';
import type { Context } from './context';
import { ZodError } from 'zod';
import { logger } from '@raylac/shared-backend';

// Custom error types for better error handling
const TRPCError = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

const t = initTRPC.context<Context>().create({
  errorFormatter(opts) {
    const { shape, error } = opts;

    // Enhanced error logging with more context
    logger.error(`API Error: ${error.message}`, {
      code: error.code,
      path: opts.path,
      type: error instanceof ZodError ? TRPCError.VALIDATION_ERROR : error.code,
      data:
        error.cause instanceof ZodError ? error.cause.flatten() : error.cause,
      stack: error.stack,
    });

    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.code === 'BAD_REQUEST' && error.cause instanceof ZodError
            ? error.cause?.flatten()
            : null,
        errorType:
          error instanceof ZodError ? TRPCError.VALIDATION_ERROR : error.code,
      },
    };
  },
});

export const router = t.router;
export const createCallerFactory = t.createCallerFactory;

// Custom error handling middleware
const errorMiddleware = t.middleware(async ({ path, type, next }) => {
  try {
    return await next();
  } catch (error) {
    // Log the error with consistent format
    logger.error(`API Error in ${path} (${type})`, {
      path,
      type,
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : error,
    });

    // Rethrow with proper error type
    if (error instanceof ZodError) {
      throw new Error(TRPCError.VALIDATION_ERROR);
    } else if (
      error instanceof Error &&
      error.message.includes('unauthorized')
    ) {
      throw new Error(TRPCError.UNAUTHORIZED);
    } else if (error instanceof Error && error.message.includes('not found')) {
      throw new Error(TRPCError.NOT_FOUND);
    }

    // Default to internal error
    throw new Error(TRPCError.INTERNAL_ERROR);
  }
});

const sentryMiddleware = t.middleware(
  Sentry.trpcMiddleware({
    attachRpcInput: true,
  })
);

// Combine middlewares
const sentrifiedProcedure = t.procedure
  .use(errorMiddleware)
  .use(sentryMiddleware);

export const publicProcedure = sentrifiedProcedure;
