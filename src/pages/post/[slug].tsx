import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { format, parseISO } from 'date-fns';
import { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client';
import ptBR from 'date-fns/locale/pt-BR';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  uid: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  if (router.isFallback) {
    return <p>Carregando...</p>;
  }

  return (
    <>
      <div
        style={{
          paddingLeft: '2rem',
          maxWidth: '700px',
          margin: '0 auto',
        }}
      >
        <Header />
      </div>

      {post.data.banner.url && (
        <div className={styles.banner}>
          <img src={post.data.banner.url} alt="banner" />
        </div>
      )}

      <main className={commonStyles.content}>
        <article className={styles.post}>
          <h1>{post.data.title}</h1>
          <div className={styles.postInfo}>
            <span>
              <FiCalendar size={20} color="#BBBBBB" />
              {format(parseISO(post.first_publication_date), 'dd MMM yyyy', {
                locale: ptBR,
              })}
            </span>
            <span>
              <FiUser size={20} color="#BBBBBB" />
              {post.data.author}
            </span>
            <span>
              <FiClock size={20} color="#BBBBBB" /> 4 min
            </span>
          </div>

          <div className={styles.postContent}>
            {post.data.content.map(({ heading, body }) => (
              <div key={heading}>
                {heading && <h2>{heading}</h2>}

                <div
                  dangerouslySetInnerHTML={{ __html: RichText.asHtml(body) }}
                />
              </div>
            ))}
          </div>
        </article>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      fetch: ['post.uid'],
      pageSize: 4,
    }
  );

  const paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths,
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(slug), {});

  const post: Post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: response.data.banner,
      content: response.data.content,
    },
  };

  return {
    props: { post },
    revalidate: 60 * 60 * 24, // 1 day
  };
};
