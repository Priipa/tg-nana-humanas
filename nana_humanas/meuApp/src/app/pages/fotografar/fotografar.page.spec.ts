import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FotografarPage } from './fotografar.page';

describe('FotografarPage', () => {
  let component: FotografarPage;
  let fixture: ComponentFixture<FotografarPage>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(FotografarPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
