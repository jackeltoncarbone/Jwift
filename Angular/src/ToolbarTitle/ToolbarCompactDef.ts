import { Directive, TemplateRef, inject } from '@angular/core';

/**
 * Marks a `<ng-template toolbarCompact>` inside `<toolbar-title>`.
 *
 *   <toolbar-title [toolbar]="bar">
 *     <big-logo />
 *     <ng-template toolbarCompact>
 *       <compact-logo />
 *     </ng-template>
 *   </toolbar-title>
 *
 * ToolbarTitle grabs the template via ContentChild and promotes it into
 * the paired Toolbar's leading slot when the big title scrolls out.
 */
@Directive({ selector: 'ng-template[toolbarCompact]', standalone: true })
export class ToolbarCompactDef {
  readonly Template = inject<TemplateRef<unknown>>(TemplateRef);
}
