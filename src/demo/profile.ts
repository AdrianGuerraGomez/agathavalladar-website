import type { SiteProfile } from '@/types/content';

/** Perfil por defecto: mismo contenido que inserta la migración inicial. */
export const defaultProfile: SiteProfile = {
  headline: 'Investigadora | Política exterior | Relaciones internacionales',
  home_intro:
    'Análisis sobre la política exterior de Estados Unidos, las relaciones transatlánticas y el lugar de Europa en el orden internacional.',
  home_about:
    'Investigadora becada en el Instituto Franklin. Mi trabajo examina cómo se formula la política exterior estadounidense y qué consecuencias tiene para la Unión Europea y para la relación entre ambas orillas del Atlántico.',
  about_intro:
    '<p>Soy investigadora becada en el Instituto Franklin. Mi actividad se centra en la investigación, el análisis y la publicación de artículos sobre política exterior estadounidense, relaciones internacionales y relaciones transatlánticas.</p>',
  research_profile:
    '<p>Mi trabajo aborda la política exterior de Estados Unidos y sus efectos sobre Europa, el papel de la Unión Europea como actor internacional y la estrategia geopolítica que define la relación entre ambos.</p>',
  franklin: '<p>Desarrollo mi investigación como becaria en el Instituto Franklin.</p>',
  trajectory: '',
  research_lines: [
    { title: 'Política exterior estadounidense', description: 'Prioridades, instituciones y procesos de decisión que definen el papel de Estados Unidos en el mundo.' },
    { title: 'Relaciones transatlánticas', description: 'La relación entre Estados Unidos y Europa en seguridad, comercio y gobernanza global.' },
    { title: 'Unión Europea', description: 'La acción exterior de la UE y su capacidad para actuar como actor geopolítico.' },
    { title: 'Estrategia geopolítica', description: 'Competencia entre potencias, alianzas y equilibrios en el sistema internacional.' },
    { title: 'Relaciones internacionales', description: 'Marcos analíticos para entender el orden internacional y sus transformaciones.' },
  ],
  contact_email: 'contacto@agathavalladar.es', // provisional
  contact_phone: '+34 949 000 000', // provisional
  linkedin_url: null,
  x_url: null,
  location: 'Guadalajara, Castilla-La Mancha, España',
};
