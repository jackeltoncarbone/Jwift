import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Jiv, Jext } from 'jaui-angular';
import TagBadgeJss from './TagBadge.jss';

/** The badge's tone: `neutral` says nothing extra; the other three carry the model's own read on a
 *  status (accent = in progress, success = good, warning = needs attention, danger = stopped/failed). */
export type TagBadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

/**
 * `<tag-badge>` — a read-only status/tag capsule. HOUSE: promoted from the `Cm_Tag*` ladder four
 * surfaces had each rebuilt (Services, Fundraiser, Classroom, Admin).
 *
 *   <tag-badge [tone]="statusTone(order.Status)" [text]="statusLabel(order.Status)" />
 */
@Component({
  selector: 'tag-badge',
  standalone: true,
  imports: [Jiv, Jext],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <jiv [class]="_BadgeClass()">
      <jext [class]="_LabelClass()" [text]="text()" />
    </jiv>
  `,
  styles: [':host { display: contents; }'],
})
export class TagBadge {
  readonly tone = input<TagBadgeTone>('neutral');
  readonly text = input.required<string>();

  protected readonly _BadgeClass = computed(() => {
    switch (this.tone()) {
      case 'accent': return 'Jwift_TagBadge_Accent';
      case 'success': return 'Jwift_TagBadge_Success';
      case 'warning': return 'Jwift_TagBadge_Warning';
      case 'danger': return 'Jwift_TagBadge_Danger';
      default: return 'Jwift_TagBadge';
    }
  });
  protected readonly _LabelClass = computed(() => {
    switch (this.tone()) {
      case 'accent': return 'Jwift_TagBadgeLabel_Accent';
      case 'success': return 'Jwift_TagBadgeLabel_Success';
      case 'warning': return 'Jwift_TagBadgeLabel_Warning';
      case 'danger': return 'Jwift_TagBadgeLabel_Danger';
      default: return 'Jwift_TagBadgeLabel';
    }
  });
}
