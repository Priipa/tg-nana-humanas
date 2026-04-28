import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AquarelarPage } from './aquarelar.page';

describe('AquarelarPage', () => {
  let component: AquarelarPage;
  let fixture: ComponentFixture<AquarelarPage>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(AquarelarPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
