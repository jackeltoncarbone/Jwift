import cv2, numpy as np, json, sys
V = 'C:/Users/jackc/Code/LiquidGlassGallery/ActiveLens/Clips/macstories-tab-switch-native.mp4'
cap = cv2.VideoCapture(V)
frames = []
while True:
    ok, f = cap.read()
    if not ok: break
    frames.append(f[340:640].astype(np.float32))
print(len(frames))
np.save('frames/mac.npy', np.stack(frames).astype(np.uint8))
rest = frames[int(0.5 * 60)]
out = []
for i, f in enumerate(frames):
    d = np.abs(f - rest).max(2)
    m = d[:, :620] > 40
    ys, xs = np.where(m)
    if len(xs) < 50: out.append((i, None)); continue
    # robust bbox: 1st/99th percentile
    out.append((i, [float(np.percentile(xs, 0.5)), float(np.percentile(ys, 0.5)), float(np.percentile(xs, 99.5)), float(np.percentile(ys, 99.5)), int(len(xs))]))
json.dump(out, open('out/mac_boxes.json', 'w'))
for i, b in out:
    t = i / 60
    if 1.55 <= t <= 2.2 or 9.65 <= t <= 10.2: print(f'{t:.3f}', b)
