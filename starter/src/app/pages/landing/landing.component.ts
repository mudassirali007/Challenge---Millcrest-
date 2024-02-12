import { AfterContentInit, Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MapComponent } from 'src/app/components/map/map.component';
import { MatDialog } from '@angular/material/dialog';
import { StarterDialogComponent } from 'src/app/components/starter-dialog/starter-dialog.component';

@Component({
  selector: 'starter-landing',
  standalone: true,
  imports: [MatCardModule, MapComponent],
  templateUrl: './landing.component.html',
  styles: ``,
})
export class LandingComponent implements AfterContentInit {
  constructor(public dialog: MatDialog) {}

  ngAfterContentInit(): void {
    this.openDialog();
  }

  openDialog(): void {
    this.dialog.open(StarterDialogComponent);
  }
}
