import { IPaginationOptions } from '../interfaces/paginations';

export interface IOptionsResult {
  page: number;
  limit: number;
  skip: number;
  sortBy: string;
  sortOrder: string;
}

export const calculatePagination = (options: IPaginationOptions) => {
  const page = options.page && options.page > 0 ? options.page : 1;
  const limit = options.limit && options.limit > 0 ? options.limit : 10;
  const skip = (page - 1) * limit;

  const sortBy = options.sortBy;
  const sortOrder: 'asc' | 'desc' =
    options.sortOrder === 'desc' ? 'desc' : 'asc';

  return { page, limit, skip, sortBy, sortOrder };
};
