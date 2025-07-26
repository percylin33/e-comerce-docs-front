import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'ngx-main-section',
  templateUrl: './main-section.component.html',
  styleUrls: ['./main-section.component.scss']
})
export class MainSectionComponent implements OnInit {
  novedades = [
    {
      image: 'assets/images/carousel1/p1.webp',
      imageMobile: 'assets/images/carousel1/1.webp',
      title: 'Novedad 1',
      description: 'Descubre la primera novedad que tenemos para ti.'
    },
    {
      image: 'assets/images/carousel1/p2.webp',
      imageMobile: 'assets/images/carousel1/2.webp',
      title: 'Novedad 2',
      description: 'Nuevos artículos y más información.'
    },
    {
      image: 'assets/images/carousel1/p3.webp',
      imageMobile: 'assets/images/carousel1/3.webp',
      title: 'Novedad 3',
      description: 'Explora esta tercera novedad con contenido exclusivo.'
    },
    {
      image: 'assets/images/carousel1/p4.webp',
      imageMobile: 'assets/images/carousel1/4.webp',
      title: 'Novedad 4',
      description: 'No te pierdas esta oportunidad única.'
    },
    {
      image: 'assets/images/carousel1/p5.webp',
      imageMobile: 'assets/images/carousel1/5.webp',
      title: 'Novedad 5',
      description: 'No te pierdas esta oportunidad única.'
    },
    {
      image: 'assets/images/carousel1/p6.webp', 
      imageMobile: 'assets/images/carousel1/6.webp',
      title: 'Novedad 5',
      description: 'No te pierdas esta oportunidad única.'
    },
    {
      image: 'assets/images/carousel1/p7.webp',
      imageMobile: 'assets/images/carousel1/7.webp',
      title: 'Novedad 5',
      description: 'No te pierdas esta oportunidad única.'
    }
  ];

  isMobile: boolean;

  ngOnInit() {
    this.isMobile = window.innerWidth <= 768;
    window.addEventListener('resize', () => {
      this.isMobile = window.innerWidth <= 768;
    });
  }

  getImage(novedad) {
    return this.isMobile ? novedad.imageMobile : novedad.image;
  }


}
