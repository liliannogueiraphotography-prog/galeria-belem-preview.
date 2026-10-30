"""Run against a freshly seeded fictitious DB: BELEM_SHOP_ORIGIN and BELEM_SHOP_ACCESS."""
import os,json,io
from pathlib import Path
from PIL import Image
from playwright.sync_api import sync_playwright
BASE=os.environ.get('BELEM_SHOP_ORIGIN','http://localhost:3500')
ACCESS=Path(os.environ.get('BELEM_SHOP_ACCESS','/tmp/belem-shop-e2e/demo-access.json'))
accounts=json.loads(ACCESS.read_text())['accounts']
assert all(a['email'].endswith('@belem.test') for a in accounts)
img=io.BytesIO();Image.new('RGB',(800,600),(130,150,110)).save(img,format='JPEG')
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 admin=b.new_context(viewport={'width':1440,'height':1000});admin.route('https://fonts.googleapis.com/**',lambda r:r.abort())
 response=admin.request.post(BASE+'/api/v1/auth/login',headers={'Origin':BASE},data={k:accounts[0][k] for k in ['email','password']});assert response.status==200
 page=admin.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(BASE+'/admin');page.get_by_role('button',name='Lojinha',exact=True).click();page.get_by_role('button',name='Novo produto').click()
 page.get_by_label('Nome do produto',exact=True).fill('Caneca E2E fictícia');page.get_by_label('Descrição',exact=True).fill('Somente teste artificial');page.get_by_label('Preço (R$)',exact=True).fill('49.90');page.get_by_label('Foto do produto (opcional)').set_input_files({'name':'ARTIFICIAL.jpg','mimeType':'image/jpeg','buffer':img.getvalue()});page.get_by_label('Exibir na galeria da cliente').check();page.get_by_role('button',name='Salvar produto',exact=True).click();page.locator('dialog[open]').wait_for(state='hidden');page.get_by_role('heading',name='Caneca E2E fictícia',exact=True).wait_for()
 for width in [320,390,768,1440]:
  page.set_viewport_size({'width':width,'height':900});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),width
 print('Admin: registration, price, artificial image, responsive catalog PASS')
 products=admin.request.get(BASE+'/api/v1/admin/products').json()['products'];product=next(p for p in products if p['name']=='Caneca E2E fictícia');assert product['hasImage']
 overview=admin.request.get(BASE+'/api/v1/admin/overview').json();session=next(s for s in overview['sessions'] if s['gallery_active']);link=admin.request.get(BASE+'/api/v1/admin/galleries/'+session['gallery_id']+'/link').json()['url']
 family=b.new_context(viewport={'width':390,'height':844},reduced_motion='reduce');family.route('https://fonts.googleapis.com/**',lambda r:r.abort());gp=family.new_page();gp.on('pageerror',lambda e:errors.append(str(e)));gp.goto(link);gp.locator('#home a[href="#gallery"]').click();gp.locator('.card .heart').first.click();gp.locator('#gallery .sub').filter(has_text='Escolhas salvas.').wait_for();gp.locator('#gallery .fixed button').click();card=gp.locator('#shop article').filter(has=gp.get_by_role('heading',name='Caneca E2E fictícia',exact=True));card.get_by_role('button').click();quantity=gp.get_by_label('Quantidade de Caneca E2E fictícia');quantity.fill('2');quantity.dispatch_event('change');gp.locator('#shop [role=status]').filter(has_text='Recordações salvas.').wait_for();gp.locator('#shop .npfoot button').click();gp.locator('#review').wait_for(state='visible');assert 'R$' in gp.locator('#reviewExtras').inner_text();assert '99,80' in gp.locator('#reviewExtras').inner_text();assert gp.evaluate('document.documentElement.scrollWidth<=innerWidth')
 gid=session['gallery_id'];saved=family.request.get(BASE+'/api/v1/gallery/'+gid).json();assert saved['cart']['items']==[{'productId':product['id'],'quantity':2}];assert saved['estimate']['totalCents']==9980
 print('Client: catalog, photo selection, quantity, server estimate and persisted cart PASS')
 fresh=b.new_context(viewport={'width':320,'height':800},reduced_motion='reduce');fresh.route('https://fonts.googleapis.com/**',lambda r:r.abort());p=fresh.new_page();p.goto(link);p.locator('#home a[href="#gallery"]').click();p.locator('#gallery .fixed button').click();assert p.get_by_label('Quantidade de Caneca E2E fictícia').input_value()=='2';assert p.evaluate('document.documentElement.scrollWidth<=innerWidth');assert fresh.request.get(BASE+'/api/v1/admin/products').status==401
 other=b.new_context();assert other.request.post(BASE+'/api/v1/auth/login',headers={'Origin':BASE},data={k:accounts[1][k] for k in ['email','password']}).status==200;assert other.request.get(BASE+'/api/v1/admin/products/'+product['id']+'/image').status==404
 # Inactivate a selected product: review warns and lets the customer remove it safely.
 assert admin.request.patch(BASE+'/api/v1/admin/products/'+product['id'],headers={'Origin':BASE},data={'name':product['name'],'description':product['description'],'category':product['category'],'priceCents':4990,'active':False}).status==200
 p.locator('#shop .npfoot button').click();p.locator('#review').wait_for(state='visible');p.get_by_role('button',name='Remover produtos indisponíveis').click();p.locator('#reviewExtras').filter(has_text='Nenhuma recordação adicional escolhida.').wait_for();assert fresh.request.get(BASE+'/api/v1/gallery/'+gid).json()['cart']['items']==[]
 assert not errors,errors
 print('Fresh browser persistence, anonymous denial, cross-studio denial, unavailable-product removal, no JS errors PASS')
 b.close()
