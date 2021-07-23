import Link from 'next/link';

import styles from './previewButton.module.scss';

export default function PreviewButton(): JSX.Element {
  return (
    <Link href="/api/exit-preview">
      <a className={styles.container}>Sair do modo Preview</a>
    </Link>
  );
}
