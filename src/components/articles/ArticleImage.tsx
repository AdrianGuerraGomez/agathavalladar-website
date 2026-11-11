import type { CSSProperties } from 'react';
import { imageUrl } from '@/lib/images';
import { useParallax } from '@/lib/motion';
import type { ArticleImage as Img } from '@/types/content';
import styles from './articles.module.css';

interface Props {
  image: Img | null;
  ratio?: '3/2' | '16/9' | '4/3' | 'natural';
  priority?: boolean;
  sizes?: string;
  className?: string;
  /** Desplazamiento máximo (px) del parallax interno. Sin valor, imagen estática. */
  parallax?: number;
}

function frameStyle(image: Img | null, ratio: Props['ratio']): CSSProperties | undefined {
  if (ratio === 'natural') {
    return image?.width && image?.height ? { aspectRatio: `${image.width} / ${image.height}` } : undefined;
  }
  return { aspectRatio: ratio };
}

function Picture({ image, priority, sizes }: Pick<Props, 'image' | 'priority' | 'sizes'>) {
  const src = imageUrl(image);
  if (!src) return null;
  return (
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
  );
}

function ParallaxFrame({ image, ratio, priority, sizes, className, parallax }: Props) {
  const ref = useParallax<HTMLDivElement>(parallax);
  return (
    <div ref={ref} className={`${styles.imageFrame} parallax-media ${className ?? ''}`} style={frameStyle(image, ratio)}>
      <Picture image={image} priority={priority} sizes={sizes} />
    </div>
  );
}

/** Imagen editorial con proporción fija (evita saltos de maquetación) y carga diferida. */
export function ArticleImage({ image, ratio = '3/2', priority, sizes = '100vw', className, parallax }: Props) {
  if (parallax) {
    return <ParallaxFrame image={image} ratio={ratio} priority={priority} sizes={sizes} className={className} parallax={parallax} />;
  }
  return (
    <div className={`${styles.imageFrame} ${className ?? ''}`} style={frameStyle(image, ratio)}>
      <Picture image={image} priority={priority} sizes={sizes} />
    </div>
  );
}
