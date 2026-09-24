J=C:/Users/jackc/Code/Repositories/show-studio/ShowStudio.Libraries/Jaui/Jaui/src
for rs in $1; do for cs in $2; do
sed -i "s/^const float GLASS_TEXEL_SIGMA_REGULAR = .*;/const float GLASS_TEXEL_SIGMA_REGULAR = $rs;/; s/^const float GLASS_TEXEL_SIGMA_CLEAR = .*;/const float GLASS_TEXEL_SIGMA_CLEAR = $cs;/" $J/Jiv/Shaders/Glass.Pipeline.glsl
sed -i "s/^export const GLASS_TEXEL_SIGMA_REGULAR = .*;/export const GLASS_TEXEL_SIGMA_REGULAR = $rs;/; s/^export const GLASS_TEXEL_SIGMA_CLEAR = .*;/export const GLASS_TEXEL_SIGMA_CLEAR = $cs;/" $J/Core/Glass.Pipeline.ts
node build.mjs >/dev/null; node shoot.mjs parity h-regular h-clear >/dev/null 2>&1
python - <<PY
import numpy as np
from PIL import Image, ImageFilter
Y=np.array([.2126,.7152,.0722])
def det(a):
    b=np.asarray(Image.fromarray(a.clip(0,255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(6))).astype(float); return ((a-b)@Y).std()
for v in ['regular','clear']:
    A=np.asarray(Image.open(f'bgs/swift-harbour-{v}.png').convert('RGB')).astype(float)[82:222,440:660]
    B=np.asarray(Image.open(f'renders-parity/h-{v}.png').convert('RGB').crop((700,1132,1700,1460)).resize((900,295),Image.LANCZOS)).astype(float)[82:222,440:660]
    print('$rs $cs',v,round(det(A),2),round(det(B),2))
PY
done; done
