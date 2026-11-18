from PIL import Image

tpl = Image.open("client/public/logo_tpl_4x.png")
cur = Image.open("client/public/logo_cur_4x.png")

# Let's crop the wordmark and subtitle specifically:
# y: 50 to 330, x: 200 to 1100
tpl_crop = tpl.crop((200, 50, 1100, 330))
cur_crop = cur.crop((200, 50, 1100, 330))

# Also crop emblem:
# y: 30 to 350, x: 20 to 220
tpl_emblem = tpl.crop((20, 30, 220, 350))
cur_emblem = cur.crop((20, 30, 220, 350))

# Stack vertically for comparison
comp = Image.new('RGB', (900, 560), (255, 255, 255))
comp.paste(tpl_crop, (0, 0))
comp.paste(cur_crop, (0, 280))
comp.save("client/public/wordmark_comparison_stacked.png")

comp_emblem = Image.new('RGB', (400, 320), (255, 255, 255))
comp_emblem.paste(tpl_emblem, (0, 0))
comp_emblem.paste(cur_emblem, (200, 0))
comp_emblem.save("client/public/emblem_comparison_side_by_side.png")

print("Saved wordmark_comparison_stacked.png and emblem_comparison_side_by_side.png")
