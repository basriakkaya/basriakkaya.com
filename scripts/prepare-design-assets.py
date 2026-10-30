from PIL import Image
from pathlib import Path
root=Path(__file__).resolve().parents[1]
design=root.parent
out=root/'public/images/editorial';out.mkdir(parents=True,exist_ok=True)
def crop(file,box,name):
 im=Image.open(file); w,h=im.size
 im.crop(tuple(round(v*(w if i%2==0 else h)) for i,v in enumerate(box))).save(out/(name+'.webp'),quality=94)
home=design/'01_Onayli_Tasarim/01_Ana_Sayfa_ONAYLI.png'
blog=design/'02_Sayfa_Taslaklari/02_Blog.png'
research=design/'02_Sayfa_Taslaklari/04_Arastirmalar.png'
products=design/'02_Sayfa_Taslaklari/05_Urunler.png'
crop(home,(.492,.077,.979,.218),'microsoft')
crop(home,(.356,.326,.666,.420),'nasa')
crop(home,(.68,.326,.974,.420),'asosyal')
crop(blog,(.033,.202,.57,.335),'anatomy')
crop(blog,(.032,.363,.331,.465),'xss')
crop(blog,(.358,.363,.645,.465),'report')
crop(blog,(.669,.363,.97,.465),'jwt')
crop(blog,(.033,.596,.332,.700),'disclosure')
crop(blog,(.359,.596,.646,.700),'recon')
crop(blog,(.669,.596,.971,.700),'development')
crop(research,(.49,.05,.964,.225),'research')
crop(research,(.035,.65,.485,.79),'process')
crop(products,(.035,.226,.623,.412),'kageai')
im=Image.open(design/'01_Onayli_Tasarim/Basrick_Amblem.png').convert('RGBA')
# Retain the exact pixel artwork; remove only its dark backing for the black UI.
px=im.load()
for y in range(im.height):
 for x in range(im.width):
  r,g,b,a=px[x,y]
  if max(r,g,b)<65:px[x,y]=(r,g,b,0)
im.save(out/'basrick.png')
im.resize((96,96),Image.Resampling.LANCZOS).save(out/'basrick-small.png')
print('Approved artwork extracted into',out)
