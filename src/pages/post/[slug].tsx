import { useState, useEffect } from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { format, parseISO } from 'date-fns';
import { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client';
import ptBR from 'date-fns/locale/pt-BR';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../../components/Header';
import Comments from '../../components/Comments';
import PreviewButton from '../../components/PreviewButton';

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

type NeighborPost = {
  title: string;
  uid: string;
};
interface PostProps {
  post: Post;
  preview: boolean;
  previousPost: NeighborPost | null;
  nextPost: NeighborPost | null;
}

export default function Post({
  post,
  preview,
  previousPost,
  nextPost,
}: PostProps): JSX.Element {
  const [readingTime, setReadingTime] = useState(0);
  const router = useRouter();

  useEffect(() => {
    function calculateReadingTime(): number {
      const wordsCount = post.data.content.reduce((acc, data) => {
        const wordsArr = RichText.asText(data.body).split(' ');

        return acc + wordsArr.length;
      }, 0);

      const headingWordsCount = post.data.content.reduce(
        (acc, data) => acc + data.heading.split(' ').length,
        0
      );

      return Math.ceil((wordsCount + headingWordsCount) / 200);
    }

    const updatedReadingTime = calculateReadingTime();

    setReadingTime(updatedReadingTime);
  }, [post.data.content]);

  if (router.isFallback) {
    return <p>Carregando...</p>;
  }

  return (
    <>
      <Head>
        <title>spacetraveling | {post.data.title}</title>
      </Head>

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
              {post.first_publication_date ? (
                <>
                  <FiCalendar size={20} color="#BBBBBB" />
                  {format(
                    parseISO(post.first_publication_date),
                    'dd MMM yyyy',
                    {
                      locale: ptBR,
                    }
                  )}
                </>
              ) : (
                <p style={{ color: '#FF57B2' }}>Não publicado</p>
              )}
            </span>
            <span>
              <FiUser size={20} color="#BBBBBB" />
              {post.data.author}
            </span>
            <span>
              <FiClock size={20} color="#BBBBBB" /> {readingTime} min
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

        <div className={styles.paginationContainer}>
          <div>
            {previousPost && (
              <>
                <p>{previousPost.title}</p>
                <Link href={`/post/${previousPost.uid}`}>
                  <a>Post anterior</a>
                </Link>
              </>
            )}
          </div>

          <div>
            {nextPost && (
              <>
                <p>{nextPost.title}</p>
                <Link href={`/post/${nextPost.uid}`}>
                  <a>Próximo post</a>
                </Link>
              </>
            )}
          </div>
        </div>

        <Comments />

        {preview && <PreviewButton />}
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

function checkPostNeighborhood(post): NeighborPost | null {
  if (!post.results[0]) return null;

  return {
    title: post.results[0].data.title,
    uid: post.results[0].uid,
  };
}

export const getStaticProps: GetStaticProps<PostProps> = async ({
  params,
  preview = false,
  previewData,
}) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(slug), {
    ref: previewData?.ref ?? null,
  });

  const previousPostResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date desc]',
    }
  );

  const nextPostResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date]',
    }
  );

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

  const previousPost = checkPostNeighborhood(previousPostResponse);
  const nextPost = checkPostNeighborhood(nextPostResponse);

  return {
    props: {
      post,
      preview,
      previousPost,
      nextPost,
    },
    revalidate: 60 * 60 * 24, // 1 day
  };
};
