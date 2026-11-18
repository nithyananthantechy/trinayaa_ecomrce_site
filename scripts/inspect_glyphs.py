import cv2
import numpy as np

sub = cv2.imread("client/public/sub_approved_tight.png")
# Let's find columns where there is ink
gray = cv2.cvtColor(sub, cv2.COLOR_BGR2GRAY)
ink_cols = np.where(np.min(gray, axis=0) < 180)[0]
print("Ink columns range:", ink_cols[0], "to", ink_cols[-1])

# Leftmost glyph:
left_glyph = sub[:, ink_cols[0]:ink_cols[0]+12]
# Rightmost glyph:
right_glyph = sub[:, ink_cols[-1]-12:ink_cols[-1]+1]

cv2.imwrite("client/public/glyph_left.png", cv2.resize(left_glyph, (120, 200), interpolation=cv2.INTER_NEAREST))
cv2.imwrite("client/public/glyph_right.png", cv2.resize(right_glyph, (120, 200), interpolation=cv2.INTER_NEAREST))
print("Glyphs saved")
