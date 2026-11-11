/**
 * CONTENIDO DE DEMOSTRACIÓN
 * -------------------------------------------------------------------------
 * Textos de ejemplo coherentes con el ámbito de la web, para ver el diseño
 * antes de publicar contenido real. No son trabajos de la autora.
 *
 * Fuente única: alimenta el modo demostración (sin Supabase) y genera
 * `supabase/seed.sql` con `npm run seed:generate`.
 * Este archivo no debe importar módulos (lo ejecuta Node directamente).
 */

export interface DemoCategory {
  slug: string;
  name: string;
  sort_order: number;
}

export interface DemoArticle {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  featured: boolean;
  published_at: string;
  cover: { path: string; alt: string; caption: string };
  secondary?: { path: string; alt: string; caption: string };
  body: string;
}

export const DEMO_NOTICE =
  '<p><em>Artículo de demostración. Este texto ilustra el formato editorial de la plataforma y puede eliminarse desde el panel de administración.</em></p>';

export const demoCategories: DemoCategory[] = [
  { slug: 'estados-unidos', name: 'Estados Unidos', sort_order: 10 },
  { slug: 'union-europea', name: 'Unión Europea', sort_order: 20 },
  { slug: 'relaciones-transatlanticas', name: 'Relaciones transatlánticas', sort_order: 30 },
  { slug: 'geopolitica', name: 'Geopolítica', sort_order: 40 },
  { slug: 'politica-exterior', name: 'Política exterior', sort_order: 50 },
  { slug: 'relaciones-internacionales', name: 'Relaciones internacionales', sort_order: 60 },
];

export const demoArticles: DemoArticle[] = [
  {
    slug: 'autonomia-estrategica-europea-washington-selectivo',
    title: 'La autonomía estratégica europea ante un Washington cada vez más selectivo',
    excerpt:
      'Estados Unidos sigue siendo indispensable para la seguridad europea, pero su atención es finita. La pregunta ya no es si Europa debe asumir más responsabilidades, sino cómo hacerlo sin debilitar el vínculo atlántico.',
    category: 'relaciones-transatlanticas',
    featured: true,
    published_at: '2026-11-04T09:30:00+01:00',
    cover: {
      path: '/demo/cover-1.svg',
      alt: 'Composición abstracta de líneas de meridiano sobre fondo claro',
      caption: 'Imagen de demostración.',
    },
    secondary: {
      path: '/demo/cover-5.svg',
      alt: 'Composición abstracta de arcos concéntricos',
      caption: 'Imagen secundaria de demostración.',
    },
    body: `${DEMO_NOTICE}
<p>Durante décadas, el debate sobre la autonomía estratégica europea se planteó como una disyuntiva: o Europa reforzaba sus propias capacidades, o confiaba en la garantía de seguridad estadounidense. Esa dicotomía ha perdido utilidad analítica. Hoy la cuestión relevante es cómo se reparte el trabajo dentro de una alianza en la que el socio principal tiene prioridades cada vez más dispersas.</p>
<p>Washington no ha abandonado Europa. Pero la política exterior estadounidense opera con recursos políticos, militares y presupuestarios limitados, y la competencia con China en el Indo-Pacífico absorbe una parte creciente de ellos. El resultado es un compromiso más selectivo: firme en lo esencial, menos disponible para lo accesorio.</p>
<h2>De la retórica a las capacidades</h2>
<p>La autonomía estratégica solo tiene sentido si se traduce en capacidades concretas. Tres ámbitos concentran las carencias europeas más evidentes:</p>
<ul>
<li><strong>Facilitadores estratégicos:</strong> transporte aéreo pesado, reabastecimiento en vuelo, inteligencia y vigilancia por satélite.</li>
<li><strong>Base industrial de defensa:</strong> fragmentada en mercados nacionales, con escasa capacidad para producir a escala y con rapidez.</li>
<li><strong>Toma de decisiones:</strong> procedimientos que exigen unanimidad en política exterior y de seguridad común.</li>
</ul>
<p>Ninguno de estos déficits se resuelve con declaraciones. Requieren inversión sostenida, coordinación de compras y, en el caso de la toma de decisiones, voluntad de reformar los tratados o de explotar mejor las flexibilidades que ya contienen.</p>
<h2>Complementariedad, no sustitución</h2>
<p>El argumento más sólido a favor de la autonomía estratégica no es el distanciamiento de Estados Unidos, sino la complementariedad. Una Europa con más capacidades es un aliado más útil para Washington y un actor con más margen para defender sus propios intereses cuando estos no coinciden plenamente con los estadounidenses.</p>
<blockquote><p>La autonomía no es un fin en sí mismo: es la condición para que la relación transatlántica sea una alianza entre socios y no una dependencia gestionada.</p></blockquote>
<p>Esta lectura exige superar dos tentaciones simétricas: la de quienes ven en cualquier iniciativa europea una amenaza para la OTAN, y la de quienes la presentan como alternativa a ella.</p>
<h3>El papel de los Estados miembros</h3>
<p>Las instituciones europeas pueden incentivar, financiar y coordinar, pero las capacidades militares siguen siendo nacionales. Por eso el debate se juega, en última instancia, en los presupuestos y en las prioridades estratégicas de las capitales.</p>
<h2>Conclusión</h2>
<p>La autonomía estratégica europea dejará de ser un concepto controvertido cuando se mida por resultados verificables y no por intenciones. Un Washington más selectivo no es necesariamente una mala noticia para Europa: puede ser el incentivo que faltaba para convertir una aspiración recurrente en una política.</p>`,
  },
  {
    slug: 'indo-pacifico-prioridad-giro-asiatico-europa',
    title: 'El Indo-Pacífico como prioridad: qué significa para Europa el giro asiático de Estados Unidos',
    excerpt:
      'La reorientación estratégica estadounidense hacia Asia no es una opción coyuntural, sino una constante bipartidista. Europa debe decidir si la observa, la acompaña o la aprovecha.',
    category: 'estados-unidos',
    featured: true,
    published_at: '2026-10-28T10:00:00+01:00',
    cover: {
      path: '/demo/cover-2.svg',
      alt: 'Composición abstracta de una retícula cartográfica con un círculo',
      caption: 'Imagen de demostración.',
    },
    body: `${DEMO_NOTICE}
<p>Pocas ideas gozan de un consenso tan amplio en Washington como la centralidad del Indo-Pacífico. Administraciones de distinto signo han coincidido en que la región concentrará buena parte de la competencia estratégica del siglo XXI. Lo que varía es el método, no el diagnóstico.</p>
<h2>Una constante bipartidista</h2>
<p>El giro hacia Asia se ha presentado con diferentes nombres y estilos, pero responde a una lógica estructural: el peso económico, demográfico y militar de la región, y la percepción de China como principal competidor sistémico de Estados Unidos.</p>
<p>Para Europa, esta continuidad tiene una implicación clara: no se trata de una moda que pasará con el próximo ciclo electoral, sino de un rasgo duradero de la política exterior estadounidense.</p>
<h2>Tres opciones para Europa</h2>
<ol>
<li><strong>Observar:</strong> concentrarse en la vecindad inmediata y asumir que la región es asunto de otros.</li>
<li><strong>Acompañar:</strong> alinear posiciones con Washington, especialmente en controles de exportación y seguridad económica.</li>
<li><strong>Aprovechar:</strong> desarrollar una presencia propia, centrada en comercio, normas y asociaciones con potencias medias.</li>
</ol>
<p>En la práctica, la política europea combina elementos de las tres, con una tensión permanente entre la dependencia económica de China y la dependencia de seguridad de Estados Unidos.</p>
<h3>La seguridad económica como punto de encuentro</h3>
<p>Donde la convergencia transatlántica resulta más visible es en la seguridad económica: cadenas de suministro críticas, tecnologías sensibles e inversiones estratégicas. Es también donde los intereses comerciales europeos pueden divergir con mayor facilidad.</p>
<h2>Conclusión</h2>
<p>El giro asiático de Estados Unidos obliga a Europa a pensar su seguridad con menos dependencia de la atención estadounidense y su política comercial con más conciencia geopolítica. Ambas tareas están conectadas.</p>`,
  },
  {
    slug: 'comercio-aranceles-seguridad-economica-ue-eeuu',
    title: 'Comercio, aranceles y seguridad económica en la relación UE–EE. UU.',
    excerpt:
      'La relación comercial transatlántica es la más densa del mundo, y también una de las más expuestas a la politización. La seguridad económica redefine qué se entiende por libre comercio entre aliados.',
    category: 'union-europea',
    featured: true,
    published_at: '2026-10-21T08:45:00+02:00',
    cover: {
      path: '/demo/cover-3.svg',
      alt: 'Composición abstracta de bandas horizontales y una línea diagonal',
      caption: 'Imagen de demostración.',
    },
    body: `${DEMO_NOTICE}
<p>La relación económica entre la Unión Europea y Estados Unidos combina una interdependencia profunda con fricciones recurrentes. Inversión cruzada, cadenas de valor integradas y servicios digitales conviven con disputas sobre subvenciones, aranceles y regulación.</p>
<h2>Del libre comercio a la seguridad económica</h2>
<p>El vocabulario ha cambiado. Donde antes se hablaba de eliminar barreras, hoy se habla de reducir riesgos, proteger tecnologías críticas y diversificar proveedores. Este desplazamiento afecta también a la relación entre aliados: la pregunta ya no es solo cuánto comercian, sino con quién y en qué condiciones.</p>
<blockquote><p>Entre aliados, la seguridad económica puede ser un terreno de cooperación o una nueva fuente de proteccionismo. La diferencia depende de la coordinación.</p></blockquote>
<h2>Puntos de fricción</h2>
<ul>
<li>Las políticas industriales con incentivos vinculados a la producción nacional.</li>
<li>La regulación europea de mercados y servicios digitales.</li>
<li>El uso de aranceles como instrumento de presión política.</li>
</ul>
<p>Cada uno de estos ámbitos tiene una lógica interna defendible, pero su acumulación genera desconfianza y alimenta la percepción de que el vínculo económico transatlántico está sometido a los ciclos políticos.</p>
<h2>Conclusión</h2>
<p>La estabilidad de la relación comercial depende menos de grandes acuerdos que de mecanismos permanentes de consulta capaces de anticipar conflictos antes de que escalen.</p>`,
  },
  {
    slug: 'otan-reparto-de-cargas-credibilidad-disuasoria',
    title: 'La OTAN y el reparto de cargas: credibilidad disuasoria en un entorno exigente',
    excerpt:
      'El debate sobre el gasto en defensa ha dejado de ser una discusión contable. Lo que está en juego es la credibilidad de la disuasión aliada y la cohesión política que la sostiene.',
    category: 'geopolitica',
    featured: false,
    published_at: '2026-10-14T11:15:00+02:00',
    cover: {
      path: '/demo/cover-4.svg',
      alt: 'Composición abstracta de líneas verticales y un arco',
      caption: 'Imagen de demostración.',
    },
    body: `${DEMO_NOTICE}
<p>El reparto de cargas ha acompañado a la Alianza Atlántica desde su fundación. Lo nuevo no es la queja estadounidense sobre el esfuerzo europeo, sino el contexto: un entorno de seguridad más exigente en el que la disuasión depende de capacidades disponibles y no solo de compromisos formales.</p>
<h2>Más allá del porcentaje</h2>
<p>Los objetivos de gasto expresados como porcentaje del PIB son útiles como señal política, pero dicen poco sobre la calidad del esfuerzo. Importa en qué se gasta, con qué grado de interoperabilidad y con qué rapidez pueden desplegarse las capacidades.</p>
<h2>Cohesión política</h2>
<p>La disuasión no es solo material. Requiere que el adversario potencial perciba unidad y voluntad. Por eso las disputas públicas sobre el reparto de cargas tienen un coste estratégico que va más allá de lo presupuestario.</p>
<h2>Conclusión</h2>
<p>El reparto de cargas seguirá siendo un tema recurrente. La cuestión es si se gestiona como un reproche periódico o como una conversación sobre capacidades y prioridades compartidas.</p>`,
  },
  {
    slug: 'politica-exterior-ue-dilema-unanimidad',
    title: 'La política exterior de la Unión Europea y el dilema de la unanimidad',
    excerpt:
      'La regla de la unanimidad protege la soberanía de los Estados miembros, pero limita la capacidad de la Unión para actuar con rapidez. ¿Es posible reformarla sin fracturar el consenso?',
    category: 'union-europea',
    featured: false,
    published_at: '2026-10-07T09:00:00+02:00',
    cover: {
      path: '/demo/cover-6.svg',
      alt: 'Composición abstracta de puntos en retícula',
      caption: 'Imagen de demostración.',
    },
    body: `${DEMO_NOTICE}
<p>La política exterior y de seguridad común es uno de los pocos ámbitos en los que la Unión Europea sigue decidiendo, como regla general, por unanimidad. Esta característica refleja la sensibilidad de la materia, pero tiene un precio: un solo Estado puede bloquear o diluir una posición común.</p>
<h2>Argumentos a favor de la reforma</h2>
<p>Quienes defienden extender la mayoría cualificada sostienen que la Unión necesita actuar con rapidez en un entorno volátil, y que la unanimidad facilita que actores externos exploten divisiones internas.</p>
<h2>Argumentos en contra</h2>
<p>Quienes se oponen advierten que imponer decisiones de política exterior a Estados en minoría podría erosionar la legitimidad de la acción exterior común y debilitar su aplicación.</p>
<h3>Vías intermedias</h3>
<ul>
<li>La abstención constructiva, que permite no bloquear sin sumarse.</li>
<li>Las cláusulas pasarela previstas en los tratados.</li>
<li>Las coaliciones de Estados dispuestos a actuar dentro del marco europeo.</li>
</ul>
<h2>Conclusión</h2>
<p>La reforma de la unanimidad probablemente avanzará de forma gradual y sectorial, más por la práctica que por grandes cambios de los tratados.</p>`,
  },
  {
    slug: 'espana-eje-atlantico-intereses-capacidades',
    title: 'España en el eje atlántico: intereses, capacidades y margen de maniobra',
    excerpt:
      'Por geografía e historia, España mira a la vez al Atlántico, al Mediterráneo y a América Latina. Esa posición puede ser una fuente de influencia en la relación transatlántica si se articula con coherencia.',
    category: 'politica-exterior',
    featured: false,
    published_at: '2026-09-30T10:30:00+02:00',
    cover: {
      path: '/demo/cover-7.svg',
      alt: 'Composición abstracta de ondas horizontales',
      caption: 'Imagen de demostración.',
    },
    body: `${DEMO_NOTICE}
<p>La posición de España en la relación transatlántica suele analizarse desde el prisma de la seguridad. Sin embargo, su potencial de influencia se apoya también en vínculos económicos, culturales y políticos con América Latina y en su papel en el flanco sur europeo.</p>
<h2>Tres vectores</h2>
<ol>
<li><strong>Atlántico:</strong> la relación bilateral con Estados Unidos y la pertenencia a la OTAN.</li>
<li><strong>Mediterráneo:</strong> estabilidad del vecindario sur, migraciones y energía.</li>
<li><strong>Iberoamérica:</strong> un espacio de interlocución privilegiada.</li>
</ol>
<p>La coherencia entre estos vectores determina el margen de maniobra de la política exterior española dentro de la Unión Europea y frente a Washington.</p>
<h2>Conclusión</h2>
<p>España puede aportar a la relación transatlántica una perspectiva que conecte el flanco sur y América Latina con las prioridades de seguridad aliadas. Convertir esa posición en influencia requiere continuidad y capacidades.</p>`,
  },
  {
    slug: 'congreso-politica-exterior-estadounidense-contrapesos',
    title: 'El Congreso y la política exterior estadounidense: contrapesos institucionales',
    excerpt:
      'La política exterior de Estados Unidos no la decide solo la Casa Blanca. El Congreso, a través del presupuesto, los tratados y la supervisión, condiciona compromisos que Europa tiende a atribuir únicamente al presidente.',
    category: 'estados-unidos',
    featured: false,
    published_at: '2026-09-23T09:45:00+02:00',
    cover: {
      path: '/demo/cover-8.svg',
      alt: 'Composición abstracta de columnas y un frontón geométrico',
      caption: 'Imagen de demostración.',
    },
    body: `${DEMO_NOTICE}
<p>En Europa es frecuente leer la política exterior estadounidense a través de la figura presidencial. Es una simplificación comprensible, pero incompleta. El diseño constitucional reparte competencias y el Congreso dispone de instrumentos poderosos para orientar, limitar o sostener la acción exterior.</p>
<h2>Instrumentos del Congreso</h2>
<ul>
<li>El poder presupuestario, que financia o restringe programas y despliegues.</li>
<li>La ratificación de tratados por el Senado.</li>
<li>La confirmación de altos cargos diplomáticos y de defensa.</li>
<li>Las comisiones de supervisión y sus audiencias.</li>
</ul>
<h2>Implicaciones para Europa</h2>
<p>Entender la dinámica legislativa permite anticipar la durabilidad de los compromisos estadounidenses. Una política respaldada por mayorías amplias en el Congreso tiende a sobrevivir a los cambios de administración.</p>
<h2>Conclusión</h2>
<p>Para los socios europeos, la diplomacia con Washington no puede limitarse al poder ejecutivo: el Capitolio es un interlocutor imprescindible.</p>`,
  },
  {
    slug: 'diplomacia-climatica-competencia-geopolitica',
    title: 'Diplomacia climática y competencia geopolítica',
    excerpt:
      'La transición energética se ha convertido en un terreno de competencia entre potencias: minerales críticos, tecnologías limpias y financiación. La cooperación climática ya no puede separarse de la geopolítica.',
    category: 'relaciones-internacionales',
    featured: false,
    published_at: '2026-09-16T12:00:00+02:00',
    cover: {
      path: '/demo/cover-9.svg',
      alt: 'Composición abstracta de un círculo dividido por líneas',
      caption: 'Imagen de demostración.',
    },
    body: `${DEMO_NOTICE}
<p>Durante años, la diplomacia climática se presentó como un espacio de cooperación relativamente aislado de las rivalidades estratégicas. Esa separación es cada vez más difícil de sostener.</p>
<h2>La transición como competencia</h2>
<p>El acceso a minerales críticos, el dominio de las cadenas de producción de tecnologías limpias y la capacidad de financiar la transición en terceros países se han convertido en dimensiones de la competencia entre grandes potencias.</p>
<h2>Implicaciones para la relación transatlántica</h2>
<p>Europa y Estados Unidos comparten objetivos generales, pero difieren en instrumentos: regulación y fijación de precios del carbono en un caso, incentivos fiscales e industriales en el otro.</p>
<h2>Conclusión</h2>
<p>La diplomacia climática del futuro será, inevitablemente, también una política de seguridad económica.</p>`,
  },
];
