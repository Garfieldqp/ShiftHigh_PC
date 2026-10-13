// พอ render หน้าที่มี error มาแล้วรู้ว่าเกิดจาก field ไหน (ดู <body data-error-field="...">)
// ให้เลื่อน/โฟกัสไปที่ช่องนั้นอัตโนมัติ กันผู้ใช้ต้องไล่หาเองว่ากรอกผิดตรงไหน
document.addEventListener('DOMContentLoaded', function () {
  const field = document.body.dataset.errorField;
  if (!field) return;
  const input = document.querySelector('[name="' + field + '"]');
  if (input) {
    input.focus();
    if (input.select) input.select();
  }
});
