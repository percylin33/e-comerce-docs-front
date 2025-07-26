export const SERVICIOS_ITEMS = [
    {
        title: 'Servicios',
        children: [
            {
                title: 'MEMBRESÍAS',
                link: '/site/membresia', // Ruta directa
              },
          {
            title: 'SESIONES',
            link: '/site/categorias/PLANIFICACION',
            queryParams: { category: 'PLANIFICACION' },
          },
          {
            title: 'EVALUACION',
            link: '/site/categorias/EVALUACION',
            queryParams: { category: 'EVALUACION' },
          },
          {
            title: 'ESTRATEGIAS',
            link: '/site/categorias/ESTRATEGIAS',
            queryParams: { category: 'ESTRATEGIAS' },
          },
          {
            title: 'RECURSOS',
            link: '/site/categorias/RECURSOS',
            queryParams: { category: 'RECURSOS' },
          },
          {
            title: 'EBOOKS',
            link: '/site/categorias/EBOOKS',
            queryParams: { category: 'EBOOKS' },
          },
          {
            title: 'KITS',
            link: '/site/categorias/KITS',
            queryParams: { category: 'KITS' },
          },
          {
            title: 'TALLERES',
            link: '/site/categorias/TALLERES',
            queryParams: { category: 'TALLERES' },
          },
        ],
      },
    
  ];