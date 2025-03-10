import z from 'zod';
const registerUser = z.object({
  body: z.object({
    email: z
      .string({
        required_error: 'Email is required!',
      })
      .email({
        message: 'Invalid email format!',
      }),
    password: z
      .string({
        required_error: 'Password is required!',
      })
      .min(8, 'Password must be at least 8 characters long'),
    name: z
      .string({
        required_error: 'Name is required!',
      })
      .min(3, 'Name must be at least 3 characters long')
      .max(50, 'Name must be at most 50 characters long'),
  }),
});

const forgotPassword = z.object({
  body: z.object({
    email: z
      .string({
        required_error: 'Email is required!',
      })
      .email({
        message: 'Invalid email format!',
      }),
  }),
});

const verifyOtp = z.object({
  body: z.object({
    email: z
      .string({
        required_error: 'Email is required!',
      })
      .email({
        message: 'Invalid email format!',
      }),
    otp: z.number({
      required_error: 'OTP is required!',
    }),
  }),
});

const resendOtp = z.object({
  body: z.object({
    email: z
      .string({
        required_error: 'Email is required!',
      })
      .email({
        message: 'Invalid email format!',
      }),
  }),
});

const resetPassword = z.object({
  body: z.object({
    password: z.string({
      required_error: 'Password is required!',
    }),
  }),
});

const changePassword = z.object({
  body: z.object({
    newPassword: z.string({
      required_error: 'New password is required!',
    }),
  }),
});

export const UserValidations = {
  registerUser,
  resendOtp,
  forgotPassword,
  verifyOtp,
  resetPassword,
  changePassword,
};
