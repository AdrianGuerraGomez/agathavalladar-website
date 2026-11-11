import { imageUrl } from '@/lib/images';
import type { ArticleImage as Img } from '@/types/content';
import styles from './articles.module.css';

interface Props {
  image: Img | null;
  ratio?: '3/2' | '16/9' | '4/3' | 'natural';
  priority?: boolean;
  sizes?: string;
  className?: string;
}

/** Imagen editorial con proporción fija (evita saltos de maquetación) y carga diferida. */
export function ArticleImage({ image, ratio = '3/2', priority, sizes = '100vw', className }: Props) {
  const src = imageUrl(image);
  const style = ratio === 'natural'
    ? image?.width && image?.height ? { aspectRatio: `${image.width} / ${image.height}` } : undefined
    : { aspectRatio: ratio };
  return (
    <div className={`${styles.imageFrame} ${className ?? ''}`} style={style}>
      {src && (
        <img
          src={src}
          alt={image?.alt ?? ''}
          width={image?.width ?? undefined}
          height={image?.height ?? undefined}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          sizes={sizes}
          fetchPriority={priority ? 'high' : 'auto'}
        />
      )}
    </div>
  );
}
