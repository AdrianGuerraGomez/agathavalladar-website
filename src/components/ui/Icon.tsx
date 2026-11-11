import { FontAwesomeIcon, type FontAwesomeIconProps } from '@fortawesome/react-fontawesome';

/** Icono decorativo por defecto (aria-hidden). Pasa `title` si transmite información. */
export function Icon(props: FontAwesomeIconProps) {
  return <FontAwesomeIcon aria-hidden={props.title ? undefined : true} {...props} />;
}
