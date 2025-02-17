import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'ngx-main-section',
  templateUrl: './main-section.component.html',
  styleUrls: ['./main-section.component.scss']
})
export class MainSectionComponent implements OnInit {
  novedades = [
    {
      image: 'assets/images/carousel1/p11.png',
      imageMobile: 'assets/images/carousel1/11.png',
      title: 'Novedad 1',
      description: 'Descubre la primera novedad que tenemos para ti.'
    },
    {
      image: 'assets/images/carousel1/p19.png',
      imageMobile: 'assets/images/carousel1/19.png',
      title: 'Novedad 2',
      description: 'Nuevos artículos y más información.'
    },
    {
      image: 'assets/images/carousel1/p12.png',
      imageMobile: 'assets/images/carousel1/12.png',
      title: 'Novedad 3',
      description: 'Explora esta tercera novedad con contenido exclusivo.'
    },
    {
      image: 'assets/images/carousel1/p28.png',
      imageMobile: 'assets/images/carousel1/28.png',
      title: 'Novedad 4',
      description: 'No te pierdas esta oportunidad única.'
    },
    {
      image: 'assets/images/carousel1/p7.png',
      imageMobile: 'assets/images/carousel1/7.png',
      title: 'Novedad 5',
      description: 'No te pierdas esta oportunidad única.'
    },
    {
      image: 'assets/images/carousel1/p1.png',
      imageMobile: 'assets/images/carousel1/1.png',
      title: 'Novedad 5',
      description: 'No te pierdas esta oportunidad única.'
    },
    {
      image: 'assets/images/carousel1/p4.png',
      imageMobile: 'assets/images/carousel1/4.png',
      title: 'Novedad 5',
      description: 'No te pierdas esta oportunidad única.'
    },
    {
      image: 'assets/images/carousel1/p5.png',
      imageMobile: 'assets/images/carousel1/5.png',
      title: 'Novedad 5',
      description: 'No te pierdas esta oportunidad única.'
    },
    {
      image: 'assets/images/carousel1/p8.png',
      imageMobile: 'assets/images/carousel1/8.png',
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
