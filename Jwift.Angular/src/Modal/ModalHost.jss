// The Jwift modal teleport host — a scrim + a centered modal OUTLET. There is no
// "open" boolean anywhere: the modal is open exactly when something occupies the
// outlet (`OccupantCount(JWIFT_MODAL_OUTLET) > 0`). Any jiv teleports here from
// anywhere — declared UI "remotely", presented modally, flying both ways.

// Dim + frosted full-screen scrim, shown only while occupied (@if-mounted; the
// Presence spring fades it in/out). Click = dismiss request.
Jwift_ModalScrim {
  Position: Placed
  Top: 0pt
  Left: 0pt
  Width: 100%
  Height: 100vh
  Layer: 50
  Background: rgba(0, 0, 0, 0.45)
  BackdropFilter: Blur(24pt)
  Interactive: true
}

// The centering frame above the scrim. Hit-transparent — the occupant takes its
// own hits; clicks beside it fall through to the scrim.
Jwift_ModalFrame {
  Position: Placed
  Top: 0pt
  Left: 0pt
  Width: 100%
  Height: 100vh
  Direction: Column
  Justify: Center
  Align: Center
  Layer: 51
  PointerEvents: None
}

// The modal parking space — width-constrained per the design system; hugs its
// occupant's height (the frame centers it).
Jwift_ModalOutlet {
  Width: 520pt
  MaxWidth: 92%
  Direction: Column
  Align: Stretch
}
