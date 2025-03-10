import { z } from 'zod';

const favoriteValidationSchema = z.object({
  body: z.object({
    favoritedUserId: z.string({
      required_error: 'favoritedUserId is required',
    }),
  }),
});

export const favoriteValidation = { favoriteValidationSchema };
