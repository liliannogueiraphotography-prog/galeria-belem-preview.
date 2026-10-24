"""Real browser/API acceptance tests. Use only the isolated fake seed database.
BELEM_E2E_ORIGIN=http://localhost:3200 BELEM_E2E_ACCESS=/tmp/belem-stage-one-e2e/demo-access.json python3 tests/browser.py
"""
import os,json,unittest,io,uuid
from pathlib import Path
from PIL import Image
from playwright.sync_api import sync_playwright
BASE=os.environ.get('BELEM_E2E_ORIGIN','http://localhost:3200')
ACCESS=Path(os.environ.get('BELEM_E2E_ACCESS','/tmp/belem-stage-one-e2e/demo-access.json'))
OUT=Path(os.environ.get('BELEM_E2E_OUTPUT','/workspace/belem-audit/stage-one'));OUT.mkdir(parents=True,exist_ok=True)
seed=json.loads(ACCESS.read_text());assert seed['local_demo_only'] is True
ACCOUNTS=seed['accounts'];assert all(a['email'].endswith('@belem.test') for a in ACCOUNTS)
img=io.BytesIO();Image.new('RGB',(600,800),(128,150,115)).save(img,format='JPEG');JPEG=img.getvalue()
RUN=uuid.uuid4().hex[:8]
class Platform(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.pw=sync_playwright().start();cls.browser=cls.pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 @classmethod
 def tearDownClass(cls):cls.browser.close();cls.pw.stop()
 def ctx(self,account=0,**options):
  c=self.browser.new_context(**options)
  c.route('https://fonts.googleapis.com/**',lambda r:r.abort())
  result=c.request.post(BASE+'/api/v1/auth/login',headers={'Origin':BASE},data={k:ACCOUNTS[account][k] for k in ['email','password']});self.assertEqual(result.status,200)
  self.addCleanup(c.close);return c
 def call(self,c,path,method='get',data=None,expected=200):
  response=getattr(c.request,method)(BASE+'/api/v1/'+path,headers={'Origin':BASE},**({'data':data} if data is not None else {}));self.assertEqual(response.status,expected,response.text());return response.json()
 def upload(self,c,session,name='ARTIFICIAL.jpg'):
  r=c.request.post(BASE+'/api/v1/admin/sessions/'+session+'/photos',headers={'Origin':BASE},multipart={'photos':{'name':name,'mimeType':'image/jpeg','buffer':JPEG}});self.assertEqual(r.status,201,r.text());return r.json()['ids'][0]
 def test_01_login_and_full_creation_publication_selection(self):
  c=self.browser.new_context(viewport={'width':1440,'height':1000});self.addCleanup(c.close)
  c.route('https://fonts.googleapis.com/**',lambda r:r.abort());p=c.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
  p.goto(BASE+'/admin');p.get_by_label('E-mail',exact=True).fill(ACCOUNTS[0]['email']);p.get_by_label('Senha',exact=True).fill(ACCOUNTS[0]['password']);p.get_by_role('button',name='Entrar no meu estúdio').click();p.get_by_role('heading',name='Histórias bem cuidadas.').wait_for()
  p.get_by_role('button',name='Clientes e famílias',exact=True).click();p.get_by_role('button',name='Nova família',exact=True).click();p.get_by_label('Nome da família').fill('E2E Família '+RUN);p.get_by_label('Observações (opcional)').fill('Somente dados artificiais');p.get_by_role('button',name='Salvar cadastro',exact=True).click();p.locator('dialog').wait_for(state='hidden')
  p.get_by_role('button',name='Nova cliente',exact=True).click();p.get_by_label('Nome da cliente').fill('E2E Cliente '+RUN);p.get_by_label('Família',exact=True).select_option(label='E2E Família '+RUN);p.get_by_label('E-mail (opcional)').fill('e2e@example.invalid');p.get_by_role('button',name='Salvar cadastro',exact=True).click();p.locator('dialog').wait_for(state='hidden')
  p.get_by_role('button',name='Pacotes',exact=True).click();p.get_by_role('button',name='Novo pacote',exact=True).first.click();p.get_by_label('Nome do pacote').fill('E2E Pacote '+RUN);p.get_by_label('Fotografias incluídas').fill('2');p.get_by_label('Fotografia adicional (R$)').fill('15.50');p.get_by_role('button',name='Salvar cadastro',exact=True).click();p.locator('dialog').wait_for(state='hidden')
  p.get_by_role('button',name='Ensaios e galerias',exact=True).click();p.get_by_role('button',name='Novo ensaio',exact=True).click();p.get_by_label('Nome do ensaio').fill('E2E Ensaio '+RUN);p.get_by_label('Cliente',exact=True).select_option(label='E2E Cliente '+RUN+' · E2E Família '+RUN);p.get_by_label('Pacote contratado').select_option(label='E2E Pacote '+RUN+' · 2 fotos');p.get_by_role('button',name='Criar ensaio',exact=True).click();p.locator('dialog').wait_for(state='hidden')
  p.get_by_role('heading',name='E2E Ensaio '+RUN).wait_for();p.locator('input[type=file]').set_input_files([{'name':f'E2E_{n}.jpg','mimeType':'image/jpeg','buffer':JPEG} for n in [1,2,3]])
  p.locator('.photo-card').nth(2).wait_for();p.get_by_label('Selecionar E2E_1.jpg',exact=True).check();p.get_by_label('Selecionar E2E_2.jpg',exact=True).check();p.get_by_role('button',name='Aprovar',exact=True).click();p.locator('.status-badge.approved').nth(1).wait_for()
  p.get_by_role('button',name='Publicar galeria',exact=True).click();p.get_by_label('Link privado da galeria').wait_for();link=p.get_by_label('Link privado da galeria').input_value();p.get_by_role('button',name='Fechar janela').click()
  p.screenshot(path=str(OUT/'review-desktop.png'),full_page=True)
  overview=self.call(c,'admin/overview');session=next(s for s in overview['sessions'] if s['title']=='E2E Ensaio '+RUN);self.assertEqual(session['included'],2);self.assertEqual(session['extra_cents'],1550)
  gc=self.browser.new_context();self.addCleanup(gc.close);gc.route('https://fonts.googleapis.com/**',lambda r:r.abort());gp=gc.new_page();gerrors=[];gp.on('pageerror',lambda e:gerrors.append(str(e)));gp.goto(link);gp.locator('#star-intro').wait_for(state='hidden');gp.locator('#home a[href="#gallery"]').click();self.assertEqual(gp.locator('.card').count(),2)
  gp.locator('.card:first-child .heart').click();gp.locator('#gallery .sub').filter(has_text='Escolhas salvas.').wait_for();self.assertEqual(gp.locator('#count').inner_text(),'1')
  context=self.call(gc,'gallery/'+session['gallery_id']);self.assertEqual(len(context['selectedPhotoIds']),1);self.assertTrue(all('original' not in ph['url'] for ph in context['photos']))
  gc.close()
  # A new browser context has no localStorage or cookies: re-entering the link recovers server data.
  restored=self.browser.new_context();self.addCleanup(restored.close);restored.route('https://fonts.googleapis.com/**',lambda r:r.abort());rp=restored.new_page();rp.add_init_script("Object.defineProperty(window,'localStorage',{get(){throw new DOMException('TEST','SecurityError')}})");rp.goto(link);rp.locator('#star-intro').wait_for(state='hidden');rp.locator('#home a[href="#gallery"]').click();self.assertEqual(rp.locator('#count').inner_text(),'1')
  rp.locator('.card:nth-child(2) .heart').click();rp.locator('#gallery .sub').filter(has_text='Escolhas salvas.').wait_for();selection=self.call(c,'admin/galleries/'+session['gallery_id']+'/selection');self.assertEqual(len(selection['selection']['photoIds']),2)
  # Conflict protection: stale revision cannot erase saved choices.
  result=restored.request.put(BASE+'/api/v1/gallery/'+session['gallery_id']+'/selection',headers={'Origin':BASE},data={'photoIds':[],'revision':0});self.assertEqual(result.status,409)
  rp.locator('.card:first-child .zoom').click();self.assertEqual(rp.locator('#photoViewer').get_attribute('role'),'dialog');rp.keyboard.press('Tab');self.assertTrue(rp.evaluate('document.activeElement.closest("#photoViewer")!==null'));rp.keyboard.press('Escape')
  rp.screenshot(path=str(OUT/'connected-gallery.png'),full_page=True)
  self.assertEqual(errors,[]);self.assertEqual(gerrors,[])
 def test_02_tenant_authorization_and_private_storage(self):
  a=self.ctx(0);b=self.ctx(1);da=self.call(a,'admin/overview');db=self.call(b,'admin/overview');self.assertNotIn(da['clients'][0]['id'],json.dumps(db));s=next(x for x in da['sessions'] if x['gallery_active']);details=self.call(a,'admin/sessions/'+s['id']);photo=details['photos'][0]
  self.call(b,'admin/sessions/'+s['id'],expected=404)
  self.call(b,'admin/clients','post',{'name':'Tentativa artificial','familyId':da['families'][0]['id']},404)
  self.call(b,'admin/sessions/'+s['id']+'/publish','post',{},404)
  self.call(b,'admin/galleries/'+s['gallery_id']+'/link',expected=404)
  r=b.request.get(BASE+'/api/v1/admin/photos/'+photo['id']+'/preview');self.assertEqual(r.status,404)
  self.call(b,'auth/studio','post',{'studioId':ACCOUNTS[0]['studioId']},403)
  guest=self.browser.new_context();self.addCleanup(guest.close)
  for url in ['/api/v1/admin/overview','/api/v1/admin/photos/'+photo['id']+'/preview','/api/v1/gallery/'+s['gallery_id']]:self.assertEqual(guest.request.get(BASE+url).status,401)
  for url in ['/objects/'+photo['id']+'.original','/studio.sqlite','/demo-access.json','/.env','/index.html'] :self.assertEqual(guest.request.get(BASE+url).status,404)
 def test_03_two_families_same_studio_are_isolated(self):
  c=self.ctx();d=self.call(c,'admin/overview');active=next(x for x in d['sessions'] if x['gallery_active']);link=self.call(c,'admin/galleries/'+active['gallery_id']+'/link')['url']
  session=self.call(c,'admin/sessions','post',{'title':'E2E outra família '+RUN,'clientId':next(v['id'] for v in d['clients'] if v['family_id']!=next(x['family_id'] for x in d['clients'] if x['id']==active['client_id'])),'packageId':d['packages'][0]['id']},201)['id'];photo=self.upload(c,session);self.call(c,'admin/sessions/'+session+'/review','patch',{'photoIds':[photo],'status':'approved'});other=self.call(c,'admin/sessions/'+session+'/publish','post',{})
  gc=self.browser.new_context();self.addCleanup(gc.close);r=gc.request.get(link);self.assertEqual(r.status,200)
  self.assertEqual(gc.request.get(BASE+'/api/v1/gallery/'+other['id']).status,401)
  self.assertEqual(gc.request.get(BASE+'/api/v1/gallery/'+active['gallery_id']+'/photos/'+photo).status,404)
 def test_04_publication_revocation_and_invalid_upload(self):
  c=self.ctx();d=self.call(c,'admin/overview');session=self.call(c,'admin/sessions','post',{'title':'E2E revogação '+RUN,'clientId':d['clients'][0]['id'],'packageId':d['packages'][0]['id']},201)['id']
  self.call(c,'admin/sessions/'+session+'/publish','post',{},400)
  bad=c.request.post(BASE+'/api/v1/admin/sessions/'+session+'/photos',headers={'Origin':BASE},multipart={'photos':{'name':'attack.svg','mimeType':'image/svg+xml','buffer':b'<svg xmlns="http://www.w3.org/2000/svg"><script>1</script></svg>'}});self.assertEqual(bad.status,400)
  self.assertEqual(len(self.call(c,'admin/sessions/'+session)['photos']),0)
  photo=self.upload(c,session);self.call(c,'admin/sessions/'+session+'/review','patch',{'photoIds':[photo],'status':'approved'});g=self.call(c,'admin/sessions/'+session+'/publish','post',{});gc=self.browser.new_context();self.addCleanup(gc.close);self.assertEqual(gc.request.get(g['url']).status,200)
  self.call(c,'admin/sessions/'+session+'/review','patch',{'photoIds':[photo],'status':'rejected'})
  self.assertEqual(gc.request.get(BASE+'/api/v1/gallery/'+g['id']).status,401);self.assertEqual(gc.request.get(g['url']).status,404)
 def test_05_csrf_invalid_login_logout_and_cookie(self):
  c=self.browser.new_context();self.addCleanup(c.close)
  for headers in [{},{'Origin':'https://attacker.invalid'}]:self.assertEqual(c.request.post(BASE+'/api/v1/auth/login',headers=headers,data={'email':ACCOUNTS[0]['email'],'password':ACCOUNTS[0]['password']}).status,403)
  r=c.request.post(BASE+'/api/v1/auth/login',headers={'Origin':BASE},data={'email':ACCOUNTS[0]['email'],'password':'incorrect-test-value'});self.assertEqual(r.status,401)
  a=self.ctx();cookie=next(v for v in a.cookies() if v['name']=='belem_admin');self.assertTrue(cookie['httpOnly']);self.assertEqual(cookie['sameSite'],'Lax')
  self.call(a,'auth/logout','post',{});self.call(a,'auth/me',expected=401)
 def test_06_mobile_navigation_forms_review(self):
  for w,h in [(320,568),(390,844),(768,1024),(844,390)]:
   with self.subTest(viewport=(w,h)):
    c=self.ctx(viewport={'width':w,'height':h},is_mobile=True,has_touch=True);p=c.new_page();p.goto(BASE+'/admin');p.get_by_role('heading',name='Histórias bem cuidadas.').wait_for();p.wait_for_timeout(300)
    self.assertFalse(p.evaluate('document.documentElement.scrollWidth>innerWidth'))
    if w<=760:p.get_by_role('button',name='Abrir menu').click()
    p.get_by_role('button',name='Ensaios e galerias',exact=True).click();p.locator('.session-card').first.click();p.get_by_role('heading',name='Um olhar de cada vez.').wait_for();self.assertFalse(p.evaluate('document.documentElement.scrollWidth>innerWidth'))
    p.screenshot(path=str(OUT/f'review-mobile-{w}.png'),full_page=True)
    if w<=760:p.get_by_role('button',name='Abrir menu').click()
    p.get_by_role('button',name='Clientes e famílias',exact=True).click();p.get_by_role('button',name='Nova família',exact=True).click();p.get_by_label('Nome da família').fill('E2E móvel '+RUN+' '+str(w));p.get_by_role('button',name='Salvar cadastro',exact=True).click();p.locator('dialog').wait_for(state='hidden');self.assertFalse(p.evaluate('document.documentElement.scrollWidth>innerWidth'))
 def test_07_connected_gallery_slides_audio_history_and_mobile(self):
  c=self.ctx();d=self.call(c,'admin/overview');session=next(x for x in d['sessions'] if x['gallery_active'] and x['approved_count']>=2);link=self.call(c,'admin/galleries/'+session['gallery_id']+'/link')['url']
  gc=self.browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);self.addCleanup(gc.close);gc.route('https://fonts.googleapis.com/**',lambda r:r.abort());p=gc.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
  p.goto(link);p.locator('#star-intro').wait_for(state='hidden');p.locator('#home a[href="#slides"]').click();p.locator('#pause').click();p.wait_for_function('belemAudio.readyState>=2');p.wait_for_function('slideImg.naturalWidth>0');p.locator('#pause').click();p.wait_for_function('!belemAudio.paused');p.locator('#pause').click();self.assertTrue(p.evaluate('belemAudio.paused'));p.locator('#nextSlide').click();p.locator('.skip-gallery').click();self.assertTrue(p.locator('#gallery').is_visible());self.assertFalse(p.locator('#slides').is_visible())
  self.assertFalse(p.evaluate('document.documentElement.scrollWidth>innerWidth'));p.screenshot(path=str(OUT/'gallery-mobile.png'),full_page=True)
  p.reload();self.assertTrue(p.locator('#gallery').is_visible());p.locator('#gallery a[href="#slides"]').click();p.locator('.close-slides').click();self.assertTrue(p.locator('#home').is_visible());self.assertFalse(p.locator('#slides').is_visible());self.assertEqual(errors,[])
 def test_08_edit_forms_and_contract_snapshot(self):
  c=self.ctx();d=self.call(c,'admin/overview');family=self.call(c,'admin/families','post',{'name':'Editar fictícia '+RUN},201)['id'];client=self.call(c,'admin/clients','post',{'name':'Cliente editável '+RUN,'familyId':family},201)['id'];package=self.call(c,'admin/packages','post',{'name':'Contrato inicial '+RUN,'included':3,'extraCents':1000},201)['id'];session=self.call(c,'admin/sessions','post',{'title':'Contrato preservado '+RUN,'clientId':client,'packageId':package},201)['id']
  self.call(c,'admin/families/'+family,'patch',{'name':'Família atualizada '+RUN});self.call(c,'admin/clients/'+client,'patch',{'name':'Cliente atualizada '+RUN,'familyId':family,'email':'edited@example.invalid'});self.call(c,'admin/packages/'+package,'patch',{'name':'Catálogo atualizado '+RUN,'included':20,'extraCents':9999});self.call(c,'admin/sessions/'+session,'patch',{'title':'Nome revisado '+RUN,'clientId':client,'packageId':package});detail=self.call(c,'admin/sessions/'+session);self.assertEqual(detail['session']['included'],3);self.assertEqual(detail['session']['extra_cents'],1000)
  p=c.new_page();p.goto(BASE+'/admin');p.get_by_role('heading',name='Histórias bem cuidadas.').wait_for();p.get_by_role('button',name='Clientes e famílias',exact=True).click();card=p.locator('.family-card').filter(has=p.get_by_role('heading',name='Família atualizada '+RUN,exact=True));card.get_by_role('button',name='Editar família',exact=True).click();self.assertEqual(p.get_by_label('Nome da família').input_value(),'Família atualizada '+RUN);p.get_by_label('Nome da família').fill('Família editada pela interface '+RUN);p.get_by_role('button',name='Salvar cadastro',exact=True).click();p.locator('dialog').wait_for(state='hidden');p.get_by_role('heading',name='Família editada pela interface '+RUN).wait_for()
 def test_09_password_change_revokes_other_sessions(self):
  a=self.ctx(1);other=self.ctx(1);old=ACCOUNTS[1]['password'];new='Only-test-'+uuid.uuid4().hex
  self.call(a,'auth/password','post',{'current':'incorrect','password':new},400)
  self.call(a,'auth/password','post',{'current':old,'password':'short'},400)
  self.call(a,'auth/password','post',{'current':old,'password':new})
  changed=self.browser.new_context();self.addCleanup(changed.close)
  try:
   self.call(other,'auth/me',expected=401)
   response=changed.request.post(BASE+'/api/v1/auth/login',headers={'Origin':BASE},data={'email':ACCOUNTS[1]['email'],'password':new});self.assertEqual(response.status,200)
  finally:
   # Restore the isolated fake account, never modifying the navigable demo account.
   changed.request.post(BASE+'/api/v1/auth/login',headers={'Origin':BASE},data={'email':ACCOUNTS[1]['email'],'password':new})
   result=changed.request.post(BASE+'/api/v1/auth/password',headers={'Origin':BASE},data={'current':new,'password':old});self.assertEqual(result.status,200)
if __name__=='__main__':unittest.main(verbosity=2)
