"""Fictitious-only package inheritance, visible extras and suggested product copy."""
import os,json,io,uuid
from pathlib import Path
from PIL import Image
from playwright.sync_api import sync_playwright
BASE=os.environ.get('BELEM_E2E_ORIGIN','http://localhost:3600');accounts=json.loads(Path(os.environ.get('BELEM_E2E_ACCESS','/tmp/belem-package-e2e/demo-access.json')).read_text())['accounts'];assert all(a['email'].endswith('@belem.test') for a in accounts)
run=uuid.uuid4().hex[:6]
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);c=b.new_context(viewport={'width':390,'height':844},reduced_motion='reduce');c.route('https://fonts.googleapis.com/**',lambda r:r.abort());assert c.request.post(BASE+'/api/v1/auth/login',headers={'Origin':BASE},data={k:accounts[0][k] for k in ['email','password']}).status==200
 def api(path,data=None,method='post'):
  r=getattr(c.request,method)(BASE+'/api/v1/'+path,headers={'Origin':BASE},**({'data':data} if data is not None else {}));assert r.ok,r.text();return r.json()
 overview=api('admin/overview',method='get');package=api('admin/packages',{'name':'Pacote browser '+run,'included':1})
 p=c.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.goto(BASE+'/admin')
 def nav(name):
  p.get_by_role('button',name='Abrir menu',exact=True).click();p.get_by_role('button',name=name,exact=True).click()
 nav('Clientes e famílias');p.get_by_role('button',name='Nova cliente',exact=True).click();p.get_by_label('Nome da cliente',exact=True).fill('Cliente pacote '+run);p.get_by_label('Pacote escolhido',exact=True).select_option(package['id']);p.get_by_role('button',name='Salvar cadastro',exact=True).click();p.locator('dialog[open]').wait_for(state='hidden')
 nav('Ensaios e galerias');p.get_by_role('button',name='Novo ensaio',exact=True).click();p.get_by_label('Nome do ensaio',exact=True).fill('Ensaio pacote '+run);client=next(x for x in api('admin/overview',method='get')['clients'] if x['name']=='Cliente pacote '+run);p.get_by_label('Cliente',exact=True).select_option(client['id']);assert p.get_by_label('Pacote contratado',exact=True).input_value()==package['id'];p.get_by_role('button',name='Criar ensaio',exact=True).click();p.locator('dialog[open]').wait_for(state='hidden');p.get_by_role('heading',name='Ensaio pacote '+run,exact=True).wait_for()
 session=next(x for x in api('admin/overview',method='get')['sessions'] if x['title']=='Ensaio pacote '+run);assert session['included']==1 and session['extra_cents']==4000
 img=io.BytesIO();Image.new('RGB',(600,800),(140,160,120)).save(img,format='JPEG');photos=[]
 for i in range(2):
  r=c.request.post(BASE+'/api/v1/admin/sessions/'+session['id']+'/photos',headers={'Origin':BASE},multipart={'photos':{'name':f'FICTICIA_{i}.jpg','mimeType':'image/jpeg','buffer':img.getvalue()}});assert r.status==201;photos+=r.json()['ids']
 api('admin/sessions/'+session['id']+'/review',{'photoIds':photos,'status':'approved'},method='patch');g=api('admin/sessions/'+session['id']+'/publish',{})
 family=b.new_context(viewport={'width':320,'height':800},reduced_motion='reduce');family.route('https://fonts.googleapis.com/**',lambda r:r.abort());gp=family.new_page();gp.goto(g['url']);gp.locator('#home a[href="#gallery"]').click()
 for heart in gp.locator('.card .heart').all():heart.click()
 gp.locator('#gallery .sub').filter(has_text='1 extras (R$ 40,00 cada).').wait_for();assert gp.evaluate('document.documentElement.scrollWidth<=innerWidth');gp.locator('#gallery .fixed button').click();gp.locator('#shop .npfoot button').click();gp.locator('#review').wait_for(state='visible');assert '40,00' in gp.locator('#reviewExtras').inner_text()
 # Verify the actual threshold in the connected frontend and server, using only artificial files.
 for i in range(15):
  r=c.request.post(BASE+'/api/v1/admin/sessions/'+session['id']+'/photos',headers={'Origin':BASE},multipart={'photos':{'name':f'EXTRA_FICTICIA_{i}.jpg','mimeType':'image/jpeg','buffer':img.getvalue()}});assert r.status==201;photos+=r.json()['ids']
 api('admin/sessions/'+session['id']+'/review',{'photoIds':photos,'status':'approved'},method='patch');g=api('admin/sessions/'+session['id']+'/publish',{});gp.goto(g['url']);gp.locator('#home a[href="#gallery"]').click()
 while gp.locator('.card:not(.selected) .heart').count():gp.locator('.card:not(.selected) .heart').first.click()
 gp.locator('#gallery .sub').filter(has_text='16 extras (R$ 35,00 cada).').filter(has_text='Escolhas salvas.').wait_for();gp.locator('#gallery .fixed button').click();gp.locator('#shop .npfoot button').click();gp.locator('#review').wait_for(state='visible');assert '560,00' in gp.locator('#reviewExtras').inner_text();assert '80,00' in gp.locator('#reviewExtras').inner_text()
 nav('Lojinha');p.get_by_role('button',name='Novo produto').click();desc=p.get_by_label('Descrição',exact=True);assert 'café' in desc.input_value();p.get_by_label('Categoria',exact=True).select_option('album');assert 'filhos crescem' in desc.input_value();desc.fill('Texto personalizado do estúdio');p.get_by_label('Categoria',exact=True).select_option('frame');assert desc.input_value()=='Texto personalizado do estúdio';assert p.evaluate('document.documentElement.scrollWidth<=innerWidth');assert not errors,errors
 print('PASS: client package form, automatic session package, persisted R$40 extra, customer display and review, mobile, suggested copy preserving custom text')
 b.close()
