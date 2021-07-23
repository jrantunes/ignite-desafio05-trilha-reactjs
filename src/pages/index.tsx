import { useState, useEffect } from 'react';
import { GetStaticProps } from 'next';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Prismic from '@prismicio/client';

import { FiCalendar, FiUser } from 'react-icons/fi';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../components/Header';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
  preview: boolean;
}

export default function Home({
  postsPagination,
  preview,
}: HomeProps): JSX.Element {
  const [nextPage, setNextPage] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);

  function handleLoadMorePosts(): void {
    try {
      fetch(nextPage).then(result =>
        result.json().then(response => {
          const formattedLoadedPosts = response.results.map(post => {
            return {
              uid: post.uid,
              first_publication_date: post.first_publication_date,
              data: {
                title: post.data.title,
                subtitle: post.data.subtitle,
                author: post.data.author,
              },
            };
          });

          setNextPage(response.next_page);
          setPosts([...posts, ...formattedLoadedPosts]);
        })
      );
    } catch (err) {
      console.log(err);
    }
  }

  useEffect(() => {
    setNextPage(postsPagination.next_page);
    setPosts(postsPagination.results);
  }, [postsPagination.next_page, postsPagination.results]);

  return (
    <div className={commonStyles.content}>
      <Head>
        <title>spacetraveling | Home</title>
      </Head>

      <Header />

      <main className={styles.container}>
        <section className={styles.posts}>
          {posts.map(post => (
            <Link href={`/post/${post.uid}`} key={post.uid}>
              <a>
                <h2>{post.data.title}</h2>
                <p>{post.data.subtitle}</p>
                <div className={styles.postInfo}>
                  <span
                    style={{ color: !post.first_publication_date && '#FF57B2' }}
                  >
                    {post.first_publication_date ? (
                      <>
                        <FiCalendar size={20} color="#BBBBBB" />
                        {format(
                          new Date(post.first_publication_date),
                          'dd MMM yyyy',
                          { locale: ptBR }
                        )}
                      </>
                    ) : (
                      'Não publicado'
                    )}
                  </span>
                  <span>
                    <FiUser size={20} color="#BBBBBB" />
                    {post.data.author}
                  </span>
                </div>
              </a>
            </Link>
          ))}

          {nextPage && (
            <button type="button" onClick={handleLoadMorePosts}>
              Carregar mais posts
            </button>
          )}
        </section>
      </main>

      {preview && (
        <aside>
          <Link href="/api/exit-preview">
            <a>Sair do modo Preview</a>
          </Link>
        </aside>
      )}
    </div>
  );
}

export const getStaticProps: GetStaticProps<HomeProps> = async ({
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      fetch: ['post.title', 'post.subtitle', 'post.author'],
      ref: previewData?.ref ?? null,
      pageSize: 20,
    }
  );

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: posts,
      },
      preview,
    },
  };
};
