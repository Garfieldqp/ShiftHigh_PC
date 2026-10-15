const root=require('path').resolve(__dirname,'..');
if (!/^pc_shop_review_/.test(process.env.DB_NAME || '')) throw new Error('Use an isolated pc_shop_review_ database');
const {spawn}=require('child_process'),assert=require('assert/strict');
const server=spawn(process.execPath,['-r','ts-node/register/transpile-only','src/server.ts'],{cwd:root,env:{...process.env,PORT:'3187'},stdio:'ignore',windowsHide:true});
let count=0;const ok=(v,m)=>{assert(v,m);console.log('PASS',m);count++;};
async function req(p,c='',d){const r=await fetch('http://127.0.0.1:3187'+p,{method:d?'POST':'GET',redirect:'manual',headers:{cookie:c,...(d?{'content-type':'application/x-www-form-urlencoded'}:{})},body:d?new URLSearchParams(d):undefined});return {status:r.status,text:await r.text(),location:r.headers.get('location'),cookie:r.headers.getSetCookie().map(x=>x.split(';')[0]).join('; ')};}
async function login(e,p,staff=false){const r=await req(staff?'/staff/auth/login':'/auth/login','',{email:e,password:p});ok(r.status===302&&r.cookie.includes('access'),'login '+e);return r.cookie;}
(async()=>{try{
for(let i=0;i<80;i++){try{if((await req('/')).status===200)break;}catch{}await new Promise(r=>setTimeout(r,200));}
const c=await login('customer@example.com','customer1234');
for(const p of ['/products','/build','/cart','/orders','/build/1/status','/orders/1'])ok((await req(p,c)).status===200,'customer '+p);
for(const p of ['/build/2/status','/orders/2'])ok((await req(p,c)).status===404,'deny other owner '+p);
ok(!(await req('/build',c)).text.includes('name="quantity_'),'no quantity controls');
ok((await req('/build',c,{build_name:'HTTP test',category_1:'1',category_2:'7',quantity_1:'99'})).status===302,'create draft');
ok((await req('/cart',c)).status===200,'cart renders');ok((await req('/checkout',c)).status===200,'checkout renders');
const paid=await req('/checkout',c,{shipping_address:'Test address',payment_method:'bank_transfer'});ok(paid.status===302&&/build\/\d+\/status/.test(paid.location),'checkout success');const id=paid.location.match(/build\/(\d+)/)[1];
const staff=await login('staff@shift-high-pc.example','staff1234',true);
for(const p of ['/staff/orders','/staff/stock','/staff/reports'])ok((await req(p,staff)).status===200,'staff '+p);
const start=performance.now();await req('/staff/reports',staff);console.log('Report time ms',Math.round(performance.now()-start));
const tech=await login('technician@shift-high-pc.example','tech1234',true);
for(const p of ['/technician/queue','/technician/builds/1'])ok((await req(p,tech)).status===200,'technician '+p);
ok((await req('/admin/products',tech)).status!==200,'deny technician admin page');
ok((await req(`/technician/builds/${id}/claim`,tech,{})).status===302,'claim build');
for(const status of ['assembling','completed'])ok((await req(`/technician/builds/${id}/status`,tech,{status})).status===302,'assembly '+status);
for(const status of ['shipped','delivered'])ok((await req(`/staff/builds/${id}/status`,staff,{status,courier_name:'HTTP Courier',tracking_number:'HTTP123'})).status===302,'shipping '+status);
const finished=await req(`/build/${id}/status`,c);ok(finished.status===200&&finished.text.includes('HTTP123')&&finished.text.includes('HTTP Courier'),'customer tracking');
const mysql=require(root+'/node_modules/mysql2/promise');const db=await mysql.createConnection({host:process.env.DB_HOST||'localhost',port:+process.env.DB_PORT||3306,user:process.env.DB_USER||'root',password:process.env.DB_PASSWORD||'',database:process.env.DB_NAME});
try{const [b]=await db.query('SELECT status FROM pc_build WHERE build_id=?',[id]);ok(b[0].status==='delivered','delivered persisted');const [parts]=await db.query('SELECT quantity FROM build_item WHERE build_id=?',[id]);ok(parts.every(x=>x.quantity===1),'quantity tampering ignored');}finally{await db.end();}
const admin=await login('admin@shift-high-pc.example','admin1234',true);for(const p of ['/admin/products','/admin/employees','/staff/stock'])ok((await req(p,admin)).status===200,'admin '+p);

for(const [cookie,paths] of [[c,['/','/products','/products/1','/build','/cart','/checkout','/orders','/build/1/status','/account']], [staff,['/staff/orders','/staff/stock','/staff/reports']], [tech,['/technician/queue','/technician/builds/1']], [admin,['/admin/products','/admin/employees','/admin/products/new','/admin/products/1/edit','/staff/account']]]) {
 for(const p of paths){for(const lang of ['th','en']) {
  const page=await req(p,cookie+'; lang='+lang);ok(page.status===200 && page.text.includes('<html lang="'+lang+'">'),lang+' '+p);
  if(lang==='en') {const content=page.text.replace(/<script[\s\S]*?<\/script>/g,'').replace(/<!--[\s\S]*?-->/g,'').replace(/<[^>]*>/g,' ');const thai=content.match(/[\u0e00-\u0e7f]+(?:[ \t]+[\u0e00-\u0e7f]+)*/g); if(thai)console.log('THAI_DATA',p,JSON.stringify([...new Set(thai)]));}
  if(p==='/checkout')ok(page.text.includes(lang==='en'?'Demo system: payment is simulated.':'ระบบสาธิต: การชำระเงินเป็นการจำลอง'),'payment notice '+lang);
  if(p==='/staff/stock')ok(page.text.includes(lang==='en'?'Reserved for builds':'จองประกอบ'),'stock label '+lang);
 }
 }
}

for(const lang of ['th','en']) {
 for(const p of ['/auth/login','/auth/register','/staff/auth/login','/staff/auth/register'])ok((await req(p,'lang='+lang)).status===200,lang+' public '+p);
 const denied=await req('/build/2/status',c+'; lang='+lang);ok(denied.status===404 && denied.text===(lang==='en'?'Not found':'ไม่พบข้อมูล'),'translated ownership error '+lang);
 const bad=await req('/auth/login','lang='+lang,{email:'customer@example.com',password:'wrong'});ok(bad.text.includes(lang==='en'?'Incorrect password':'รหัสผ่านไม่ถูกต้อง') || lang==='en' && bad.text.includes('Invalid password'),'translated login error '+lang);
}
console.log(count+' HTTP checks passed');


}catch(e){console.error(e);process.exitCode=1;}finally{server.kill();}})();
