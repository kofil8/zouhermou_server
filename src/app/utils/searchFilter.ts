import { Prisma } from '@prisma/client';

const buildSearchFilter = (
  searchTerm: string,
): Prisma.PostWhereInput | object => {
  if (!searchTerm) {
    return {};
  }

  return {
    OR: [
      {
        title: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      },
      {
        description: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      },
    ],
  };
};

export default buildSearchFilter;
