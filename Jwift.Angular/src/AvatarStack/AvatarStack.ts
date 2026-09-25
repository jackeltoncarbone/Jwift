import { ChangeDetectionStrategy, Component, computed, input, numberAttribute } from '@angular/core';
import { Jext, Jiv, Jyle } from 'jaui-angular';
import { Avatar } from '../Avatar/Avatar';
import AvatarStackJss from './AvatarStack.jss';

/** One person in the stack. `Tint` rings their disc in the color they wear everywhere else they appear. */
export interface AvatarStackPerson {
  readonly Key: string;
  readonly Name: string;
  readonly Photo?: string | null;
  readonly Tint?: string | null;
}

/**
 * `<avatar-stack>`: the people who are here, as overlapping discs, the way Freeform and Notes show who is in a
 * shared document beside its collaboration button. Past `Max` the rest fold into one "+N" disc, so the stack
 * never grows wider than a bar button group.
 *
 *   <glass-button shape="pill" size="bar"><avatar-stack [People]="Others()" /></glass-button>
 *
 * Each disc is the avatar's 24 pt `Byline` rung inside a 2 pt ring on an opaque plate, so the disc tucked
 * under its neighbor is hidden rather than seen through, and a photo, a monogram and the silhouette all land
 * on the same circle.
 */
@Component({
  selector: 'avatar-stack',
  standalone: true,
  imports: [Jiv, Jext, Jyle, Avatar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <jyle [source]="Jss" />
    <jiv class="Jwift_AvatarStack" [label]="Label()">
      @for (person of Shown(); track person.Key; let first = $first) {
        <jiv [class]="first ? 'Jwift_AvatarStackCell' : 'Jwift_AvatarStackCell_Overlap'"
             [jivStyle]="person.Tint ? { BorderColor: person.Tint } : {}">
          <avatar Size="Byline" [Photo]="person.Photo" [Name]="person.Name" />
        </jiv>
      }
      @if (Overflow() > 0) {
        <jiv class="Jwift_AvatarStackMore">
          <jext class="Jwift_AvatarStackMoreLabel" [text]="'+' + Overflow()" />
        </jiv>
      }
    </jiv>
  `,
  styles: [':host { display: contents; }'],
})
export class AvatarStack {
  readonly People = input<readonly AvatarStackPerson[]>([]);
  /** How many discs draw before the rest become "+N". Three is what fits a bar button. */
  readonly Max = input(3, { transform: numberAttribute });

  protected readonly Jss = AvatarStackJss;

  /** When the stack would overflow, the last visible slot becomes the count, so the width never grows. */
  protected readonly Shown = computed(() => {
    const people = this.People();
    const max = Math.max(1, this.Max());
    return people.length <= max ? people : people.slice(0, max - 1);
  });
  protected readonly Overflow = computed(() => this.People().length - this.Shown().length);

  protected readonly Label = computed(() => {
    const names = this.People().map((person) => person.Name).filter(Boolean);
    if (!names.length) return '';
    if (names.length === 1) return `${names[0]} is here`;
    if (names.length === 2) return `${names[0]} and ${names[1]} are here`;
    return `${names[0]} and ${names.length - 1} others are here`;
  });
}
