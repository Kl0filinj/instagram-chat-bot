import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { PaginationQuery } from '../dto';

export const GetPagination = createParamDecorator(
  (data, ctx: ExecutionContext): PaginationQuery => {
    const req: Request = ctx.switchToHttp().getRequest();
    const paginationParams: PaginationQuery = {
      OR: [],
      AND: [],
      skip: 0,
      limit: 20,
      search: '',
    };

    if (
      req.query.perPage &&
      !isNaN(parseInt(req.query.perPage.toString())) &&
      parseInt(req.query.perPage.toString()) > 0
    ) {
      paginationParams.limit = parseInt(req.query.perPage.toString());
    }

    if (
      req.query.page &&
      !isNaN(parseInt(req.query.page.toString())) &&
      parseInt(req.query.page.toString()) > 0
    ) {
      paginationParams.skip =
        (parseInt(req.query.page.toString()) - 1) * paginationParams.limit;
    }

    if (req.query.search) {
      paginationParams.search = req.query.search.toString();
    }

    return paginationParams;
  },
);
