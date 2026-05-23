import { ComponentFixture, TestBed } from '@angular/core/testing';
import { commonTestProviders } from '../../testing/test-providers';
import { DocumentsListComponent } from './documents-list.component';

describe('DocumentsListComponent', () => {
  let component: DocumentsListComponent;
  let fixture: ComponentFixture<DocumentsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [DocumentsListComponent],
      providers: [...commonTestProviders()]
}).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DocumentsListComponent);
    component = fixture.componentInstance;
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  it('flattens nested documents and paginates', () => {
    component.pageSize = 2;
    component.documents = {
      'Unidad 1': {
        'Materia A': { 'Grado I': [ { title: 'Doc1', fileUrlPublic: 'url1' }, { title: 'Doc2', fileUrlPublic: 'url2' } ] },
        'Materia B': { 'Grado I': [ { title: 'Doc3', fileUrlPublic: 'url3' } ] }
      },
      'Unidad 2': {
        'Materia C': { 'Grado II': [ { title: 'Doc4', fileUrlPublic: 'url4' } ] }
      }
    };

    component.ngOnChanges();
    // Component auto-selects the first unit/subject/grade; in this dataset
    // that resolves to Unidad 1 -> Materia A -> Grado I (2 docs)
    expect(component.filteredDocs.length).toBe(2);
    expect(component.totalPages).toBe(1);
    expect(component.paged.length).toBe(2);
    // nextPage should not advance when there's only one page
    component.nextPage();
    expect(component.currentPage).toBe(1);
    expect(component.paged.length).toBe(2);
  });
});
