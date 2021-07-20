import Prismic from '@prismicio/client';
import { DefaultClient } from '@prismicio/client/types/client';

export function getPrismicClient(req?: unknown): DefaultClient {
  const prismic = Prismic.client(process.env.PRISMIC_API_ENDPOINT, {
    accessToken: 'MC5ZUGJadmhBQUFDRUEwYlVU.77-977-977-977-977-9QGTvv70o77-977-977-977-977-9Ue-_ve-_vQEfVTrvv73vv70j77-9MO-_ve-_vXvvv73vv73vv70',
    req,
  });

  return prismic;
}
