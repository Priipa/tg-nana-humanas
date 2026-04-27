import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VetorizarPage } from './vetorizar';

describe('VetorizarPage', () => {
  let component: VetorizarPage;
  let fixture: ComponentFixture<VetorizarPage>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(VetorizarPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
