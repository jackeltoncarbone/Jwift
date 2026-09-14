import { InjectionToken, type Signal } from '@angular/core';

/** A `<list>`'s comfort: the uniform padding every row sits at, in points. It decides the section's
 *  corner too, because a container is concentric with the control it holds only when the padding is the
 *  same on every side: radius = control radius + comfort. Provided by `List`, consumed by `ListRow`. */
export const LIST_COMFORT = new InjectionToken<Signal<number>>('LIST_COMFORT');
